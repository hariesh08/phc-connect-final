import { supabase } from "@/lib/supabase";

// ─── Attendance ──────────────────────────────────────────────────────
export async function getAttendance(phcId: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*, doctor:doctor_id(name)")
    .eq("phc_id", phcId)
    .order("date", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []).map((a) => ({
    ...a,
    doctor_name: (a.doctor as any)?.name || "Unknown",
  }));
}

// ─── Medicine Inventory ──────────────────────────────────────────────
export async function getMedicines(phcId: string) {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("phc_id", phcId)
    .order("medicine_name");
  if (error) throw error;
  return (data || []).map((m) => ({
    ...m,
    is_low: m.quantity <= m.threshold,
  }));
}

export async function addMedicine(phcId: string, data: { medicine_name: string; quantity: number; threshold: number }) {
  const { data: result, error } = await supabase
    .from("inventory")
    .insert({ phc_id: phcId, medicine_name: data.medicine_name, quantity: data.quantity, threshold: data.threshold })
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateMedicineQty(id: string, quantity: number) {
  const { error } = await supabase.from("inventory").update({ quantity }).eq("id", id);
  if (error) throw error;
}

// ─── Ambulance Requests ──────────────────────────────────────────────
export async function getAmbulanceRequests(phcId: string) {
  const { data, error } = await supabase
    .from("ambulance_requests")
    .select("*")
    .eq("requesting_phc", phcId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateAmbulanceStatus(id: string, status: string) {
  const { error } = await supabase.from("ambulance_requests").update({ status }).eq("id", id);
  if (error) throw error;
}

// ─── Vaccinations ────────────────────────────────────────────────────
export async function getVaccinations(phcId: string) {
  const { data, error } = await supabase
    .from("vaccinations")
    .select("*, doctor:doctor_id(name)")
    .eq("phc_id", phcId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data || []).map((v) => ({
    ...v,
    doctor_name: (v.doctor as any)?.name || "—",
  }));
}

export async function addVaccination(phcId: string, data: { patient_name: string; vaccine_name: string; dose: string; doctor_id?: string }) {
  const { error } = await supabase
    .from("vaccinations")
    .insert({ phc_id: phcId, patient_name: data.patient_name, vaccine_name: data.vaccine_name, dose: data.dose, doctor_id: data.doctor_id || null });
  if (error) throw error;
}

// ─── Feedback ────────────────────────────────────────────────────────
export async function getFeedback(phcId: string) {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("phc_id", phcId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─── Profile ─────────────────────────────────────────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  let districtName = "—";
  let phcName = "—";
  if (data.district_id) {
    const { data: d } = await supabase.from("districts").select("name").eq("id", data.district_id).maybeSingle();
    districtName = d?.name || "—";
  }
  if (data.phc_id) {
    const { data: p } = await supabase.from("phcs").select("name").eq("id", data.phc_id).maybeSingle();
    phcName = p?.name || "—";
  }
  return { ...data, district_name: districtName, phc_name: phcName };
}

export async function updateProfile(userId: string, updates: { phone?: string }) {
  const { error } = await supabase.from("users").update(updates).eq("id", userId);
  if (error) throw error;
}
