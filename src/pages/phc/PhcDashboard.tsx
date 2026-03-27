import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  LayoutDashboard,
  Users,
  Clock,
  Pill,
  Ambulance,
  Syringe,
  MessageSquare,
  BarChart3,
  UserCheck,
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", path: "/phc", icon: LayoutDashboard },
  { label: "Doctors", path: "/phc/doctors", icon: Users },
  { label: "Attendance", path: "/phc/attendance", icon: Clock },
  { label: "Medicine", path: "/phc/medicine", icon: Pill },
  { label: "Ambulance", path: "/phc/ambulance", icon: Ambulance },
  { label: "Vaccination", path: "/phc/vaccination", icon: Syringe },
  { label: "Feedback", path: "/phc/feedback", icon: MessageSquare },
  { label: "Profile", path: "/phc/profile", icon: UserCheck },
];

const DashboardHome = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">PHC Dashboard</h1>
      <p className="page-subtitle">Primary Health Centre Overview</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard title="Total Doctors" value="12" icon={<Users className="h-4 w-4" />} />
      <StatCard title="Present Today" value="10" icon={<UserCheck className="h-4 w-4" />} />
      <StatCard title="Attendance %" value="83%" icon={<Clock className="h-4 w-4" />} />
      <StatCard title="Medicine Alerts" value="3" subtitle="Low stock" icon={<Pill className="h-4 w-4" />} />
      <StatCard title="Ambulance Req." value="1" subtitle="Pending" icon={<Ambulance className="h-4 w-4" />} />
      <StatCard title="PHC Score" value="78" subtitle="Out of 100" icon={<BarChart3 className="h-4 w-4" />} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-6">
        <h3 className="font-medium text-sm mb-4">Doctor Status</h3>
        <div className="space-y-3">
          {[
            { name: "Dr. Sharma", status: "Present", time: "9:00 AM" },
            { name: "Dr. Gupta", status: "Present", time: "9:15 AM" },
            { name: "Dr. Patel", status: "Absent", time: "—" },
          ].map((d) => (
            <div key={d.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="text-sm font-medium">{d.name}</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{d.time}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === "Present" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {d.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-medium text-sm mb-4">Score Breakdown</h3>
        <div className="space-y-3">
          {[
            { label: "Attendance (50%)", score: 42, max: 50 },
            { label: "Doctor Availability (20%)", score: 16, max: 20 },
            { label: "Medicine (15%)", score: 10, max: 15 },
            { label: "Alerts (15%)", score: 10, max: 15 },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.score}/{item.max}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(item.score / item.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const DoctorsPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">Doctors</h1>
      <p className="page-subtitle">Manage doctors assigned to your PHC</p>
    </div>
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Specialization</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Approved</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: "Dr. Sharma", spec: "General", status: "Present", approved: true },
            { name: "Dr. Gupta", spec: "Pediatrics", status: "Absent", approved: true },
            { name: "Dr. Khan", spec: "Orthopedics", status: "—", approved: false },
          ].map((d) => (
            <tr key={d.name} className="border-b border-border/30 last:border-0">
              <td className="p-4 text-sm font-medium">{d.name}</td>
              <td className="p-4 text-sm text-muted-foreground">{d.spec}</td>
              <td className="p-4">
                {d.approved && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === "Present" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {d.status}
                  </span>
                )}
              </td>
              <td className="p-4">
                {d.approved ? (
                  <span className="text-xs text-success">✓ Approved</span>
                ) : (
                  <button className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Approve</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

const PhcDashboard = () => {
  return (
    <DashboardLayout role="phc" roleLabel="PHC Admin" sidebarItems={sidebarItems}>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="attendance" element={<PlaceholderPage title="Attendance Monitoring" subtitle="Track doctor attendance across your PHC" />} />
        <Route path="medicine" element={<PlaceholderPage title="Medicine Stock" subtitle="Manage medicine inventory" />} />
        <Route path="ambulance" element={<PlaceholderPage title="Ambulance Requests" subtitle="Manage emergency requests" />} />
        <Route path="vaccination" element={<PlaceholderPage title="Vaccination Tracking" subtitle="Track vaccination records" />} />
        <Route path="feedback" element={<PlaceholderPage title="Feedback" subtitle="Public feedback about your PHC" />} />
        <Route path="profile" element={<PlaceholderPage title="Profile" subtitle="Your account details" />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PhcDashboard;
