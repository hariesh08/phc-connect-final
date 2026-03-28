import { useNavigate } from "react-router-dom";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

const roleLabels: Record<string, string> = {
  doctor: "Doctor",
  phc_admin: "PHC Admin",
  ddhs_admin: "DDHS Admin",
};

const ApprovalPending = () => {
  const navigate = useNavigate();
  const { profile, signOut, loading, session } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !session) {
      navigate("/login", { replace: true });
    }
  }, [loading, session, navigate]);

  // Redirect if approved or rejected
  useEffect(() => {
    if (!loading && profile) {
      if (profile.status === "active") {
        if (profile.role === "doctor") navigate("/doctor", { replace: true });
        else if (profile.role === "phc_admin") navigate("/phc", { replace: true });
        else if (profile.role === "ddhs_admin") navigate("/ddhs", { replace: true });
      }
      if (profile.status === "rejected") {
        navigate("/approval-rejected", { replace: true });
      }
    }
  }, [loading, profile, navigate]);

  // Realtime: auto-redirect when status changes
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase.channel('approval-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${profile.id}` }, (payload) => {
        const newStatus = payload.new?.status;
        const role = payload.new?.role;
        if (newStatus === "active") {
          if (role === "doctor") navigate("/doctor", { replace: true });
          else if (role === "phc_admin") navigate("/phc", { replace: true });
          else navigate("/", { replace: true });
        } else if (newStatus === "rejected") {
          navigate("/approval-rejected", { replace: true });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, navigate]);

  const { data: details } = useQuery({
    queryKey: ["approval-details", profile?.district_id, profile?.phc_id],
    enabled: !!profile,
    queryFn: async () => {
      let districtName = "—";
      let phcName = "—";
      if (profile?.district_id) {
        const { data } = await supabase.from("districts").select("name").eq("id", profile.district_id).maybeSingle();
        districtName = data?.name || "—";
      }
      if (profile?.phc_id) {
        const { data } = await supabase.from("phcs").select("name").eq("id", profile.phc_id).maybeSingle();
        phcName = data?.name || "—";
      }
      return { districtName, phcName };
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Account Approval Pending</h1>
          <p className="text-sm text-muted-foreground">
            Your account is waiting for approval from an administrator.
          </p>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="text-sm font-medium capitalize">
              {profile?.role ? roleLabels[profile.role] || profile.role : "—"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">District</span>
            <span className="text-sm font-medium">{details?.districtName || "—"}</span>
          </div>
          {profile?.phc_id && (
            <div className="flex justify-between py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">PHC</span>
              <span className="text-sm font-medium">{details?.phcName || "—"}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-warning/10 text-warning">
              Pending Approval
            </span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ApprovalPending;
