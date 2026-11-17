import { redirect } from "next/navigation";
import { CarFront, ShieldCheck, LogIn, LogOut } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { checkInBooking, checkOutSession } from "./actions";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if (!profile || !["staff","admin"].includes(profile.role)) redirect("/dashboard?error=Staff%20access%20required.");
  const [{ data: bookings }, { data: sessions }, params] = await Promise.all([
    supabase.from("bookings").select("id,start_time,end_time,status,vehicles(registration_no),parking_slots(slot_code,parking_lots(name))").eq("status","confirmed").order("start_time").limit(50),
    supabase.from("parking_sessions").select("id,entry_time,rate_per_hour_snapshot,vehicles(registration_no),parking_slots(slot_code,parking_lots(name))").is("exit_time",null).order("entry_time").limit(50),
    searchParams,
  ]);
  return <DashboardShell title="Gate operations" description="Check vehicles in and out. Charges and session records are handled by PostgreSQL.">
    {params.error && <div className="notice error">{params.error}</div>}{params.message && <div className="notice">{params.message}</div>}
    <div className="grid stats-grid"><div className="card stat-card"><span className="stat-icon"><CalendarDaysIcon/></span><div className="stat-label">Confirmed bookings shown</div><div className="stat-value">{bookings?.length ?? 0}</div><div className="stat-note">First 50 confirmed reservations</div></div><div className="card stat-card"><span className="stat-icon"><CarFront size={19}/></span><div className="stat-label">Vehicles currently parked</div><div className="stat-value">{sessions?.length ?? 0}</div><div className="stat-note">Active parking sessions</div></div></div>
    <div className="grid two-grid"><section className="card"><div className="section-head"><div><h2>Check-in queue</h2><p>Confirmed bookings ready for gate processing</p></div><ShieldCheck size={20}/></div>
      {bookings?.length ? <div className="table-wrap"><table><thead><tr><th>VEHICLE / SLOT</th><th>START</th><th>ACTION</th></tr></thead><tbody>{bookings.map((b:any)=><tr key={b.id}><td><strong>{b.vehicles?.registration_no}</strong><div style={{fontSize:10,color:"#899387",marginTop:4}}>{b.parking_slots?.slot_code} · {b.parking_slots?.parking_lots?.name}</div></td><td>{formatDate(b.start_time)}</td><td><form action={checkInBooking}><input type="hidden" name="booking_id" value={b.id}/><SubmitButton className="button button-primary button-small"><LogIn size={13}/> Check in</SubmitButton></form></td></tr>)}</tbody></table></div> : <div className="empty-state"><p>No confirmed bookings to display.</p></div>}
    </section><section className="card"><div className="section-head"><div><h2>Currently parked</h2><p>Active sessions awaiting exit</p></div></div>
      {sessions?.length ? <div className="table-wrap"><table><thead><tr><th>VEHICLE / SLOT</th><th>RATE</th><th>ACTION</th></tr></thead><tbody>{sessions.map((s:any)=><tr key={s.id}><td><strong>{s.vehicles?.registration_no}</strong><div style={{fontSize:10,color:"#899387",marginTop:4}}>{s.parking_slots?.slot_code}</div><div style={{fontSize:10,color:"#a0a79c",marginTop:4}}>Since {formatDate(s.entry_time)}</div></td><td>{formatCurrency(s.rate_per_hour_snapshot)}/hr</td><td><form action={checkOutSession} className="form-stack" style={{gap:7,minWidth:120}}><input type="hidden" name="session_id" value={s.id}/><select className="select" name="method" defaultValue="cash"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="other">Other</option></select><label style={{display:"flex",gap:5,alignItems:"center",fontSize:10}}><input type="checkbox" name="mark_paid" value="yes"/> Mark paid</label><SubmitButton className="button button-secondary button-small"><LogOut size={13}/> Check out</SubmitButton></form></td></tr>)}</tbody></table></div> : <div className="empty-state"><CarFront size={28}/><h3>No active sessions</h3><p>Checked-in vehicles will appear here until staff records their exit.</p></div>}
    </section></div>
  </DashboardShell>;
}

function CalendarDaysIcon() { return <ShieldCheck size={19}/>; }
