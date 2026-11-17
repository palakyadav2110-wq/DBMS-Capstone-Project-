-- SmartPark DBMS viva query examples
-- 1. Count slots by lot and type
select l.name,s.vehicle_type,count(*) as total_slots
from public.parking_lots l join public.parking_slots s on s.lot_id=l.id
group by l.name,s.vehicle_type order by l.name,s.vehicle_type;

-- 2. Join booking, customer, vehicle, slot and lot
select b.id,p.full_name,v.registration_no,l.name,s.slot_code,b.start_time,b.end_time,b.status
from public.bookings b
join public.profiles p on p.id=b.user_id
join public.vehicles v on v.id=b.vehicle_id
join public.parking_slots s on s.id=b.slot_id
join public.parking_lots l on l.id=s.lot_id
order by b.created_at desc;

-- 3. Daily revenue
select date_trunc('day',paid_at)::date as paid_day,sum(amount) as revenue
from public.payments where status='paid' and paid_at is not null
group by date_trunc('day',paid_at)::date order by paid_day desc;

-- 4. Customers who have never booked
select p.id,p.full_name from public.profiles p
where p.role='customer' and not exists(select 1 from public.bookings b where b.user_id=p.id);

-- 5. Current occupancy by lot
select l.name,count(s.id) as active_slots,
count(s.id) filter(where exists(select 1 from public.parking_sessions ps
where ps.slot_id=s.id and ps.exit_time is null)) as occupied_slots
from public.parking_lots l left join public.parking_slots s on s.lot_id=l.id and s.is_active
group by l.id,l.name order by l.name;

-- 6. Index definitions for query-plan discussion
select tablename,indexname,indexdef from pg_indexes
where schemaname='public' and tablename in('bookings','parking_sessions','vehicles')
order by tablename,indexname;
