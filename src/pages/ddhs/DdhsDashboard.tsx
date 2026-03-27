import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  LayoutDashboard,
  Building2,
  Users,
  Clock,
  Map,
  BarChart3,
  MessageSquare,
  Pill,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", path: "/ddhs", icon: LayoutDashboard },
  { label: "PHC Management", path: "/ddhs/phcs", icon: Building2 },
  { label: "Doctors", path: "/ddhs/doctors", icon: Users },
  { label: "Attendance", path: "/ddhs/attendance", icon: Clock },
  { label: "PHC Ranking", path: "/ddhs/ranking", icon: BarChart3 },
  { label: "PHC Map", path: "/ddhs/map", icon: Map },
  { label: "Medicine", path: "/ddhs/medicine", icon: Pill },
  { label: "Feedback", path: "/ddhs/feedback", icon: MessageSquare },
  { label: "Profile", path: "/ddhs/profile", icon: UserCheck },
];

const DashboardHome = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">DDHS Dashboard</h1>
      <p className="page-subtitle">District Health Services Overview</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard title="Total PHCs" value="24" icon={<Building2 className="h-4 w-4" />} />
      <StatCard title="Total Doctors" value="156" icon={<Users className="h-4 w-4" />} />
      <StatCard title="Avg Attendance" value="87%" icon={<Clock className="h-4 w-4" />} />
      <StatCard title="Active Alerts" value="5" icon={<AlertTriangle className="h-4 w-4" />} />
      <StatCard title="Avg PHC Score" value="74" subtitle="Out of 100" icon={<BarChart3 className="h-4 w-4" />} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-6">
        <h3 className="font-medium text-sm mb-4">PHC Performance</h3>
        <div className="space-y-3">
          {[
            { name: "PHC Ranchi North", score: 92, doctors: 8 },
            { name: "PHC Ranchi South", score: 78, doctors: 6 },
            { name: "PHC Kanke", score: 65, doctors: 4 },
            { name: "PHC Namkum", score: 55, doctors: 3 },
          ].map((phc) => (
            <div key={phc.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <div className="text-sm font-medium">{phc.name}</div>
                <div className="text-xs text-muted-foreground">{phc.doctors} doctors</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${phc.score}%` }} />
                </div>
                <span className="text-sm font-mono font-medium w-8 text-right">{phc.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-medium text-sm mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          {[
            { type: "Attendance", msg: "Dr. Patel absent 3 consecutive days", severity: "high" },
            { type: "Medicine", msg: "Amoxicillin low at PHC Kanke", severity: "medium" },
            { type: "Emergency", msg: "Ambulance requested - PHC Namkum", severity: "high" },
          ].map((alert, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
              <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${alert.severity === "high" ? "text-destructive" : "text-warning"}`} />
              <div>
                <div className="text-sm font-medium">{alert.type}</div>
                <div className="text-xs text-muted-foreground">{alert.msg}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const PhcManagement = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="page-header">PHC Management</h1>
        <p className="page-subtitle">Manage Primary Health Centres in your district</p>
      </div>
      <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
        + Create PHC
      </button>
    </div>
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Code</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Admin</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Doctors</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Score</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: "PHC Ranchi North", code: "RN001", admin: "Sita Devi", doctors: 8, status: "Active", score: 92 },
            { name: "PHC Ranchi South", code: "RS002", admin: "Admin Not Assigned", doctors: 6, status: "Active", score: 78 },
            { name: "PHC Kanke", code: "KK003", admin: "Ram Kumar", doctors: 4, status: "Maintenance", score: 65 },
            { name: "PHC Namkum", code: "NK004", admin: "Admin Not Assigned", doctors: 0, status: "Closed", score: 0 },
          ].map((phc) => (
            <tr key={phc.code} className="border-b border-border/30 last:border-0">
              <td className="p-4 text-sm font-medium">{phc.name}</td>
              <td className="p-4 text-sm font-mono text-muted-foreground">{phc.code}</td>
              <td className="p-4 text-sm text-muted-foreground">{phc.admin}</td>
              <td className="p-4 text-sm text-muted-foreground">{phc.doctors}</td>
              <td className="p-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  phc.status === "Active" ? "bg-success/10 text-success" :
                  phc.status === "Maintenance" ? "bg-warning/10 text-warning" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {phc.status}
                </span>
              </td>
              <td className="p-4 text-sm font-mono">{phc.doctors > 0 ? phc.score : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const RankingPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">PHC Ranking</h1>
      <p className="page-subtitle">Performance ranking of PHCs (excludes PHCs with no doctors)</p>
    </div>
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Rank</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">PHC</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Score</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Attendance</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Doctors</th>
          </tr>
        </thead>
        <tbody>
          {[
            { rank: 1, name: "PHC Ranchi North", score: 92, attendance: "95%", doctors: 8 },
            { rank: 2, name: "PHC Ranchi South", score: 78, attendance: "82%", doctors: 6 },
            { rank: 3, name: "PHC Kanke", score: 65, attendance: "70%", doctors: 4 },
          ].map((phc) => (
            <tr key={phc.rank} className="border-b border-border/30 last:border-0">
              <td className="p-4 text-sm font-bold">#{phc.rank}</td>
              <td className="p-4 text-sm font-medium">{phc.name}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${phc.score}%` }} />
                  </div>
                  <span className="text-sm font-mono">{phc.score}</span>
                </div>
              </td>
              <td className="p-4 text-sm text-muted-foreground">{phc.attendance}</td>
              <td className="p-4 text-sm text-muted-foreground">{phc.doctors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MapPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">PHC Map</h1>
      <p className="page-subtitle">Geographic view of PHCs</p>
    </div>
    <div className="glass-card p-6">
      <div className="h-96 rounded-xl bg-secondary flex items-center justify-center">
        <div className="text-center space-y-2">
          <Map className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Google Maps integration required</p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> All Present</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Partial</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> None Present</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" /> No Doctors</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PlaceholderPage = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>
    </div>
    <div className="glass-card p-12 text-center">
      <p className="text-sm text-muted-foreground">Content will be available after backend integration</p>
    </div>
  </div>
);

const DdhsDashboard = () => {
  return (
    <DashboardLayout role="ddhs" roleLabel="DDHS Admin" sidebarItems={sidebarItems}>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="phcs" element={<PhcManagement />} />
        <Route path="doctors" element={<PlaceholderPage title="Doctor Monitoring" subtitle="Monitor all doctors in your district" />} />
        <Route path="attendance" element={<PlaceholderPage title="Attendance Monitoring" subtitle="District-wide attendance tracking" />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="medicine" element={<PlaceholderPage title="Medicine Inventory" subtitle="District medicine stock overview" />} />
        <Route path="feedback" element={<PlaceholderPage title="Feedback" subtitle="Public feedback across PHCs" />} />
        <Route path="profile" element={<PlaceholderPage title="Profile" subtitle="Your account details" />} />
      </Routes>
    </DashboardLayout>
  );
};

export default DdhsDashboard;
