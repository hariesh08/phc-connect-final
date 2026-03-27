import { useNavigate } from "react-router-dom";
import { Activity, Shield, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="glass-sidebar px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight">PHC Connect</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/select-role")}>
          Get Started
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
            <Shield className="h-3.5 w-3.5" />
            Government Healthcare Platform
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
            Smart Healthcare
            <br />
            <span className="text-muted-foreground">Monitoring System</span>
          </h1>
          
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            Connecting DDHS, PHCs and Doctors for real-time monitoring, 
            attendance tracking, and healthcare delivery.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/select-role")} className="px-8">
              Enter Platform
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/public-feedback")}>
              Public Feedback
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 max-w-lg mx-auto">
            {[
              { label: "Districts", value: "—" },
              { label: "PHCs", value: "—" },
              { label: "Doctors", value: "—" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/50">
        <div className="flex items-center justify-center gap-1">
          <Heart className="h-3 w-3" />
          PHC Connect — Smart Healthcare Monitoring System
        </div>
      </footer>
    </div>
  );
};

export default Landing;
