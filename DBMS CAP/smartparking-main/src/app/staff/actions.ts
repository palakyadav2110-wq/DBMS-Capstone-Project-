"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function checkInBooking(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const bookingId = String(formData.get("booking_id") ?? "");
  const { error } = await supabase.rpc("check_in_booking", { p_booking_id: bookingId });
  if (error) redirect(`/staff?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/staff");
  revalidatePath("/bookings");
  redirect("/staff?message=Vehicle%20checked%20in.");
}

export async function checkOutSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const sessionId = String(formData.get("session_id") ?? "");
  const method = String(formData.get("method") ?? "other");
  const markPaid = String(formData.get("mark_paid") ?? "") === "yes";
  const { error } = await supabase.rpc("check_out_session", {
    p_session_id: sessionId,
    p_payment_method: method,
    p_mark_paid: markPaid,
  });
  if (error) redirect(`/staff?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  redirect("/staff?message=Vehicle%20checked%20out.");
}
