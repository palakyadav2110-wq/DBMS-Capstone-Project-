import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, CarFront, ParkingSquare, ArrowRight, CalendarClock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { createBooking } from "./actions";

export default async function LocationsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: lots }, { data: vehicles }, params] = await Promise.all([
    supabase.from("parking_lots").select("id,name,address,timezone").eq("is_active", true).order("name"),
    user ? supabase.from("vehicles").select("id,registration_no,vehicle_type").eq("owner_id", user.id).order("registration_no") : Promise.resolve({ data: [] as any[] }),
    searchParams,
  ]);

  return <DashboardShell title="Find parking" description="Browse parking locations and reserve a space for your visit.">
    {params.error && <div className="notice error">{params.error}</div>}{params.message && <div className="notice">{params.message}</div>}
    {!user && <div className="notice">You are browsing as a guest. <Link href="/login" style={{fontWeight:800,textDecoration:"underline"}}>Sign in</Link> to reserve a space.</div>}
    {user && !vehicles?.length && <div className="notice">Add a vehicle before booking a space. <Link href="/vehicles" style={{fontWeight:800,textDecoration:"underline"}}>Register a vehicle</Link>.</div>}
    {lots?.length ? <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,360px),1fr))",gap:17}}>
      {lots.map(async (lot) => {
        const [{ data: slots }, { data: prices }] = await Promise.all([
          supabase.from("parking_slots").select("id,slot_code,vehicle_type,is_active").eq("lot_id",lot.id).eq("is_active",true).order("slot_code"),
          supabase.from("pricing_rules").select("vehicle_type,hourly_rate").eq("lot_id",lot.id).lte("effective_from",new Date().toISOString()).or(`effective_to.is.null,effective_to.gt.${new Date().toISOString()}`).order("hourly_rate"),
        ]);
        return <section className="card" key={lot.id}><div className="location-card"><div><span className="stat-icon" style={{position:"static",marginBottom:14}}><MapPin size={19}/></span><h3>{lot.name}</h3><p>{lot.address}</p></div><span className="badge">Active</span></div><div className="metric-row"><span><strong>{slots?.length ?? 0}</strong> listed spaces</span><span><strong>{prices?.length ?? 0}</strong> pricing rules</span></div><div className="section-head" style={{marginTop:22,marginBottom:12}}><div><h2>Spaces at this location</h2><p>Choose a slot and booking time below.</p></div></div>
          {slots?.length ? <div className="slot-grid">{slots.map((slot)=><div className="slot-tile" key={slot.id}><div className="slot-symbol"><CarFront size={21}/></div><strong>{slot.slot_code}</strong><span>{slot.vehicle_type === "any" ? "Any vehicle" : slot.vehicle_type}</span></div>)}</div> : <div className="empty-state"><ParkingSquare size={25}/><p>No active spaces have been added yet.</p></div>}
          <div style={{marginTop:18,borderTop:"1px solid #e7eae2",paddingTop:17}}><div className="section-head"><div><h2>Reserve a space</h2><p>Slot availability is verified by PostgreSQL at submission.</p></div></div>
            {user && vehicles?.length && slots?.length ? <form action={createBooking} className="form-stack"><div className="form-field"><label>Parking slot</label><select className="select" name="slot_id" required defaultValue=""><option value="" disabled>Select a slot</option>{slots.map(s=><option key={s.id} value={s.id}>{s.slot_code} · {s.vehicle_type}</option>)}</select></div><div className="form-field"><label>Vehicle</label><select className="select" name="vehicle_id" required defaultValue=""><option value="" disabled>Select your vehicle</option>{vehicles.map((v:any)=><option key={v.id} value={v.id}>{v.registration_no} · {v.vehicle_type}</option>)}</select></div><div className="form-field"><label>Start time</label><input className="input" type="datetime-local" name="start_time" min={new Date(Date.now()+60000).toISOString().slice(0,16)} required/></div><div className="form-field"><label>End time</label><input className="input" type="datetime-local" name="end_time" min={new Date(Date.now()+120000).toISOString().slice(0,16)} required/></div><SubmitButton><CalendarClock size={15}/> Reserve this slot</SubmitButton></form> : <Link className="button button-secondary" href={user ? "/vehicles" : "/login"}>{user ? "Add a vehicle first" : "Sign in to reserve"} <ArrowRight size={15}/></Link>}
          </div>
        </section>;
      })}
    </div> : <section className="card empty-state"><MapPin size={32}/><h3>No parking locations yet</h3><p>After the database migration, run the sample-data script in docs/seed.sql from Supabase SQL Editor to add a demo parking lot and spaces.</p><div className="notice" style={{maxWidth:480,margin:"0 auto"}}>Sample data is not created automatically; this prevents accidental demo records appearing in your real database.</div></section>}
    <p className="footer-note">Displayed slots are listed spaces, not a guarantee of availability. Reservation conflicts are checked securely by the database.</p>
  </DashboardShell>;
}
