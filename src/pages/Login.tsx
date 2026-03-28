import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  doctor: "Doctor",
  phc_admin: "PHC Admin",
  ddhs_admin: "DDHS Admin",
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "doctor";
  
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  
  // Database State for Dropdowns
  const [districts, setDistricts] = useState<any[]>([]);
  const [phcs, setPhcs] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedPhc, setSelectedPhc] = useState("");
  const [newDistrictName, setNewDistrictName] = useState("");

  const { loading: authLoading } = useAuth();
  
  useEffect(() => {
    if (isRegister && !authLoading) {
      loadDistricts();
    }
  }, [isRegister, authLoading]);

  useEffect(() => {
    if (selectedDistrict && role !== "ddhs_admin" && !authLoading) {
      loadPhcs(selectedDistrict);
    }
  }, [selectedDistrict, role, authLoading]);

  const loadDistricts = async () => {
    const { data, error } = await supabase.from("districts").select("*").order("name");
    if (error) {
      toast.error("Failed to load districts: " + error.message);
    } else {
      setDistricts(data || []);
    }
  };

  const loadPhcs = async (districtId: string) => {
    const { data, error } = await supabase
      .from("phcs")
      .select("*")
      .eq("district_id", districtId)
      .order("name");
    if (error) {
      toast.error("Failed to load PHCs: " + error.message);
    } else {
      setPhcs(data || []);
    }
  };

  const handleRegister = async () => {
    // 1. Validate inputs
    if (!name || !email || !password || !phone) throw new Error("Please fill in all basic fields.");
    
    let districtId = selectedDistrict;

    // DDHS Admin needs to create a district first if they are registering
    if (role === "ddhs_admin") {
      if (!newDistrictName) throw new Error("District Name is required.");
      
      const { data: existingDist } = await supabase
        .from("districts")
        .select("id")
        .eq("name", newDistrictName)
        .single();
        
      if (existingDist) {
        throw new Error("District name already exists. Please choose a unique name.");
      }
      
      // We will create the district AFTER user creation to link ddhs_admin_id properly
    } else {
      if (!districtId) throw new Error("Please select a district.");
      if (!selectedPhc) throw new Error("Please select a PHC.");
    }

    if (role === "doctor") {
      if (!qualification || !specialization || !experience) throw new Error("Please fill in all doctor details.");
    }

    // 2. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Registration failed - no user returned.");

    const userId = authData.user.id;
    const initialStatus = role === "ddhs_admin" ? "active" : "pending";

    try {
      // 3. Insert into custom Users table FIRST (with district_id=null for DDHS)
      // This satisfies the fk_ddhs_admin dependency in districts table
      const { error: userError } = await supabase.from("users").insert({
        id: userId,
        name,
        email,
        phone,
        role,
        district_id: role !== "ddhs_admin" ? districtId : null,
        phc_id: role !== "ddhs_admin" ? selectedPhc : null,
        status: initialStatus,
      });

      if (userError) throw new Error("Failed to save user details: " + userError.message);

      // 4. If DDHS, create the district NOW and get the ID
      if (role === "ddhs_admin") {
        // Double check if district exists (database-side unique constraint will also catch this)
        const { data: existingDist } = await supabase
          .from("districts")
          .select("id")
          .eq("name", newDistrictName)
          .maybeSingle();

        if (existingDist) {
          throw new Error("District '" + newDistrictName + "' is already registered. Please use a unique name.");
        }

        const { data: newDist, error: distError } = await supabase
          .from("districts")
          .insert({ name: newDistrictName, ddhs_admin_id: userId })
          .select()
          .maybeSingle();
          
        if (distError) {
          if (distError.code === "23505") {
            throw new Error("District already registered. Please choose a different name.");
          }
          throw new Error("Failed to create district: " + distError.message);
        }
        
        if (!newDist) throw new Error("Failed to create district - no data returned.");
        districtId = newDist.id;

        // 5. Update user profile with the new district ID
        const { error: updateError } = await supabase
          .from("users")
          .update({ district_id: districtId })
          .eq("id", userId);
          
        if (updateError) throw new Error("Failed to link district to your profile: " + updateError.message);
      }

      // 6. If Doctor, insert into doctors table
      if (role === "doctor") {
        const { error: docError } = await supabase.from("doctors").insert({
          user_id: userId,
          phc_id: selectedPhc,
          qualification,
          specialization,
          experience,
        });
        if (docError) throw new Error("Failed to save doctor details: " + docError.message);
      }

      toast.success(
        initialStatus === "pending" 
          ? "Registration successful! Your account is pending admin approval." 
          : "Registration successful!"
      );
      
      // Optional: Redirect back to login so they can sign in 
      // (Supabase auto-signs in if email verification is off, but status might be pending)
      setIsRegister(false);
      
    } catch (dbError: any) {
      // If DB inserts fail after Auth succeeds, we might have an orphaned Auth user. 
      // Handling that robustly is hard on the frontend, but we show the error.
      throw dbError;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Task 7: Mutex protection
    setLoading(true);

    if (!supabase) {
      toast.error("Supabase is not configured. Check your .env file.");
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        await handleRegister();
      } else {
        // Step 1: Login user
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        if (!authData.session) throw new Error("Login failed - no session returned.");

        const session = authData.session;

        // Step 2: Fetch profile with status
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, status")
          .eq("id", session.user.id)
          .maybeSingle();
          
        if (userError) {
           throw new Error("Error fetching user profile: " + userError.message);
        }
        
        if (!userData) {
          throw new Error("User profile not found. Please contact your administrator.");
        }
        
        // Step 3: Stop loading BEFORE navigating to prevent stuck spinner
        setLoading(false);

        // Step 4: Check approval status first
        const fetchedRole = userData.role;
        const fetchedStatus = userData.status;

        if (fetchedStatus === "pending" && fetchedRole !== "ddhs_admin") {
          navigate("/approval-pending");
          return;
        }
        if (fetchedStatus === "rejected") {
          navigate("/approval-rejected");
          return;
        }

        // Step 5: Route based on role (only if approved)
        if (fetchedRole === "doctor") navigate("/doctor");
        else if (fetchedRole === "phc_admin") navigate("/phc");
        else if (fetchedRole === "ddhs_admin") navigate("/ddhs");
        else navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {isRegister ? "Register" : "Login"} as {roleLabels[role]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRegister ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {isRegister && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" required />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" type="email" placeholder="Enter your email" 
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" type="password" 
                placeholder={isRegister ? "Create a password" : "Enter your password"} 
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-4 pt-2 border-t mt-4">
              {role === "doctor" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input id="qualification" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g., MBBS, MD" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input id="specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g., General Medicine" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience (years)</Label>
                    <Input id="experience" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g., 5" required />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                {role === "ddhs_admin" ? (
                  <Input 
                    id="district" 
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                    placeholder="Enter new district name" 
                    required 
                  />
                ) : (
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                      {districts.length === 0 && <SelectItem value="none" disabled>No districts available</SelectItem>}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {(role === "doctor" || role === "phc_admin") && (
                <div className="space-y-2">
                  <Label htmlFor="phc">PHC</Label>
                  <Select value={selectedPhc} onValueChange={setSelectedPhc} disabled={!selectedDistrict} required>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedDistrict ? "Select PHC" : "Select District first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {phcs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                      {phcs.length === 0 && selectedDistrict && <SelectItem value="none" disabled>No PHCs available in this district</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isRegister ? "Register" : "Login"}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRegister ? "Already have an account? Login here" : "Don't have an account? Register"}
            </button>
          </div>
        </form>

        <button
          onClick={() => navigate("/select-role")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto block"
        >
          ← Change role
        </button>
      </div>
    </div>
  );
};

export default Login;
