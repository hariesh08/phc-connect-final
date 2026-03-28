import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Role = "doctor" | "phc_admin" | "ddhs_admin";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role | null;
  district_id: string | null;
  phc_id: string | null;
  status: "pending" | "active" | "rejected";
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Global promise to ensure initialization only happens once across re-mounts
let initPromise: Promise<void> | null = null;
let globalSubscription: { unsubscribe: () => void } | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetching = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    if (profileFetching.current === userId) return;
    profileFetching.current = userId;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
        
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user profile:", error);
      }
      
      setProfile(data as UserProfile || null);
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
    } finally {
      profileFetching.current = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!initPromise) {
        initPromise = (async () => {
          try {
            // 1. Get initial session strictly once
            const { data: { session: initialSession } } = await supabase.auth.getSession();
            
            // 2. Set up listener once
            const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
               // This listener will update state globally if we had a shared observer,
               // but here we just need to make sure the promise completes.
            });
            globalSubscription = data.subscription;
          } catch (e) {
            console.error("Global auth init failed", e);
          }
        })();
      }

      await initPromise;
      
      // Re-fetch current state to sync this specific component instance
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }

      // Sync future changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        if (event === "INITIAL_SESSION") return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    const cleanupPromise = bootstrap();

    return () => {
      mounted = false;
      // Note: we don't unsubscribe globalSubscription because it's shared
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
