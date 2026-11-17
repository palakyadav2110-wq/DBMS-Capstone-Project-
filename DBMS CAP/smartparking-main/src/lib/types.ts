export type AppRole = "customer" | "staff" | "admin";

export type ParkingLot = {
  id: string;
  name: string;
  address: string;
  timezone: string;
  is_active: boolean;
};

export type ParkingSlot = {
  id: string;
  lot_id: string;
  slot_code: string;
  vehicle_type: string;
  is_active: boolean;
};

export type Vehicle = {
  id: string;
  owner_id: string;
  registration_no: string;
  vehicle_type: string;
  make: string | null;
  model: string | null;
};

export type Booking = {
  id: string;
  user_id: string;
  vehicle_id: string;
  slot_id: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "checked_in" | "completed";
  created_at: string;
};
