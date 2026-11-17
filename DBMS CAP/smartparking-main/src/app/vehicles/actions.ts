"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function back(message: string, error = false): never {
  redirect(`/vehicles?${error ? "error" : "message"}=${encodeURIComponent(message)}`);
}

export async function addVehicle(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const registration = String(formData.get("registration_no") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const vehicleType = String(formData.get("vehicle_type") ?? "");
  const make = String(formData.get("make") ?? "").trim() || null;
  const model = String(formData.get("model") ?? "").trim() || null;
  if (registration.length < 4 || registration.length > 20) back("Registration number must be between 4 and 20 characters.", true);
  if (!["car", "motorcycle", "suv", "ev", "other"].includes(vehicleType)) back("Select a valid vehicle type.", true);

  const { error } = await supabase.from("vehicles").insert({
    owner_id: user.id, registration_no: registration, vehicle_type: vehicleType, make, model,
  });
  if (error) back(error.code === "23505" ? "That registration number is already registered." : error.message, true);
  revalidatePath("/vehicles");
  revalidatePath("/dashboard");
  back("Vehicle added successfully.");
}

export async function deleteVehicle(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = String(formData.get("vehicle_id") ?? "");
  const { error } = await supabase.from("vehicles").delete().eq("id", id).eq("owner_id", user.id);
  if (error) back(error.message, true);
  revalidatePath("/vehicles");
  back("Vehicle removed.");
}
