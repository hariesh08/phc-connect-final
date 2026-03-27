import { NavLink, useNavigate } from "react-router-dom";
import { Activity, LogOut, User, ChevronDown } from "lucide-react";
import { useState } from "react";

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
  roleLabel: string;
  sidebarItems: SidebarItem[];
}

const DashboardLayout = ({ children, role, roleLabel, sidebarItems }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="glass-sidebar w-60 flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sm">PHC Connect</div>
              <div className="text-[10px] text-muted-foreground">{roleLabel}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Profile */}
        <div className="p-3 border-t border-border/50 relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-secondary-foreground" />
            </div>
            <span className="text-sm font-medium flex-1 text-left">User</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 glass-card p-1 shadow-lg animate-fade-in">
              <button
                onClick={() => navigate(`/${role}/profile`)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
