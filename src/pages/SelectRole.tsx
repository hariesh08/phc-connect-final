import { useNavigate } from "react-router-dom";
import { Stethoscope, Building2, BarChart3, MessageSquare, Activity } from "lucide-react";

const roles = [
  {
    id: "doctor",
    title: "Doctor",
    description: "Mark attendance, manage patients, view medicine stock",
    icon: Stethoscope,
  },
  {
    id: "phc_admin",
    title: "PHC Admin",
    description: "Manage PHC operations, doctors, and inventory",
    icon: Building2,
  },
  {
    id: "ddhs_admin",
    title: "DDHS Admin",
    description: "District-level monitoring, PHC management, rankings",
    icon: BarChart3,
  },
  {
    id: "public",
    title: "Public Feedback",
    description: "Submit feedback about PHC services",
    icon: MessageSquare,
  },
];

const SelectRole = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (roleId: string) => {
    if (roleId === "public") {
      navigate("/public-feedback");
    } else {
      navigate(`/login?role=${roleId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Select your role</h1>
          <p className="text-sm text-muted-foreground">Choose how you'd like to access PHC Connect</p>
        </div>

        {/* Role Cards */}
        <div className="space-y-3">
          {roles.map((role, i) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className="w-full glass-card-hover p-5 flex items-center gap-4 text-left"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <role.icon className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <div className="font-medium text-sm">{role.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{role.description}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("/")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto block"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
};

export default SelectRole;
