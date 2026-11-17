import Link from "next/link";
import { redirect } from "next/navigation";
import { CarFront, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { addVehicle, deleteVehicle } from "./actions";

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: vehicles }, params] = await Promise.all([
    supabase.from("vehicles").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
    searchParams,
  ]);

  return <DashboardShell title="My vehicles" description="Register the vehicles you may use for parking reservations.">
    {params.error && <div className="notice error">{params.error}</div>}{params.message && <div className="notice">{params.message}</div>}
    <div className="grid two-grid" style={{marginTop:0}}>
      <section className="card"><div className="section-head"><div><h2>Registered vehicles</h2><p>{vehicles?.length ?? 0} vehicle(s) on your account</p></div></div>
        {vehicles?.length ? <div className="table-wrap"><table><thead><tr><th>REGISTRATION</th><th>TYPE</th><th>VEHICLE</th><th></th></tr></thead><tbody>{vehicles.map((v)=><tr key={v.id}><td><strong>{v.registration_no}</strong></td><td style={{textTransform:"capitalize"}}>{v.vehicle_type}</td><td>{[v.make,v.model].filter(Boolean).join(" ") || "—"}</td><td><form action={deleteVehicle}><input type="hidden" name="vehicle_id" value={v.id}/><button className="button button-danger button-small" title="Remove vehicle" type="submit"><Trash2 size={13}/></button></form></td></tr>)}</tbody></table></div> : <div className="empty-state"><CarFront size={30}/><h3>No vehicles registered</h3><p>Add your vehicle so the booking system can check its type against the parking space.</p></div>}
      </section>
      <section className="card"><div className="section-head"><div><h2>Add a vehicle</h2><p>Registration numbers are stored in uppercase.</p></div><span className="stat-icon" style={{position:"static"}}><Plus size={19}/></span></div>
        <form action={addVehicle} className="form-stack"><div className="form-field"><label htmlFor="registration_no">Registration number</label><input className="input" id="registration_no" name="registration_no" placeholder="e.g. DL01AB1234" minLength={4} maxLength={20} required/></div><div className="form-field"><label htmlFor="vehicle_type">Vehicle type</label><select className="select" id="vehicle_type" name="vehicle_type" required defaultValue="car"><option value="car">Car</option><option value="motorcycle">Motorcycle</option><option value="suv">SUV</option><option value="ev">Electric vehicle</option><option value="other">Other</option></select></div><div className="form-field"><label htmlFor="make">Make (optional)</label><input className="input" id="make" name="make" placeholder="e.g. Hyundai"/></div><div className="form-field"><label htmlFor="model">Model (optional)</label><input className="input" id="model" name="model" placeholder="e.g. i20"/></div><SubmitButton><Plus size={15}/> Add vehicle</SubmitButton></form>
      </section>
    </div>
  </DashboardShell>;
}
