-- Run once after applying the migration, from Supabase SQL Editor.
with lot as (
 insert into public.parking_lots(name,address,timezone,is_active)
 values('SmartPark Demo Lot','Demo campus, India','Asia/Kolkata',true) returning id
),
slots as (
 insert into public.parking_slots(lot_id,slot_code,vehicle_type)
 select lot.id,s.slot_code,s.vehicle_type from lot
 cross join(values('A01','car'),('A02','car'),('A03','car'),('A04','car'),
 ('B01','motorcycle'),('B02','motorcycle'),('B03','motorcycle'),('C01','ev'),('C02','any')) as s(slot_code,vehicle_type)
 returning lot_id
)
insert into public.pricing_rules(lot_id,vehicle_type,hourly_rate,effective_from)
select distinct lot_id,x.vehicle_type,x.hourly_rate,now()-interval '1 day' from slots
cross join(values('car',40.00::numeric),('motorcycle',20.00::numeric),('suv',60.00::numeric),
('ev',45.00::numeric),('other',30.00::numeric),('any',30.00::numeric)) as x(vehicle_type,hourly_rate);
