import { supabase } from "@/lib/supabase";

// ─── Helper: Get PHC IDs for a district ──────────────────────────────
async function getDistrictPhcIds(districtId: string): Promise<string[]> {
  const { data } = await supabase
    .from("phcs")
    .select("id")
    .eq("district_id", districtId);
  return data?.map((p) => p.id) || [];
}

// ─── Dashboard Stats ─────────────────────────────────────────────────
export async function getDashboardStats(districtId: string) {
  const phcIds = await getDistrictPhcIds(districtId);
  const today = new Date().toISOString().split("T")[0];

  // Parallel queries for speed
  const [phcsResult, alertsResult] = await Promise.all([
    supabase
      .from("phcs")
      .select("*", { count: "exact", head: true })
      .eq("district_id", districtId),
    supabase
      .from("alerts")
      .select("*, phcs(name)", { count: "exact" })
      .eq("district_id", districtId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  let totalDoctors = 0;
  let presentToday = 0;

  if (phcIds.length > 0) {
    const [doctorsResult, attendanceResult] = await Promise.all([
      supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .in("phc_id", phcIds),
      supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .in("phc_id", phcIds)
        .eq("date", today)
        .eq("status", "present"),
    ]);
    totalDoctors = doctorsResult.count || 0;
    presentToday = attendanceResult.count || 0;
  }

  const totalPHCs = phcsResult.count || 0;
  const avgAttendance =
    totalDoctors > 0 ? Math.round((presentToday / totalDoctors) * 100) : 0;
  const activeAlerts = alertsResult.count || 0;
  const recentAlerts = alertsResult.data || [];

  // PHC Performance data
  let phcPerformance: {
    name: string;
    doctors: number;
    attendance: number;
  }[] = [];

  if (phcIds.length > 0) {
    const { data: phcsData } = await supabase
      .from("phcs")
      .select("id, name")
      .eq("district_id", districtId);

    phcPerformance = await Promise.all(
      (phcsData || []).map(async (phc) => {
        const [docResult, attResult] = await Promise.all([
          supabase
            .from("doctors")
            .select("*", { count: "exact", head: true })
            .eq("phc_id", phc.id),
          supabase
            .from("attendance")
            .select("*", { count: "exact", head: true })
            .eq("phc_id", phc.id)
            .eq("date", today)
            .eq("status", "present"),
        ]);
        const docCount = docResult.count || 0;
        const attCount = attResult.count || 0;
        const attRate =
          docCount > 0 ? Math.round((attCount / docCount) * 100) : 0;
        return { name: phc.name, doctors: docCount, attendance: attRate };
      })
    );
  }

  // Avg PHC Score
  let avgScore = 0;
  if (phcPerformance.length > 0) {
    const scoreSum = phcPerformance.reduce((sum, phc) => {
      const attScore = phc.attendance * 0.5;
      const docScore = phc.doctors > 0 ? 30 : 0;
      const medScore = 20; // Default unless medicine alerts exist
      return sum + Math.min(100, attScore + docScore + medScore);
    }, 0);
    avgScore = Math.round(scoreSum / phcPerformance.length);
  }

  return {
    totalPHCs,
    totalDoctors,
    avgAttendance,
    activeAlerts,
    avgScore,
    recentAlerts,
    phcPerformance,
  };
}

// ─── PHC Management ──────────────────────────────────────────────────
export async function getDistrictPHCs(districtId: string) {
  const { data: phcData, error } = await supabase
    .from("phcs")
    .select(`*, admin:admin_id(name)`)
    .eq("district_id", districtId)
    .order("name");

  if (error) throw error;

  const phcsWithCounts = await Promise.all(
    (phcData || []).map(async (phc) => {
      const { count } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("phc_id", phc.id);
      return {
        ...phc,
        admin_name: (phc.admin as any)?.name || "Not Assigned",
        doctors_count: count || 0,
      };
    })
  );

  return phcsWithCounts;
}

export async function createPHC(
  districtId: string,
  data: {
    name: string;
    code: string;
    location?: string;
    latitude?: number;
    longitude?: number;
  }
) {
  const { data: result, error } = await supabase
    .from("phcs")
    .insert({
      name: data.name,
      code: data.code,
      district_id: districtId,
      location: data.location || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      status: "Active",
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

// ─── Doctor Monitoring ───────────────────────────────────────────────
export async function getDistrictDoctors(districtId: string) {
  const phcIds = await getDistrictPhcIds(districtId);
  if (phcIds.length === 0) return [];

  const { data, error } = await supabase
    .from("doctors")
    .select(
      `
      *,
      user:user_id(name, email, phone, status),
      phc:phc_id(name)
    `
    )
    .in("phc_id", phcIds);

  if (error) throw error;

  // Calculate attendance % for each doctor
  const doctorsWithAttendance = await Promise.all(
    (data || []).map(async (doc) => {
      const [totalResult, presentResult] = await Promise.all([
        supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("doctor_id", doc.user_id),
        supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("doctor_id", doc.user_id)
          .eq("status", "present"),
      ]);

      const totalDays = totalResult.count || 0;
      const presentDays = presentResult.count || 0;
      const attendancePercent =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      return {
        id: doc.id,
        user_id: doc.user_id,
        specialization: doc.specialization,
        qualification: doc.qualification,
        experience: doc.experience,
        doctor_name: (doc.user as any)?.name || "Unknown",
        doctor_status: (doc.user as any)?.status || "pending",
        phc_name: (doc.phc as any)?.name || "Unknown",
        attendance_percent: attendancePercent,
      };
    })
  );

  return doctorsWithAttendance;
}

// ─── Attendance Monitoring ───────────────────────────────────────────
export async function getDistrictAttendance(districtId: string) {
  const phcIds = await getDistrictPhcIds(districtId);
  if (phcIds.length === 0) return [];

  const { data, error } = await supabase
    .from("attendance")
    .select(
      `
      *,
      doctor:doctor_id(name),
      phc:phc_id(name)
    `
    )
    .in("phc_id", phcIds)
    .order("date", { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data || []).map((att) => ({
    ...att,
    doctor_name: (att.doctor as any)?.name || "Unknown",
    phc_name: (att.phc as any)?.name || "Unknown",
  }));
}

// ─── PHC Rankings ────────────────────────────────────────────────────
export async function getPHCRankings(districtId: string) {
  const { data: phcsData, error } = await supabase
    .from("phcs")
    .select("id, name")
    .eq("district_id", districtId);

  if (error) throw error;
  if (!phcsData || phcsData.length === 0) return [];

  const today = new Date().toISOString().split("T")[0];

  const ranked = await Promise.all(
    phcsData.map(async (phc) => {
      // Doctor count
      const { count: docCount } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("phc_id", phc.id);

      // Today's attendance
      const { count: presentCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("phc_id", phc.id)
        .eq("date", today)
        .eq("status", "present");

      // Low stock medicines (quantity below threshold of 10 as default)
      const { count: lowStockCount } = await supabase
        .from("inventory")
        .select("*", { count: "exact", head: true })
        .eq("phc_id", phc.id)
        .lt("quantity", 10);

      // Total inventory items
      const { count: totalMeds } = await supabase
        .from("inventory")
        .select("*", { count: "exact", head: true })
        .eq("phc_id", phc.id);

      const doctors = docCount || 0;
      const present = presentCount || 0;
      const attRate = doctors > 0 ? Math.round((present / doctors) * 100) : 0;

      // Score: attendance 50% + doctors 30% + medicine 20%
      const attScore = attRate * 0.5; // max 50
      const docScore = doctors > 0 ? 30 : 0; // max 30
      const medScore =
        (totalMeds || 0) > 0
          ? Math.round(
              (1 - (lowStockCount || 0) / (totalMeds || 1)) * 20
            )
          : 20; // max 20 (no inventory = full score)

      const score = Math.min(100, Math.round(attScore + docScore + medScore));

      return {
        id: phc.id,
        name: phc.name,
        doctors,
        attendance: attRate,
        score,
        rank: 0, // Will be set after sorting
      };
    })
  );

  // Sort by score descending and assign ranks
  ranked.sort((a, b) => b.score - a.score);
  ranked.forEach((phc, i) => {
    phc.rank = i + 1;
  });

  return ranked;
}

// ─── Medicine Inventory ──────────────────────────────────────────────
export async function getDistrictMedicine(districtId: string) {
  const phcIds = await getDistrictPhcIds(districtId);
  if (phcIds.length === 0) return [];

  const { data, error } = await supabase
    .from("inventory")
    .select(
      `
      *,
      phc:phc_id(name)
    `
    )
    .in("phc_id", phcIds)
    .order("medicine_name");

  if (error) throw error;

  return (data || []).map((item) => ({
    ...item,
    phc_name: (item.phc as any)?.name || "Unknown",
    is_low: item.quantity <= item.threshold,
  }));
}

// ─── Feedback ────────────────────────────────────────────────────────
export async function getDistrictFeedback(districtId: string) {
  const phcIds = await getDistrictPhcIds(districtId);
  if (phcIds.length === 0) return [];

  const { data, error } = await supabase
    .from("feedback")
    .select(
      `
      *,
      phc:phc_id(name)
    `
    )
    .in("phc_id", phcIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((fb) => ({
    ...fb,
    phc_name: (fb.phc as any)?.name || "Unknown",
  }));
}

// ─── Alerts ──────────────────────────────────────────────────────────
export async function getDistrictAlerts(districtId: string) {
  const { data, error } = await supabase
    .from("alerts")
    .select(
      `
      *,
      phc:phc_id(name)
    `
    )
    .eq("district_id", districtId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((alert) => ({
    ...alert,
    phc_name: (alert.phc as any)?.name || "Unknown",
  }));
}

// ─── DDHS Profile ────────────────────────────────────────────────────
export async function getDDHSProfile(userId: string) {
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!userData) return null;

  // Get district name
  let districtName = "Unknown";
  if (userData.district_id) {
    const { data: districtData } = await supabase
      .from("districts")
      .select("name")
      .eq("id", userData.district_id)
      .maybeSingle();
    districtName = districtData?.name || "Unknown";
  }

  return {
    ...userData,
    district_name: districtName,
  };
}
