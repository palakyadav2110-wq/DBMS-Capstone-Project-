"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard?error=Admin%20access%20required.");
  return supabase;
}

export async function addLot(formData: FormData) {
  const supabase = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (name.length < 2 || !address) redirect("/admin?error=Enter%20a%20location%20name%20and%20address.");
  const { error } = await supabase.from("parking_lots").insert({ name, address, timezone: "Asia/Kolkata", is_active: true });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  revalidatePath("/locations");
  redirect("/admin?message=Parking%20location%20created.");
}

export async function addSlot(formData: FormData) {
  const supabase = await requireAdmin();
  const lotId = String(formData.get("lot_id") ?? "");
  const slotCode = String(formData.get("slot_code") ?? "").trim().toUpperCase();
  const vehicleType = String(formData.get("vehicle_type") ?? "any");
  if (!lotId || !slotCode) redirect("/admin?error=Choose%20a%20location%20and%20enter%20a%20slot%20code.");
  const { error } = await supabase.from("parking_slots").insert({ lot_id: lotId, slot_code: slotCode, vehicle_type: vehicleType, is_active: true });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  revalidatePath("/locations");
  redirect("/admin?message=Parking%20slot%20created.");
}

export async function addPricingRule(formData: FormData) {
  const supabase = await requireAdmin();
  const lotId = String(formData.get("lot_id") ?? "");
  const vehicleType = String(formData.get("vehicle_type") ?? "");
  const rate = Number(formData.get("hourly_rate"));
  if (!lotId || !["car","motorcycle","suv","ev","other","any"].includes(vehicleType) || !Number.isFinite(rate) || rate < 0) redirect("/admin?error=Enter%20valid%20pricing%20details.");
  const { error } = await supabase.from("pricing_rules").insert({ lot_id: lotId, vehicle_type: vehicleType, hourly_rate: rate, effective_from: new Date().toISOString() });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  revalidatePath("/locations");
  redirect("/admin?message=Pricing%20rule%20created.");
}
