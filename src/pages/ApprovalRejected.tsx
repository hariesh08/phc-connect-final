import { useNavigate } from "react-router-dom";
import { XCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const ApprovalRejected = () => {
  const { signOut, profile, loading, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/login", { replace: true });
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!loading && profile) {
      if (profile.status === "active") {
        if (profile.role === "doctor") navigate("/doctor", { replace: true });
        else if (profile.role === "phc_admin") navigate("/phc", { replace: true });
        else if (profile.role === "ddhs_admin") navigate("/ddhs", { replace: true });
      }
      if (profile.status === "pending") {
        navigate("/approval-pending", { replace: true });
      }
    }
  }, [loading, profile, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Account Request Rejected</h1>
          <p className="text-sm text-muted-foreground">
            Your account request has been rejected by an administrator.
            Please contact your supervisor for more information.
          </p>
        </div>

        <Button variant="outline" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ApprovalRejected;
