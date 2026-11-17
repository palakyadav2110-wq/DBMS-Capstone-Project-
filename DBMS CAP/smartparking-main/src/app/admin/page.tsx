
import { redirect } from "next/navigation";
import {
  Building2,
  CarFront,
  IndianRupee,
  Users,
  Plus,
  Database,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { addLot, addSlot, addPricingRule } from "./actions";
import { formatCurrency } from "@/lib/format";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard?error=Admin%20access%20required.");
  }

  const [
    { data: lots },
    { data: slots },
    { data: pricing },
    { count: usersCount },
    { count: bookingsCount },
    params,
  ] = await Promise.all([
    supabase
      .from("parking_lots")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase
      .from("parking_slots")
      .select(
        "id,lot_id,slot_code,vehicle_type,is_active,parking_lots(name)"
      )
      .order("slot_code"),

    supabase
      .from("pricing_rules")
      .select(
        "id,lot_id,vehicle_type,hourly_rate,effective_from,effective_to,parking_lots(name)"
      )
      .order("effective_from", { ascending: false }),

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true }),

    searchParams,
  ]);

  const lotOptions = lots ?? [];
  const parkingSlots = slots ?? [];
  const pricingRules = pricing ?? [];

  return (
    <DashboardShell
      title="Parking management"
      description="Manage facilities, spaces, pricing, and monitor your SmartPark database."
    >
      {params.error && (
        <div className="notice error">{params.error}</div>
      )}

      {params.message && (
        <div className="notice">{params.message}</div>
      )}

      {/* Dashboard statistics */}
      <div className="grid stats-grid">
        <div className="card stat-card">
          <span className="stat-icon">
            <Building2 size={19} />
          </span>
          <div className="stat-label">Parking locations</div>
          <div className="stat-value">{lotOptions.length}</div>
          <div className="stat-note">Facilities configured</div>
        </div>

        <div className="card stat-card">
          <span className="stat-icon">
            <CarFront size={19} />
          </span>
          <div className="stat-label">Parking spaces</div>
          <div className="stat-value">{parkingSlots.length}</div>
          <div className="stat-note">Individual space records</div>
        </div>

        <div className="card stat-card">
          <span className="stat-icon">
            <Users size={19} />
          </span>
          <div className="stat-label">Registered accounts</div>
          <div className="stat-value">{usersCount ?? 0}</div>
          <div className="stat-note">Profiles in the database</div>
        </div>

        <div className="card stat-card">
          <span className="stat-icon">
            <Database size={19} />
          </span>
          <div className="stat-label">Total bookings</div>
          <div className="stat-value">{bookingsCount ?? 0}</div>
          <div className="stat-note">All booking statuses</div>
        </div>
      </div>

      {/* Locations and parking-space forms */}
      <div className="grid two-grid">
        <section className="card">
          <div className="section-head">
            <div>
              <h2>Parking locations</h2>
              <p>Facilities customers can browse</p>
            </div>
            <Building2 size={20} />
          </div>

          <form
            action={addLot}
            className="form-stack"
            style={{ marginBottom: 22 }}
          >
            <div className="form-field">
              <label htmlFor="location-name">Location name</label>
              <input
                id="location-name"
                className="input"
                name="name"
                placeholder="e.g. Campus North Parking"
                required
                minLength={2}
              />
            </div>

            <div className="form-field">
              <label htmlFor="location-address">Address</label>
              <input
                id="location-address"
                className="input"
                name="address"
                placeholder="Street, city"
                required
              />
            </div>

            <SubmitButton>
              <Plus size={14} /> Add location
            </SubmitButton>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>LOCATION</th>
                  <th>ADDRESS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {lotOptions.map((lot) => (
                  <tr key={lot.id}>
                    <td>
                      <strong>{lot.name}</strong>
                    </td>
                    <td>{lot.address}</td>
                    <td>
                      <span className="badge">
                        {lot.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}

                {lotOptions.length === 0 && (
                  <tr>
                    <td colSpan={3}>No parking locations yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <h2>Add a parking space</h2>
              <p>Slot codes must be unique within a location.</p>
            </div>
            <CarFront size={20} />
          </div>

          {lotOptions.length > 0 ? (
            <form action={addSlot} className="form-stack">
              <div className="form-field">
                <label htmlFor="slot-lot">Location</label>
                <select
                  id="slot-lot"
                  className="select"
                  name="lot_id"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select location
                  </option>
                  {lotOptions.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="slot-code">Slot code</label>
                <input
                  id="slot-code"
                  className="input"
                  name="slot_code"
                  placeholder="e.g. A01"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="slot-vehicle">Supported vehicle type</label>
                <select
                  id="slot-vehicle"
                  className="select"
                  name="vehicle_type"
                  defaultValue="any"
                >
                  <option value="any">Any vehicle</option>
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="suv">SUV</option>
                  <option value="ev">Electric vehicle</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <SubmitButton>
                <Plus size={14} /> Add space
              </SubmitButton>
            </form>
          ) : (
            <div className="empty-state">
              <p>Create a location first, then add spaces.</p>
            </div>
          )}

          {/* Pricing rules form */}
          <div
            style={{
              borderTop: "1px solid #e7eae2",
              marginTop: 22,
              paddingTop: 20,
            }}
          >
            <div className="section-head">
              <div>
                <h2>Pricing rules</h2>
                <p>Set a rate per vehicle type and location.</p>
              </div>
              <IndianRupee size={19} />
            </div>

            {lotOptions.length > 0 ? (
              <form action={addPricingRule} className="form-stack">
                <div className="form-field">
                  <label htmlFor="pricing-lot">Location</label>
                  <select
                    id="pricing-lot"
                    className="select"
                    name="lot_id"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select location
                    </option>
                    {lotOptions.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="pricing-vehicle">Vehicle type</label>
                  <select
                    id="pricing-vehicle"
                    className="select"
                    name="vehicle_type"
                    defaultValue="car"
                  >
                    <option value="car">Car</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="suv">SUV</option>
                    <option value="ev">Electric vehicle</option>
                    <option value="other">Other</option>
                    <option value="any">Any vehicle</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="hourly-rate">Hourly rate (₹)</label>
                  <input
                    id="hourly-rate"
                    className="input"
                    name="hourly_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="40.00"
                    required
                  />
                </div>

                <SubmitButton>
                  <Plus size={14} /> Add pricing rule
                </SubmitButton>
              </form>
            ) : (
              <div className="empty-state">
                <p>Create a location before adding pricing rules.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Current parking spaces table */}
      <section className="card" style={{ marginTop: 18 }}>
        <div className="section-head">
          <div>
            <h2>Current parking spaces</h2>
            <p>Relational view of all configured slots</p>
          </div>
        </div>

        {parkingSlots.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SPACE</th>
                  <th>LOCATION</th>
                  <th>VEHICLE TYPE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {parkingSlots.map((slot: any) => (
                  <tr key={slot.id}>
                    <td>
                      <strong>{slot.slot_code}</strong>
                    </td>
                    <td>{slot.parking_lots?.name ?? "—"}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {slot.vehicle_type}
                    </td>
                    <td>
                      <span className="badge">
                        {slot.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No spaces yet. Add a location and create spaces above.</p>
          </div>
        )}
      </section>

      {/* Pricing overview table */}
      <section className="card" style={{ marginTop: 18 }}>
        <div className="section-head">
          <div>
            <h2>Pricing overview</h2>
            <p>Effective rates configured in PostgreSQL</p>
          </div>
        </div>

        {pricingRules.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>LOCATION</th>
                  <th>VEHICLE TYPE</th>
                  <th>HOURLY RATE</th>
                  <th>EFFECTIVE FROM</th>
                </tr>
              </thead>
              <tbody>
                {pricingRules.map((rule: any) => (
                  <tr key={rule.id}>
                    <td>{rule.parking_lots?.name ?? "—"}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {rule.vehicle_type}
                    </td>
                    <td>
                      <strong>
                        {formatCurrency(rule.hourly_rate)}
                      </strong>
                    </td>
                    <td>
                      {new Date(rule.effective_from).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No pricing rules yet.</p>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
