"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelBooking(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const bookingId = String(formData.get("booking_id") ?? "");
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: bookingId });
  if (error) redirect(`/bookings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  redirect("/bookings?message=Booking%20cancelled.");
}
