import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to appropriate dashboard
    if (role === "doctor") navigate("/doctor");
    else if (role === "phc_admin") navigate("/phc");
    else if (role === "ddhs_admin") navigate("/ddhs");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
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
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>

          {!isRegister && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" />
            </div>
          )}

          {isRegister && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="Enter phone number" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Create a password" />
              </div>

              {role === "doctor" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input id="qualification" placeholder="e.g., MBBS, MD" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input id="specialization" placeholder="e.g., General Medicine" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience (years)</Label>
                    <Input id="experience" type="number" placeholder="e.g., 5" />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                {role === "ddhs_admin" ? (
                  <Input id="district" placeholder="Enter district name" />
                ) : (
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dist1">District 1</SelectItem>
                      <SelectItem value="dist2">District 2</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {(role === "doctor" || role === "phc_admin") && (
                <div className="space-y-2">
                  <Label htmlFor="phc">PHC</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PHC" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phc1">PHC 1</SelectItem>
                      <SelectItem value="phc2">PHC 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <Button type="submit" className="w-full">
            {isRegister ? "Register" : "Login"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
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
