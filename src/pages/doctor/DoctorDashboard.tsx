import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  LayoutDashboard,
  UserCheck,
  Clock,
  Pill,
  Ambulance,
  Users,
  FileText,
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", path: "/doctor", icon: LayoutDashboard },
  { label: "Attendance", path: "/doctor/attendance", icon: Clock },
  { label: "Patients", path: "/doctor/patients", icon: Users },
  { label: "Medicine Stock", path: "/doctor/medicine", icon: Pill },
  { label: "Ambulance", path: "/doctor/ambulance", icon: Ambulance },
  { label: "Profile", path: "/doctor/profile", icon: UserCheck },
];

const DashboardHome = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">Dashboard</h1>
      <p className="page-subtitle">Welcome back, Doctor</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Today's Status" value="Present" subtitle="Marked at 9:00 AM" icon={<UserCheck className="h-4 w-4" />} />
      <StatCard title="Attendance %" value="92%" subtitle="This month" icon={<Clock className="h-4 w-4" />} />
      <StatCard title="Patients Today" value="8" subtitle="3 new" icon={<Users className="h-4 w-4" />} />
      <StatCard title="Pending Requests" value="1" subtitle="Ambulance" icon={<Ambulance className="h-4 w-4" />} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-6">
        <h3 className="font-medium text-sm mb-4">Recent Patients</h3>
        <div className="space-y-3">
          {[
            { name: "Ravi Kumar", disease: "Fever", time: "10:30 AM" },
            { name: "Priya Sharma", disease: "Cold", time: "11:00 AM" },
            { name: "Ajay Patel", disease: "Headache", time: "11:45 AM" },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.disease}</div>
              </div>
              <span className="text-xs text-muted-foreground">{p.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-medium text-sm mb-4">Attendance History</h3>
        <div className="space-y-2">
          {["2024-01-15", "2024-01-14", "2024-01-13", "2024-01-12"].map((date) => (
            <div key={date} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm">{date}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">Present</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AttendancePage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">Mark Attendance</h1>
      <p className="page-subtitle">Verify your presence using face and GPS</p>
    </div>
    <div className="glass-card p-8 text-center space-y-4 max-w-md mx-auto">
      <div className="h-48 rounded-xl bg-secondary flex items-center justify-center">
        <FileText className="h-12 w-12 text-muted-foreground/30" />
      </div>
      <p className="text-sm text-muted-foreground">Camera and GPS verification will be available after backend integration</p>
      <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
        Mark Present
      </button>
    </div>
  </div>
);

const PatientsPage = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="page-header">Patient Records</h1>
        <p className="page-subtitle">Manage your patient records</p>
      </div>
      <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
        + Add Patient
      </button>
    </div>
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Patient</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Disease</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Medicine</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: "Ravi Kumar", disease: "Fever", medicine: "Paracetamol", date: "2024-01-15" },
            { name: "Priya Sharma", disease: "Cold", medicine: "Cetirizine", date: "2024-01-15" },
          ].map((p) => (
            <tr key={p.name} className="border-b border-border/30 last:border-0">
              <td className="p-4 text-sm">{p.name}</td>
              <td className="p-4 text-sm text-muted-foreground">{p.disease}</td>
              <td className="p-4 text-sm text-muted-foreground">{p.medicine}</td>
              <td className="p-4 text-sm text-muted-foreground">{p.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MedicinePage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">Medicine Stock</h1>
      <p className="page-subtitle">View available medicine at your PHC</p>
    </div>
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Medicine</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Quantity</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Expiry</th>
            <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: "Paracetamol", qty: 500, expiry: "2025-06-01", low: false },
            { name: "Amoxicillin", qty: 20, expiry: "2025-03-15", low: true },
          ].map((m) => (
            <tr key={m.name} className="border-b border-border/30 last:border-0">
              <td className="p-4 text-sm">{m.name}</td>
              <td className="p-4 text-sm text-muted-foreground">{m.qty}</td>
              <td className="p-4 text-sm text-muted-foreground">{m.expiry}</td>
              <td className="p-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.low ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                  {m.low ? "Low" : "OK"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AmbulancePage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">Ambulance Request</h1>
      <p className="page-subtitle">Request emergency ambulance service</p>
    </div>
    <div className="glass-card p-6 max-w-md space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Patient Name</label>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Enter patient name" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Emergency Type</label>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="e.g., Cardiac, Accident" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Contact Number</label>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Phone number" />
      </div>
      <button className="w-full py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">
        🚑 Request Ambulance
      </button>
    </div>
  </div>
);

const ProfilePage = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="page-header">Profile</h1>
      <p className="page-subtitle">Your account details</p>
    </div>
    <div className="glass-card p-6 max-w-md space-y-4">
      {[
        { label: "Name", value: "Dr. John Doe" },
        { label: "Email", value: "john@example.com" },
        { label: "Phone", value: "+91 9876543210" },
        { label: "Specialization", value: "General Medicine" },
        { label: "PHC", value: "PHC 1 - District A" },
      ].map((f) => (
        <div key={f.label} className="flex justify-between py-2 border-b border-border/30 last:border-0">
          <span className="text-sm text-muted-foreground">{f.label}</span>
          <span className="text-sm font-medium">{f.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const DoctorDashboard = () => {
  return (
    <DashboardLayout role="doctor" roleLabel="Doctor" sidebarItems={sidebarItems}>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="medicine" element={<MedicinePage />} />
        <Route path="ambulance" element={<AmbulancePage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
