import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
  Loader2,
  Star,
  MapPin,
  Phone,
  Mail,
  Shield,
  ShieldCheck,
  Settings,
  Save,
  Percent,
  Zap
} from "lucide-react";
import * as ddhsService from "@/services/ddhsService";
import GoogleMapView from "@/components/GoogleMapView";
// ─── Sidebar (unchanged) ────────────────────────────────────────────
const sidebarItems = [
  { label: "Dashboard", path: "/ddhs", icon: LayoutDashboard },
  { label: "PHC Management", path: "/ddhs/phcs", icon: Building2 },
  { label: "Doctors", path: "/ddhs/doctors", icon: Users },
  { label: "Attendance", path: "/ddhs/attendance", icon: Clock },
  { label: "PHC Ranking", path: "/ddhs/ranking", icon: BarChart3 },
  { label: "PHC Map", path: "/ddhs/map", icon: Map },
  { label: "Medicine", path: "/ddhs/medicine", icon: Pill },
  { label: "Alert Config", path: "/ddhs/alerts-config", icon: Settings },
  { label: "Feedback", path: "/ddhs/feedback", icon: MessageSquare },
  { label: "Approvals", path: "/ddhs/approvals", icon: ShieldCheck },
  { label: "Profile", path: "/ddhs/profile", icon: UserCheck },
];

// ─── Shared Loading / Error / Empty ──────────────────────────────────
const LoadingRow = ({ cols }: { cols: number }) => (
  <tr>
    <td colSpan={cols} className="p-8 text-center text-sm text-muted-foreground">
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading data...
      </div>
    </td>
  </tr>
);

const EmptyRow = ({ cols, message }: { cols: number; message: string }) => (
  <tr>
    <td colSpan={cols} className="p-8 text-center text-sm text-muted-foreground">
      <div className="border border-dashed rounded-lg p-4">{message}</div>
    </td>
  </tr>
);

const ErrorRow = ({ cols }: { cols: number }) => (
  <tr>
    <td colSpan={cols} className="p-8 text-center text-sm text-destructive">
      Failed to load data. Please try again.
    </td>
  </tr>
);

