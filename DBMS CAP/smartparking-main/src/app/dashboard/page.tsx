import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CarFront, MapPin, ParkingSquare, ArrowUpRight, Clock3 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ count: vehicleCount }, { count: bookingCount }, { count: activeCount }, { data: bookings }, { count: slotCount }] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["confirmed", "checked_in"]),
    supabase.from("bookings").select("id,start_time,end_time,status,vehicles(registration_no),parking_slots(slot_code,parking_lots(name))").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("parking_slots").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return <DashboardShell title="Your parking overview" description="Everything you need for a smoother arrival, all in one place.">
    <section className="hero-card"><h2>Good parking starts before you arrive.</h2><p>Find a location, select a time, and reserve a space. Your next visit can be a little less stressful.</p><Link className="button" href="/locations">Find parking <ArrowUpRight size={15}/></Link></section>
    <div className="grid stats-grid" style={{marginTop:18}}>
      <div className="card stat-card"><span className="stat-icon"><CarFront size={19}/></span><div className="stat-label">My vehicles</div><div className="stat-value">{vehicleCount ?? 0}</div><div className="stat-note">Registered to your account</div></div>
      <div className="card stat-card"><span className="stat-icon"><CalendarDays size={19}/></span><div className="stat-label">All bookings</div><div className="stat-value">{bookingCount ?? 0}</div><div className="stat-note">Your reservation history</div></div>
      <div className="card stat-card"><span className="stat-icon"><Clock3 size={19}/></span><div className="stat-label">Upcoming / active</div><div className="stat-value">{activeCount ?? 0}</div><div className="stat-note">Confirmed or checked in</div></div>
      <div className="card stat-card"><span className="stat-icon"><ParkingSquare size={19}/></span><div className="stat-label">Listed spaces</div><div className="stat-value">{slotCount ?? 0}</div><div className="stat-note">Active spaces across locations</div></div>
    </div>
    <div className="grid two-grid">
      <section className="card"><div className="section-head"><div><h2>Recent bookings</h2><p>Your latest reservations and parking plans</p></div><Link className="text-link" href="/bookings">View all ↗</Link></div>
        {bookings?.length ? <div className="table-wrap"><table><thead><tr><th>SPACE</th><th>START TIME</th><th>STATUS</th></tr></thead><tbody>{bookings.map((b:any)=><tr key={b.id}><td><strong>{b.parking_slots?.slot_code ?? "Slot"}</strong><div style={{fontSize:10,color:"#899387",marginTop:4}}>{b.parking_slots?.parking_lots?.name ?? "Parking location"}</div></td><td>{formatDate(b.start_time)}</td><td><span className={`badge ${b.status}`}>{b.status.replace("_"," ")}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><CalendarDays size={28}/><h3>No bookings yet</h3><p>When you make your first reservation, its details will appear here.</p><Link className="button button-primary" href="/locations">Explore parking</Link></div>}
      </section>
      <section className="card"><div className="section-head"><div><h2>Quick actions</h2><p>Jump straight to what you need</p></div></div><div className="grid" style={{gap:10}}><Link href="/locations" className="quick-action"><span className="quick-icon"><MapPin size={19}/></span><span><strong>Find a parking space</strong><small>Explore locations and availability</small></span><ArrowUpRight size={16}/></Link><Link href="/vehicles" className="quick-action"><span className="quick-icon"><CarFront size={19}/></span><span><strong>Manage vehicles</strong><small>Add or update your vehicle details</small></span><ArrowUpRight size={16}/></Link><Link href="/bookings" className="quick-action"><span className="quick-icon"><CalendarDays size={19}/></span><span><strong>My bookings</strong><small>Review or cancel eligible reservations</small></span><ArrowUpRight size={16}/></Link></div><div className="notice" style={{marginTop:16,marginBottom:0}}>Bookings are validated by PostgreSQL to prevent overlapping reservations for the same slot.</div></section>
    </div>
    <style>{`.quick-action{display:flex;align-items:center;gap:12px;border:1px solid #e8ece4;border-radius:12px;padding:13px;color:#657263}.quick-action>span:nth-child(2){display:grid;gap:4px;flex:1}.quick-action strong{font-size:12px;color:#2b382d}.quick-action small{font-size:10px;color:#899387}.quick-icon{width:36px;height:36px;display:grid;place-items:center;border-radius:10px;background:#edf3e9;color:#47734f}.quick-action:hover{border-color:#b8cdb4;background:#fbfdf9}`}</style>
  </DashboardShell>;
}
