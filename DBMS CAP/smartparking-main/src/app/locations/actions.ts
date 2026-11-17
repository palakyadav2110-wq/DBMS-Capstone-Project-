"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createBooking(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slotId = String(formData.get("slot_id") ?? "");
  const vehicleId = String(formData.get("vehicle_id") ?? "");
  const startRaw = String(formData.get("start_time") ?? "");
  const endRaw = String(formData.get("end_time") ?? "");
  const start = new Date(startRaw);
  const end = new Date(endRaw);

  if (!slotId || !vehicleId || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    redirect("/locations?error=Choose%20a%20slot,%20vehicle,%20and%20valid%20times.");
  }
  if (end <= start) redirect("/locations?error=End%20time%20must%20be%20after%20start%20time.");

  const { error } = await supabase.rpc("create_booking", {
    p_slot_id: slotId,
    p_vehicle_id: vehicleId,
    p_start_time: start.toISOString(),
    p_end_time: end.toISOString(),
  });

  if (error) redirect(`/locations?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/locations");
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  redirect("/bookings?message=Your%20parking%20space%20has%20been%20reserved.");
}
