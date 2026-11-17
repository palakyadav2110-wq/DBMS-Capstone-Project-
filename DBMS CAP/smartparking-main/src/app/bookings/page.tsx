import { redirect } from "next/navigation";
import { CalendarDays, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking } from "./actions";
import { formatDate } from "@/lib/format";

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: bookings }, params] = await Promise.all([
    supabase.from("bookings").select("id,start_time,end_time,status,created_at,vehicles(registration_no),parking_slots(slot_code,parking_lots(name,address))").eq("user_id",user.id).order("created_at",{ascending:false}),
    searchParams,
  ]);

  return <DashboardShell title="My bookings" description="Review your reservations and cancel eligible upcoming bookings.">
    {params.error && <div className="notice error">{params.error}</div>}{params.message && <div className="notice">{params.message}</div>}
    <section className="card"><div className="section-head"><div><h2>Reservation history</h2><p>{bookings?.length ?? 0} booking(s) recorded for your account</p></div></div>
      {bookings?.length ? <div className="table-wrap"><table><thead><tr><th>BOOKING / SPACE</th><th>VEHICLE</th><th>TIME WINDOW</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{bookings.map((b:any)=><tr key={b.id}><td><strong>{b.parking_slots?.slot_code ?? "Parking slot"}</strong><div style={{fontSize:10,color:"#899387",marginTop:4}}>{b.parking_slots?.parking_lots?.name ?? "Location"}</div><div style={{fontSize:10,color:"#a0a79c",marginTop:4}}>{b.id.slice(0,8).toUpperCase()}</div></td><td>{b.vehicles?.registration_no ?? "—"}</td><td>{formatDate(b.start_time)}<div style={{fontSize:10,color:"#899387",marginTop:4}}>until {formatDate(b.end_time)}</div></td><td><span className={`badge ${b.status}`}>{b.status.replace("_"," ")}</span></td><td>{b.status==="confirmed" && new Date(b.start_time)>new Date() ? <form action={cancelBooking}><input type="hidden" name="booking_id" value={b.id}/><SubmitButton className="button button-danger button-small" pendingText="Cancelling…"><XCircle size={13}/> Cancel</SubmitButton></form> : <span style={{color:"#a0a79c"}}>—</span>}</td></tr>)}</tbody></table></div> : <div className="empty-state"><CalendarDays size={30}/><h3>Your bookings will appear here</h3><p>Explore a parking location to create your first reservation.</p><a className="button button-primary" href="/locations">Find parking</a></div>}
    </section>
  </DashboardShell>;
}
