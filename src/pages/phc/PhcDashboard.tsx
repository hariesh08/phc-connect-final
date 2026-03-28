import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { toast } from "sonner";
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
  ShieldCheck,
  Loader2,
  Star,
  Phone,
  Mail,
  Shield,
  AlertTriangle,
  Building2,
  Plus,
} from "lucide-react";
import * as phcService from "@/services/phcService";

const sidebarItems = [
  { label: "Dashboard", path: "/phc", icon: LayoutDashboard },
  { label: "Doctors", path: "/phc/doctors", icon: Users },
  { label: "Attendance", path: "/phc/attendance", icon: Clock },
  { label: "Medicine", path: "/phc/medicine", icon: Pill },
  { label: "Ambulance", path: "/phc/ambulance", icon: Ambulance },
  { label: "Vaccination", path: "/phc/vaccination", icon: Syringe },
  { label: "Feedback", path: "/phc/feedback", icon: MessageSquare },
  { label: "Approvals", path: "/phc/approvals", icon: ShieldCheck },
  { label: "Profile", path: "/phc/profile", icon: UserCheck },
];

const DashboardHome = () => {
  const { profile } = useAuth();
  const phcId = profile?.phc_id;

  const { data: stats } = useQuery({
    queryKey: ["phc-dashboard-stats", phcId],
    enabled: !!phcId,
    queryFn: async () => {
      // Fetch total doctors
      const { count: doctorsCount } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("phc_id", phcId);

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*, users!inner(name)")
        .eq("phc_id", phcId)
        .eq("date", today);

      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const attPercent = doctorsCount && doctorsCount > 0 ? Math.round((presentCount / doctorsCount) * 100) : 0;

      // Fetch medicine alerts
      const { count: alertsCount } = await supabase
        .from("inventory")
        .select("*", { count: "exact", head: true })
        .eq("phc_id", phcId)
        .lt("quantity", 10); // simple threshold

      // Fetch pending ambulance requests
      const { count: ambCount } = await supabase
        .from("ambulance_requests")
        .select("*", { count: "exact", head: true })
        .eq("requesting_phc", phcId)
        .eq("status", "Pending");

      // Get Doctors List for Status
      const { data: doctorsData } = await supabase
        .from("doctors")
        .select("id, user_id, users(name)")
        .eq("phc_id", phcId);
        
      const docsWithStatus = (doctorsData || []).map(doc => {
         const att = attendanceData?.find(a => a.doctor_id === doc.user_id);
         const userData = doc.users as any; // Cast to bypass Supabase join inferred array type error
         return {
            name: userData?.name || "Unknown Doctor",
            status: att ? att.status : "Pending",
            time: att ? new Date(att.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"
         };
      });

      // Calculate PHC Score (User rules: 0 if no doctors)
      let score = 0;
      let scoreBreakdown = [
        { label: "Attendance (50%)", score: 0, max: 50 },
        { label: "Doctor Availability (20%)", score: 0, max: 20 },
        { label: "Medicine (15%)", score: 0, max: 15 },
        { label: "Alerts (15%)", score: 0, max: 15 },
      ];
      
      if (doctorsCount && doctorsCount > 0) {
        let attScore = Math.round((attPercent / 100) * 50);
        let availScore = 20; // Assume 100% available unless proven otherwise
        let medScore = alertsCount && alertsCount > 0 ? 5 : 15;
        let altScore = 15; // Placeholder
        
        scoreBreakdown = [
          { label: "Attendance (50%)", score: attScore, max: 50 },
          { label: "Doctor Availability (20%)", score: availScore, max: 20 },
          { label: "Medicine (15%)", score: medScore, max: 15 },
          { label: "Alerts (15%)", score: altScore, max: 15 },
        ];
        score = attScore + availScore + medScore + altScore;
      }

      return {
        doctorsCount: doctorsCount || 0,
        presentCount,
        attPercent,
        alertsCount: alertsCount || 0,
        ambCount: ambCount || 0,
        score,
        scoreBreakdown,
        docsWithStatus
      };
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">PHC Dashboard</h1>
        <p className="page-subtitle">Primary Health Centre Overview</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Doctors" value={stats?.doctorsCount || 0} icon={<Users className="h-4 w-4" />} />
        <StatCard title="Present Today" value={stats?.presentCount || 0} icon={<UserCheck className="h-4 w-4" />} />
        <StatCard title="Attendance %" value={`${stats?.attPercent || 0}%`} icon={<Clock className="h-4 w-4" />} />
        <StatCard title="Medicine Alerts" value={stats?.alertsCount || 0} subtitle="Low stock" icon={<Pill className="h-4 w-4" />} />
        <StatCard title="Ambulance Req." value={stats?.ambCount || 0} subtitle="Pending" icon={<Ambulance className="h-4 w-4" />} />
        <StatCard title="PHC Score" value={stats?.score || 0} subtitle="Out of 100" icon={<BarChart3 className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="font-medium text-sm mb-4">Doctor Status (Today)</h3>
          <div className="space-y-3">
            {stats?.docsWithStatus && stats.docsWithStatus.length > 0 ? stats.docsWithStatus.map((d: any) => (
              <div key={d.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="text-sm font-medium">{d.name}</div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{d.time}</span>
                  <span className={`text-xs capitalize px-2 py-0.5 rounded-full font-medium ${d.status === "present" ? "bg-success/10 text-success" : d.status === "absent" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                    {d.status}
                  </span>
                </div>
              </div>
            )) : (
               <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                 No doctors assigned to this PHC yet.
               </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-medium text-sm mb-4">Score Breakdown</h3>
          <div className="space-y-3">
            {stats?.scoreBreakdown?.map((item: any) => (
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
};

const DoctorsPage = () => {
  const { profile } = useAuth();
  const phcId = profile?.phc_id;

  const { data: doctors, isLoading, refetch } = useQuery({
    queryKey: ["phc-doctors", phcId],
    enabled: !!phcId,
    queryFn: async () => {
       const { data, error } = await supabase
         .from("doctors")
         .select(`
           *,
           users!inner(id, name, status)
         `)
         .eq("phc_id", phcId);
         
       if (error) throw error;
       return data;
    }
  });

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: "active" })
        .eq("id", userId);
        
      if (error) throw error;
      toast.success("Doctor approved successfully");
      refetch();
    } catch (err: any) {
      toast.error("Failed to approve: " + err.message);
    }
  };

  return (
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
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Experience</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Approved</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">Loading doctors...</td></tr>
            ) : doctors?.map((d: any) => (
              <tr key={d.id} className="border-b border-border/30 last:border-0">
                <td className="p-4 text-sm font-medium">{d.users.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{d.specialization}</td>
                <td className="p-4 text-sm text-muted-foreground">{d.experience} yrs</td>
                <td className="p-4">
                  {d.users.status === "active" ? (
                    <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-md">✓ Approved</span>
                  ) : (
                    <button 
                      onClick={() => handleApprove(d.users.id)}
                      className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                       Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(!isLoading && (!doctors || doctors.length === 0)) && (
               <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No doctors assigned.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DoctorApprovalsPage = () => {
  const { profile } = useAuth();
  const phcId = profile?.phc_id;
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: pendingDoctors, isLoading, isError } = useQuery({
    queryKey: ["phc-pending-doctors", phcId],
    enabled: !!phcId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "doctor")
        .eq("status", "pending")
        .eq("phc_id", phcId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleAction = async (userId: string, action: "active" | "rejected") => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: action })
        .eq("id", userId);
      if (error) throw error;
      toast.success(action === "active" ? "Doctor approved!" : "Doctor rejected.");
      queryClient.invalidateQueries({ queryKey: ["phc-pending-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["phc-doctors"] });
    } catch (err: any) {
      toast.error("Failed: " + (err.message || "Unknown error"));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Doctor Approvals</h1>
        <p className="page-subtitle">Review and approve pending doctor registrations</p>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Email</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Phone</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Registered</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div>
              </td></tr>
            ) : isError ? (
              <tr><td colSpan={5} className="p-8 text-center text-sm text-destructive">Failed to load data.</td></tr>
            ) : pendingDoctors && pendingDoctors.length > 0 ? (
              pendingDoctors.map((doc: any) => (
                <tr key={doc.id} className="border-b border-border/30 last:border-0">
                  <td className="p-4 text-sm font-medium">{doc.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{doc.email}</td>
                  <td className="p-4 text-sm text-muted-foreground">{doc.phone || "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(doc.id, "active")}
                        disabled={processingId === doc.id}
                        className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {processingId === doc.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleAction(doc.id, "rejected")}
                        disabled={processingId === doc.id}
                        className="text-xs px-3 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                <div className="border border-dashed rounded-lg p-4">No pending approvals.</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══ ATTENDANCE PAGE ═══
const AttendancePage = () => {
  const { profile } = useAuth();
  const phcId = profile?.phc_id;
  const { data: records, isLoading, isError } = useQuery({
    queryKey: ["phc-attendance", phcId], enabled: !!phcId,
    queryFn: () => phcService.getAttendance(phcId!),
  });
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-header">Attendance Monitoring</h1><p className="page-subtitle">Track doctor attendance across your PHC</p></div>
      <div className="glass-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-border/50">
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Doctor</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Check-in</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
      </tr></thead><tbody>
        {isLoading ? <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground"><div className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading data...</div></td></tr>
        : isError ? <tr><td colSpan={4} className="p-8 text-center text-sm text-destructive">Failed to load data.</td></tr>
        : records && records.length > 0 ? records.map((a: any) => (
          <tr key={a.id} className="border-b border-border/30 last:border-0">
            <td className="p-4 text-sm font-medium">{a.doctor_name}</td>
            <td className="p-4 text-sm text-muted-foreground">{a.date}</td>
            <td className="p-4 text-sm text-muted-foreground">{a.checkin_time ? new Date(a.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
            <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${a.status === 'present' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{a.status}</span></td>
          </tr>
        )) : <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground"><div className="border border-dashed rounded-lg p-4">No attendance records.</div></td></tr>}
      </tbody></table></div>
    </div>
  );
};

// ═══ MEDICINE PAGE (with Add + Realtime) ═══
const MedicinePage = () => {
  const { profile } = useAuth();
  const phcId = profile?.phc_id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ medicine_name: '', quantity: '', threshold: '' });

  const { data: medicines, isLoading, isError } = useQuery({
    queryKey: ["phc-medicines", phcId], enabled: !!phcId,
    queryFn: () => phcService.getMedicines(phcId!),
  });

  // Realtime subscription
  useEffect(() => {
    if (!phcId) return;
    const channel = supabase.channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory', filter: `phc_id=eq.${phcId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["phc-medicines", phcId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [phcId, queryClient]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phcId || saving) return;
    setSaving(true);
    try {
      await phcService.addMedicine(phcId, { medicine_name: form.medicine_name, quantity: parseInt(form.quantity), threshold: parseInt(form.threshold) });
      toast.success('Medicine added!');
      setShowForm(false); setForm({ medicine_name: '', quantity: '', threshold: '' });
      queryClient.invalidateQueries({ queryKey: ["phc-medicines"] });
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const lowCount = medicines?.filter((m: any) => m.is_low).length || 0;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-header">Medicine Stock</h1><p className="page-subtitle">Manage medicine inventory</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
          <Plus className="h-4 w-4" />{showForm ? 'Close' : 'Add Medicine'}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleAdd} className="glass-card p-6 space-y-4 max-w-2xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Medicine Name</Label><Input required value={form.medicine_name} onChange={e => setForm({...form, medicine_name: e.target.value})} placeholder="e.g., Paracetamol" /></div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" min="1" required value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} /></div>
            <div className="space-y-2"><Label>Min Required</Label><Input type="number" min="1" required value={form.threshold} onChange={e => setForm({...form, threshold: e.target.value})} /></div>
          </div>
          <button type="submit" disabled={saving} className="py-2 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Adding...' : 'Add Medicine'}
          </button>
        </form>
      )}
      {lowCount > 0 && <div className="glass-card p-4 border-l-4 border-warning flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-warning" /><div><div className="text-sm font-medium">Low Stock Alert</div><div className="text-xs text-muted-foreground">{lowCount} medicine{lowCount > 1 ? 's' : ''} below minimum threshold</div></div></div>}
      <div className="glass-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-border/50">
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Medicine</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Quantity</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Min Required</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
      </tr></thead><tbody>
        {isLoading ? <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground"><div className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading data...</div></td></tr>
        : isError ? <tr><td colSpan={4} className="p-8 text-center text-sm text-destructive">Failed to load data.</td></tr>
        : medicines && medicines.length > 0 ? medicines.map((m: any) => (
          <tr key={m.id} className="border-b border-border/30 last:border-0">
            <td className="p-4 text-sm font-medium">{m.medicine_name}</td>
            <td className="p-4 text-sm text-muted-foreground">{m.quantity}</td>
            <td className="p-4 text-sm text-muted-foreground">{m.threshold}</td>
            <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_low ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{m.is_low ? 'Low Stock' : 'Sufficient'}</span></td>
          </tr>
        )) : <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground"><div className="border border-dashed rounded-lg p-4">No medicine inventory data available.</div></td></tr>}
      </tbody></table></div>
    </div>
  );
};

// ═══ AMBULANCE PAGE ═══
const AmbulancePage = () => {
  const { profile } = useAuth();
  const phcId = profile?.phc_id;
  const queryClient = useQueryClient();
  const { data: requests, isLoading, isError } = useQuery({
    queryKey: ["phc-ambulance", phcId], enabled: !!phcId,
    queryFn: () => phcService.getAmbulanceRequests(phcId!),
  });
  const handleStatus = async (id: string, status: string) => {
    try {
      await phcService.updateAmbulanceStatus(id, status);
      toast.success(`Request ${status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["phc-ambulance"] });
    } catch (err: any) { toast.error(err.message); }
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-header">Ambulance Requests</h1><p className="page-subtitle">Manage emergency requests</p></div>
      <div className="glass-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-border/50">
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Patient</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Emergency</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Contact</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Actions</th>
      </tr></thead><tbody>
        {isLoading ? <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground"><div className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading data...</div></td></tr>
        : isError ? <tr><td colSpan={5} className="p-8 text-center text-sm text-destructive">Failed to load data.</td></tr>
        : requests && requests.length > 0 ? requests.map((r: any) => (
          <tr key={r.id} className="border-b border-border/30 last:border-0">
            <td className="p-4 text-sm font-medium">{r.patient_name}</td>
            <td className="p-4 text-sm text-muted-foreground">{r.emergency_type}</td>
            <td className="p-4 text-sm text-muted-foreground">{r.contact}</td>
            <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'Completed' ? 'bg-success/10 text-success' : r.status === 'Accepted' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>{r.status}</span></td>
            <td className="p-4">
              {r.status === 'Pending' && <div className="flex gap-2">
                <button onClick={() => handleStatus(r.id, 'Accepted')} className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Accept</button>
                <button onClick={() => handleStatus(r.id, 'Completed')} className="text-xs px-3 py-1 rounded-md bg-success/10 text-success hover:bg-success/20">Complete</button>
              </div>}
              {r.status === 'Accepted' && <button onClick={() => handleStatus(r.id, 'Completed')} className="text-xs px-3 py-1 rounded-md bg-success/10 text-success hover:bg-success/20">Complete</button>}
            </td>
          </tr>
        )) : <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground"><div className="border border-dashed rounded-lg p-4">No ambulance requests.</div></td></tr>}
      </tbody></table></div>
    </div>
  );
};

// ═══ VACCINATION PAGE ═══
const VaccinationPage = () => {
  const { profile } = useAuth();
  const phcId = profile?.phc_id;
  const { data: records, isLoading, isError } = useQuery({
    queryKey: ["phc-vaccinations", phcId], enabled: !!phcId,
    queryFn: () => phcService.getVaccinations(phcId!),
  });
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-header">Vaccination Tracking</h1><p className="page-subtitle">Track vaccination records</p></div>
      <div className="glass-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-border/50">
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Patient</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Vaccine</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Dose</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
      </tr></thead><tbody>
        {isLoading ? <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground"><div className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading data...</div></td></tr>
        : isError ? <tr><td colSpan={4} className="p-8 text-center text-sm text-destructive">Failed to load data.</td></tr>
        : records && records.length > 0 ? records.map((v: any) => (
          <tr key={v.id} className="border-b border-border/30 last:border-0">
            <td className="p-4 text-sm font-medium">{v.patient_name}</td>
            <td className="p-4 text-sm text-muted-foreground">{v.vaccine_name}</td>
            <td className="p-4 text-sm text-muted-foreground">{v.dose || '—'}</td>
            <td className="p-4 text-sm text-muted-foreground">{v.date}</td>
          </tr>
        )) : <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground"><div className="border border-dashed rounded-lg p-4">No vaccination records.</div></td></tr>}
      </tbody></table></div>
    </div>
  );
};

// ═══ FEEDBACK PAGE ═══
const FeedbackPage = () => {
  const { profile } = useAuth();
  const phcId = profile?.phc_id;
  const { data: feedbacks, isLoading, isError } = useQuery({
    queryKey: ["phc-feedback", phcId], enabled: !!phcId,
    queryFn: () => phcService.getFeedback(phcId!),
  });
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-header">Feedback</h1><p className="page-subtitle">Public feedback about your PHC</p></div>
      <div className="glass-card overflow-hidden"><table className="w-full"><thead><tr className="border-b border-border/50">
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Rating</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Comment</th>
        <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
      </tr></thead><tbody>
        {isLoading ? <tr><td colSpan={3} className="p-8 text-center text-sm text-muted-foreground"><div className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading data...</div></td></tr>
        : isError ? <tr><td colSpan={3} className="p-8 text-center text-sm text-destructive">Failed to load data.</td></tr>
        : feedbacks && feedbacks.length > 0 ? feedbacks.map((f: any) => (
          <tr key={f.id} className="border-b border-border/30 last:border-0">
            <td className="p-4"><div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3.5 w-3.5 ${s <= f.rating ? 'fill-warning text-warning' : 'text-muted-foreground/20'}`} />)}</div></td>
            <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{f.comment || '—'}</td>
            <td className="p-4 text-sm text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</td>
          </tr>
        )) : <tr><td colSpan={3} className="p-8 text-center text-sm text-muted-foreground"><div className="border border-dashed rounded-lg p-4">No feedback available.</div></td></tr>}
      </tbody></table></div>
    </div>
  );
};

// ═══ PROFILE PAGE ═══
const ProfilePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editPhone, setEditPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ["phc-profile", user?.id], enabled: !!user?.id,
    queryFn: () => phcService.getProfile(user!.id),
  });

  useEffect(() => { if (profileData?.phone) setPhone(profileData.phone); }, [profileData]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await phcService.updateProfile(user.id, { phone });
      toast.success('Phone updated!');
      setEditPhone(false);
      queryClient.invalidateQueries({ queryKey: ["phc-profile"] });
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (isLoading) return <div className="space-y-6 animate-fade-in"><div><h1 className="page-header">Profile</h1></div><div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></div>;
  if (!profileData) return <div className="space-y-6 animate-fade-in"><div><h1 className="page-header">Profile</h1></div><div className="glass-card p-8 text-center text-sm text-muted-foreground">Profile data not found.</div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-header">Profile</h1><p className="page-subtitle">Your account details</p></div>
      <div className="glass-card p-6 max-w-md space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-border/30">
          <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center"><Shield className="h-6 w-6 text-primary-foreground" /></div>
          <div><div className="font-semibold">{profileData.name}</div><div className="text-xs text-muted-foreground capitalize">PHC Administrator</div></div>
        </div>
        <div className="flex items-center gap-3 py-2 border-b border-border/30"><Mail className="h-4 w-4 text-muted-foreground" /><div><div className="text-xs text-muted-foreground">Email</div><div className="text-sm font-medium">{profileData.email}</div></div></div>
        <div className="flex items-center gap-3 py-2 border-b border-border/30"><Phone className="h-4 w-4 text-muted-foreground" /><div className="flex-1"><div className="text-xs text-muted-foreground">Phone</div>
          {editPhone ? <div className="flex gap-2 mt-1"><Input value={phone} onChange={e => setPhone(e.target.value)} className="h-8" />
            <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground">{saving ? '...' : 'Save'}</button>
            <button onClick={() => setEditPhone(false)} className="text-xs px-3 py-1 rounded-md border">Cancel</button>
          </div> : <div className="flex items-center gap-2"><span className="text-sm font-medium">{profileData.phone || 'Not set'}</span>
            <button onClick={() => setEditPhone(true)} className="text-xs text-primary hover:underline">Edit</button>
          </div>}
        </div></div>
        <div className="flex items-center gap-3 py-2 border-b border-border/30"><Building2 className="h-4 w-4 text-muted-foreground" /><div><div className="text-xs text-muted-foreground">District</div><div className="text-sm font-medium">{profileData.district_name}</div></div></div>
        <div className="flex items-center gap-3 py-2 border-b border-border/30"><Building2 className="h-4 w-4 text-muted-foreground" /><div><div className="text-xs text-muted-foreground">PHC</div><div className="text-sm font-medium">{profileData.phc_name}</div></div></div>
        <div className="flex items-center gap-3 py-2"><UserCheck className="h-4 w-4 text-muted-foreground" /><div><div className="text-xs text-muted-foreground">Status</div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profileData.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{profileData.status === 'active' ? 'Active' : 'Pending'}</span>
        </div></div>
      </div>
    </div>
  );
};

const PhcDashboard = () => {
  return (
    <DashboardLayout role="phc" roleLabel="PHC Admin" sidebarItems={sidebarItems}>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="approvals" element={<DoctorApprovalsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="medicine" element={<MedicinePage />} />
        <Route path="ambulance" element={<AmbulancePage />} />
        <Route path="vaccination" element={<VaccinationPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default PhcDashboard;