// ═════════════════════════════════════════════════════════════════════
// PART 2 — DASHBOARD HOME
// ═════════════════════════════════════════════════════════════════════
const DashboardHome = () => {
  const { profile } = useAuth();
  const districtId = profile?.district_id;

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["ddhs-dashboard-stats", districtId],
    enabled: !!districtId,
    queryFn: () => ddhsService.getDashboardStats(districtId!),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">DDHS Dashboard</h1>
        <p className="page-subtitle">District Health Services Overview</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="glass-card p-8 text-center text-sm text-destructive">
          Failed to load dashboard stats. Please refresh.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total PHCs"
              value={stats?.totalPHCs || 0}
              icon={<Building2 className="h-4 w-4" />}
            />
            <StatCard
              title="Total Doctors"
              value={stats?.totalDoctors || 0}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="Avg Attendance"
              value={`${stats?.avgAttendance || 0}%`}
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              title="Active Alerts"
              value={stats?.activeAlerts || 0}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <StatCard
              title="Avg PHC Score"
              value={stats?.avgScore || 0}
              subtitle="Out of 100"
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PHC Performance */}
            <div className="glass-card p-6">
              <h3 className="font-medium text-sm mb-4">PHC Performance</h3>
              <div className="space-y-3">
                {stats?.phcPerformance && stats.phcPerformance.length > 0 ? (
                  stats.phcPerformance.map((phc: any) => (
                    <div
                      key={phc.name}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <div>
                        <div className="text-sm font-medium">{phc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {phc.doctors} doctors
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${phc.attendance}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono w-10 text-right">
                          {phc.attendance}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                    No PHCs found in your district yet.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="glass-card p-6">
              <h3 className="font-medium text-sm mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {stats?.recentAlerts && stats.recentAlerts.length > 0 ? (
                  stats.recentAlerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                    >
                      <AlertTriangle
                        className={`h-4 w-4 mt-0.5 shrink-0 ${
                          alert.severity === "high"
                            ? "text-destructive"
                            : alert.severity === "medium"
                            ? "text-warning"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium capitalize">
                          {alert.alert_type} — {alert.phcs?.name || "Unknown PHC"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {alert.message}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                    No active alerts in this district.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// PART 3 — PHC MANAGEMENT
// ═════════════════════════════════════════════════════════════════════
const PhcManagement = () => {
  const { profile } = useAuth();
  const districtId = profile?.district_id;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    location: "",
    latitude: "",
    longitude: "",
  });

  const { data: phcs, isLoading, isError } = useQuery({
    queryKey: ["ddhs-phcs", districtId],
    enabled: !!districtId,
    queryFn: () => ddhsService.getDistrictPHCs(districtId!),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtId || saving) return;
    setSaving(true);
    try {
      await ddhsService.createPHC(districtId, {
        name: form.name,
        code: form.code,
        location: form.location || undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      });
      toast.success("PHC created successfully!");
      setShowForm(false);
      setForm({ name: "", code: "", location: "", latitude: "", longitude: "" });
      queryClient.invalidateQueries({ queryKey: ["ddhs-phcs"] });
      queryClient.invalidateQueries({ queryKey: ["ddhs-dashboard-stats"] });
    } catch (err: any) {
      if (err.message?.includes("duplicate") || err.code === "23505") {
        toast.error("PHC code already exists. Please use a unique code.");
      } else {
        toast.error("Failed to create PHC: " + (err.message || "Unknown error"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">PHC Management</h1>
          <p className="page-subtitle">
            Manage Primary Health Centres in your district
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {showForm ? "Close Form" : "+ Create PHC"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="glass-card p-6 space-y-4 max-w-2xl"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phc-name">PHC Name</Label>
              <Input
                id="phc-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., PHC Tambaram"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phc-code">PHC Code (Unique)</Label>
              <Input
                id="phc-code"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g., PHC-KAN-001"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phc-location">Address / Location</Label>
            <Input
              id="phc-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Main Road, Tambaram"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phc-lat">Latitude</Label>
              <Input
                id="phc-lat"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                placeholder="e.g., 12.9256"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phc-lng">Longitude</Label>
              <Input
                id="phc-lng"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) =>
                  setForm({ ...form, longitude: e.target.value })
                }
                placeholder="e.g., 80.1275"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="py-2 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Creating..." : "Create PHC"}
          </button>
        </form>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Name
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Code
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Admin
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Doctors
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRow cols={5} />
            ) : isError ? (
              <ErrorRow cols={5} />
            ) : phcs && phcs.length > 0 ? (
              phcs.map((phc: any) => (
                <tr
                  key={phc.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="p-4 text-sm font-medium">{phc.name}</td>
                  <td className="p-4 text-sm font-mono text-muted-foreground">
                    {phc.code}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {phc.admin_name}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {phc.doctors_count}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        phc.status === "Active"
                          ? "bg-success/10 text-success"
                          : phc.status === "Maintenance"
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {phc.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={5} message="No PHCs found in your district." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// PART 4 — DOCTOR MONITORING
// ═════════════════════════════════════════════════════════════════════
const DoctorMonitoring = () => {
  const { profile } = useAuth();
  const districtId = profile?.district_id;

  const { data: doctors, isLoading, isError } = useQuery({
    queryKey: ["ddhs-doctors", districtId],
    enabled: !!districtId,
    queryFn: () => ddhsService.getDistrictDoctors(districtId!),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Doctor Monitoring</h1>
        <p className="page-subtitle">Monitor all doctors in your district</p>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Doctor
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                PHC
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Specialization
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Attendance %
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRow cols={5} />
            ) : isError ? (
              <ErrorRow cols={5} />
            ) : doctors && doctors.length > 0 ? (
              doctors.map((doc: any) => (
                <tr
                  key={doc.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="p-4 text-sm font-medium">
                    {doc.doctor_name}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {doc.phc_name}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {doc.specialization || "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${doc.attendance_percent}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono">
                        {doc.attendance_percent}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        doc.doctor_status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {doc.doctor_status === "active" ? "Active" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow
                cols={5}
                message="No doctors registered in this district."
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// PART 5 — ATTENDANCE MONITORING
// ═════════════════════════════════════════════════════════════════════
const AttendanceMonitoring = () => {
  const { profile } = useAuth();
  const districtId = profile?.district_id;

  const { data: records, isLoading, isError } = useQuery({
    queryKey: ["ddhs-attendance", districtId],
    enabled: !!districtId,
    queryFn: () => ddhsService.getDistrictAttendance(districtId!),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Attendance Monitoring</h1>
        <p className="page-subtitle">District-wide attendance tracking</p>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Doctor
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                PHC
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Date
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Check-in
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRow cols={5} />
            ) : isError ? (
              <ErrorRow cols={5} />
            ) : records && records.length > 0 ? (
              records.map((att: any) => (
                <tr
                  key={att.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="p-4 text-sm font-medium">
                    {att.doctor_name}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {att.phc_name}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {att.date}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {att.checkin_time
                      ? new Date(att.checkin_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        att.status === "present"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow
                cols={5}
                message="No attendance records available."
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// PART 6 — PHC RANKING
// ═════════════════════════════════════════════════════════════════════
const RankingPage = () => {
  const { profile } = useAuth();
  const districtId = profile?.district_id;

  const { data: rankings, isLoading, isError } = useQuery({
    queryKey: ["ddhs-rankings", districtId],
    enabled: !!districtId,
    queryFn: () => ddhsService.getPHCRankings(districtId!),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">PHC Ranking</h1>
        <p className="page-subtitle">
          Performance ranking — Attendance 50% · Doctors 30% · Medicine 20%
        </p>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Rank
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                PHC
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Score
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Attendance
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Doctors
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRow cols={5} />
            ) : isError ? (
              <ErrorRow cols={5} />
            ) : rankings && rankings.length > 0 ? (
              rankings.map((phc: any) => (
                <tr
                  key={phc.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="p-4 text-sm font-bold">#{phc.rank}</td>
                  <td className="p-4 text-sm font-medium">{phc.name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${phc.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono">{phc.score}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {phc.attendance}%
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {phc.doctors}
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow
                cols={5}
                message="Ranking will appear after attendance data is available."
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// PART 7 — PHC MAP
// ═════════════════════════════════════════════════════════════════════
const MapPage = () => {
  const { profile } = useAuth();
  const districtId = profile?.district_id;
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: phcs, isLoading, isError } = useQuery({
    queryKey: ["ddhs-map-phcs", districtId],
    enabled: !!districtId,
    queryFn: async () => {
      const phcData = await ddhsService.getDistrictPHCs(districtId!);
      const today = new Date().toISOString().split("T")[0];
      return Promise.all(
        phcData.map(async (phc: any) => {
          const { count: presentCount } = await supabase
            .from("attendance")
            .select("*", { count: "exact", head: true })
            .eq("phc_id", phc.id)
            .eq("date", today)
            .eq("status", "present");
          return {
            ...phc,
            attendance_percent: phc.doctors_count > 0 ? Math.round(((presentCount || 0) / phc.doctors_count) * 100) : 0,
          };
        })
      );
    },
  });

  // Realtime: auto-refresh when PHCs are added/updated
  useEffect(() => {
    if (!districtId) return;
    const channel = supabase.channel('phc-map-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'phcs', filter: `district_id=eq.${districtId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["ddhs-map-phcs", districtId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [districtId, queryClient]);

  const validPhcs = phcs?.filter((p: any) => p.latitude && p.longitude) || [];
  const total = phcs?.length || 0;
  const mapped = validPhcs.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">PHC Map</h1>
          <p className="page-subtitle">Geographic view of PHCs in your district</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PHC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-56 h-9"
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-success inline-block" /> Active</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-destructive inline-block" /> Inactive</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <div><div className="text-xs text-muted-foreground">Total PHCs</div><div className="text-lg font-semibold">{total}</div></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <MapPin className="h-5 w-5 text-success" />
          <div><div className="text-xs text-muted-foreground">Mapped on Map</div><div className="text-lg font-semibold">{mapped}</div></div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div><div className="text-xs text-muted-foreground">Missing Coords</div><div className="text-lg font-semibold">{total - mapped}</div></div>
        </div>
      </div>

      {/* Map */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : isError ? (
        <div className="glass-card p-8 text-center text-sm text-destructive">Failed to load PHC location data.</div>
      ) : phcs && phcs.length > 0 ? (
        <GoogleMapView phcs={validPhcs} searchQuery={searchQuery} />
      ) : (
        <div className="glass-card p-12 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No PHCs registered in your district.</p>
        </div>
      )}

      {/* PHC List below map */}
      {validPhcs.length > 0 && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">PHC</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Code</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Coordinates</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Doctors</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Attendance</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
            </tr></thead>
            <tbody>
              {validPhcs.map((phc: any) => (
                <tr key={phc.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/30 cursor-pointer" onClick={() => setSearchQuery(phc.name)}>
                  <td className="p-4 text-sm font-medium">{phc.name}</td>
                  <td className="p-4 text-xs font-mono text-muted-foreground">{phc.code}</td>
                  <td className="p-4 text-xs text-muted-foreground">{parseFloat(phc.latitude).toFixed(4)}°, {parseFloat(phc.longitude).toFixed(4)}°</td>
                  <td className="p-4 text-sm text-muted-foreground">{phc.doctors_count}</td>
                  <td className="p-4 text-sm text-muted-foreground">{phc.attendance_percent}%</td>
                  <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phc.status === "Active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{phc.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// PART 8 — MEDICINE MONITORING
// ═════════════════════════════════════════════════════════════════════
const MedicinePage = () => {
  const { profile } = useAuth();
  const districtId = profile?.district_id;

  const { data: inventory, isLoading, isError } = useQuery({
    queryKey: ["ddhs-medicine", districtId],
    enabled: !!districtId,
    queryFn: () => ddhsService.getDistrictMedicine(districtId!),
  });

  const lowStockCount =
    inventory?.filter((m: any) => m.is_low).length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Medicine Inventory</h1>
        <p className="page-subtitle">District medicine stock overview</p>
      </div>

      {lowStockCount > 0 && (
        <div className="glass-card p-4 border-l-4 border-warning flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <div className="text-sm font-medium">Low Stock Alert</div>
            <div className="text-xs text-muted-foreground">
              {lowStockCount} medicine{lowStockCount > 1 ? "s" : ""} below
              threshold across your district
            </div>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                PHC
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Medicine
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Quantity
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Threshold
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRow cols={5} />
            ) : isError ? (
              <ErrorRow cols={5} />
            ) : inventory && inventory.length > 0 ? (
              inventory.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="p-4 text-sm font-medium">{item.phc_name}</td>
                  <td className="p-4 text-sm text-foreground">
                    {item.medicine_name}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {item.quantity}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {item.threshold}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.is_low
                          ? "bg-warning/10 text-warning"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {item.is_low ? "Low Stock" : "Sufficient"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow
                cols={5}
                message="No medicine inventory data available."
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// PART 9 — FEEDBACK PAGE
// ═════════════════════════════════════════════════════════════════════
const FeedbackPage = () => {
  const { profile } = useAuth();
  const districtId = profile?.district_id;

  const { data: feedbacks, isLoading, isError } = useQuery({
    queryKey: ["ddhs-feedback", districtId],
    enabled: !!districtId,
    queryFn: () => ddhsService.getDistrictFeedback(districtId!),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Feedback</h1>
        <p className="page-subtitle">Public feedback across PHCs</p>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                PHC
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Patient
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Rating
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Comment
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRow cols={5} />
            ) : isError ? (
              <ErrorRow cols={5} />
            ) : feedbacks && feedbacks.length > 0 ? (
              feedbacks.map((fb: any) => (
                <tr
                  key={fb.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="p-4 text-sm font-medium">{fb.phc_name}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {fb.patient_name || "Anonymous"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${
                            s <= fb.rating
                              ? "fill-warning text-warning"
                              : "text-muted-foreground/20"
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                    {fb.comment || "—"}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(fb.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={5} message="No feedback submitted yet." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// PART 10 — PROFILE PAGE
// ═════════════════════════════════════════════════════════════════════
const ProfilePage = () => {
  const { user } = useAuth();

  const { data: profileData, isLoading, isError } = useQuery({
    queryKey: ["ddhs-profile", user?.id],
    enabled: !!user?.id,
    queryFn: () => ddhsService.getDDHSProfile(user!.id),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-header">Profile</h1>
          <p className="page-subtitle">Your account details</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (isError || !profileData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="page-header">Profile</h1>
          <p className="page-subtitle">Your account details</p>
        </div>
        <div className="glass-card p-8 text-center text-sm text-muted-foreground">
          Profile data not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Profile</h1>
        <p className="page-subtitle">Your account details</p>
      </div>
      <div className="glass-card p-6 max-w-md space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-border/30">
          <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold">{profileData.name}</div>
            <div className="text-xs text-muted-foreground capitalize">
              DDHS Administrator
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2 border-b border-border/30">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="text-sm font-medium">{profileData.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2 border-b border-border/30">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Phone</div>
            <div className="text-sm font-medium">
              {profileData.phone || "Not set"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2 border-b border-border/30">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">District</div>
            <div className="text-sm font-medium">
              {profileData.district_name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                profileData.status === "active"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {profileData.status === "active" ? "Active" : "Pending"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// PHC ADMIN APPROVALS
// ═════════════════════════════════════════════════════════════════════
const PhcAdminApprovalsPage = () => {
  const { profile } = useAuth();
  const districtId = profile?.district_id;
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: pendingAdmins, isLoading, isError } = useQuery({
    queryKey: ["ddhs-pending-admins", districtId],
    enabled: !!districtId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*, phc:phc_id(name)")
        .eq("role", "phc_admin")
        .eq("status", "pending")
        .eq("district_id", districtId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((u: any) => ({
        ...u,
        phc_name: u.phc?.name || "Not assigned",
      }));
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
      toast.success(action === "active" ? "PHC Admin approved!" : "PHC Admin rejected.");
      queryClient.invalidateQueries({ queryKey: ["ddhs-pending-admins"] });
      queryClient.invalidateQueries({ queryKey: ["ddhs-dashboard-stats"] });
    } catch (err: any) {
      toast.error("Failed: " + (err.message || "Unknown error"));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">PHC Admin Approvals</h1>
        <p className="page-subtitle">Review and approve pending PHC administrator registrations</p>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Email</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Phone</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">PHC</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Registered</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRow cols={6} />
            ) : isError ? (
              <ErrorRow cols={6} />
            ) : pendingAdmins && pendingAdmins.length > 0 ? (
              pendingAdmins.map((admin: any) => (
                <tr key={admin.id} className="border-b border-border/30 last:border-0">
                  <td className="p-4 text-sm font-medium">{admin.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{admin.email}</td>
                  <td className="p-4 text-sm text-muted-foreground">{admin.phone || "\u2014"}</td>
                  <td className="p-4 text-sm text-muted-foreground">{admin.phc_name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(admin.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(admin.id, "active")}
                        disabled={processingId === admin.id}
                        className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {processingId === admin.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleAction(admin.id, "rejected")}
                        disabled={processingId === admin.id}
                        className="text-xs px-3 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow cols={6} message="No pending PHC admin approvals." />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// ALERT CONFIGURATION PAGE
// ═════════════════════════════════════════════════════════════════════
const AlertConfigPage = () => {
  const { profile } = useAuth();
  const districtId = profile?.district_id;
  const queryClient = useQueryClient();

  const [intervalCols, setIntervalCols] = useState(2);
  const [minThreshold, setMinThreshold] = useState(75);
  const [absenceCount, setAbsenceCount] = useState(3);
  const [medicineShortage, setMedicineShortage] = useState(20);
  const [emergencyEscalation, setEmergencyEscalation] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["alert-config", districtId],
    enabled: !!districtId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alert_settings")
        .select("*")
        .eq("district_id", districtId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) {
      setIntervalCols(config.attendance_interval_hours ?? 2);
      setMinThreshold(config.min_attendance_threshold ?? 75);
      setAbsenceCount(config.absence_trigger_count ?? 3);
      setMedicineShortage(config.medicine_shortage_threshold ?? 20);
      setEmergencyEscalation(config.emergency_escalation_minutes ?? 30);
    }
  }, [config]);

  const handleSave = async () => {
    if (!districtId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("alert_settings").upsert(
        {
          district_id: districtId,
          attendance_interval_hours: intervalCols,
          min_attendance_threshold: minThreshold,
          absence_trigger_count: absenceCount,
          medicine_shortage_threshold: medicineShortage,
          emergency_escalation_minutes: emergencyEscalation,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "district_id" }
      );
      if (error) throw error;
      toast.success("Alert configuration updated globally.");
      queryClient.invalidateQueries({ queryKey: ["alert-config", districtId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = config?.updated_at 
    ? new Date(config.updated_at).toLocaleString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '') + ' pm'
    : "Not saved yet";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Alert Configuration</h1>
          <p className="page-subtitle">Configure system-wide alert rules and thresholds</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : "Save & Apply Globally"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="glass-card p-6 flex flex-col justify-between border border-white/5 bg-gradient-to-br from-background/50 to-primary/5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm text-foreground/90">Attendance Verification Interval</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">How often doctors must verify attendance</p>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="number" 
              value={intervalCols} 
              onChange={(e) => setIntervalCols(Number(e.target.value))}
              className="bg-black/20 border-white/5 text-center font-medium h-10 w-full" 
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">hours</span>
          </div>
        </div>
        {/* Card 2 */}
        <div className="glass-card p-6 flex flex-col justify-between border border-white/5 bg-gradient-to-br from-background/50 to-primary/5">
           <div>
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm text-foreground/90">Minimum Attendance Threshold</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Below this percentage, alerts will be triggered</p>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="number" 
              value={minThreshold}
              onChange={(e) => setMinThreshold(Number(e.target.value))}
              className="bg-black/20 border-white/5 text-center font-medium h-10 w-full" 
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">%</span>
          </div>
        </div>
        {/* Card 3 */}
        <div className="glass-card p-6 flex flex-col justify-between border border-white/5 bg-gradient-to-br from-background/50 to-primary/5">
           <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm text-foreground/90">Absence Alert Trigger Count</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Number of absences before an alert is triggered</p>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="number" 
              value={absenceCount}
              onChange={(e) => setAbsenceCount(Number(e.target.value))}
              className="bg-black/20 border-white/5 text-center font-medium h-10 w-full" 
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">absences</span>
          </div>
        </div>
        
        {/* Card 4 */}
        <div className="glass-card p-6 flex flex-col justify-between border border-white/5 bg-gradient-to-br from-background/50 to-primary/5">
           <div>
            <div className="flex items-center gap-2 mb-2">
              <Pill className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm text-foreground/90">Medicine Shortage Threshold</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Alert when stock falls below this percentage of threshold</p>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="number" 
              value={medicineShortage}
              onChange={(e) => setMedicineShortage(Number(e.target.value))}
              className="bg-black/20 border-white/5 text-center font-medium h-10 w-full" 
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">%</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="glass-card p-6 flex flex-col justify-between border border-white/5 bg-gradient-to-br from-background/50 to-primary/5">
           <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm text-foreground/90">Emergency Escalation Time</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-6">Time before unresponded emergencies are escalated</p>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="number" 
              value={emergencyEscalation}
              onChange={(e) => setEmergencyEscalation(Number(e.target.value))}
              className="bg-black/20 border-white/5 text-center font-medium h-10 w-full" 
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">minutes</span>
          </div>
        </div>

      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        Last updated: {formattedDate}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════
// MAIN ROUTER (unchanged structure)
// ═════════════════════════════════════════════════════════════════════
const DdhsDashboard = () => {
  return (
    <DashboardLayout role="ddhs" roleLabel="DDHS Admin" sidebarItems={sidebarItems}>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="phcs" element={<PhcManagement />} />
        <Route path="doctors" element={<DoctorMonitoring />} />
        <Route path="attendance" element={<AttendanceMonitoring />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="medicine" element={<MedicinePage />} />
        <Route path="alerts-config" element={<AlertConfigPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="approvals" element={<PhcAdminApprovalsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default DdhsDashboard;
