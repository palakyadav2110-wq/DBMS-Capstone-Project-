-- SmartPark initial schema: nine normalized tables + secure booking workflows.
-- Apply to a NEW Supabase project through SQL Editor.
create extension if not exists btree_gist with schema extensions;

do $$ begin create type public.app_role as enum ('customer','staff','admin');
exception when duplicate_object then null; end $$;
do $$ begin create type public.booking_status as enum ('confirmed','cancelled','checked_in','completed');
exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_method as enum ('cash','upi','card','other');
exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('pending','paid','failed','refunded');
exception when duplicate_object then null; end $$;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '',
 role public.app_role not null default 'customer',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint profiles_full_name_length check (char_length(full_name)<=120)
);
create table public.vehicles (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 registration_no text not null unique,
 vehicle_type text not null check(vehicle_type in ('car','motorcycle','suv','ev','other')),
 make text, model text, created_at timestamptz not null default now(),
 constraint vehicles_registration_format check(registration_no=upper(registration_no) and char_length(registration_no) between 4 and 20)
);
create table public.parking_lots (
 id uuid primary key default gen_random_uuid(), name text not null, address text not null,
 timezone text not null default 'Asia/Kolkata', is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint parking_lots_name_length check(char_length(name) between 2 and 120)
);
create table public.parking_slots (
 id uuid primary key default gen_random_uuid(),
 lot_id uuid not null references public.parking_lots(id) on delete restrict,
 slot_code text not null, vehicle_type text not null default 'any'
 check(vehicle_type in ('car','motorcycle','suv','ev','other','any')),
 is_active boolean not null default true, created_at timestamptz not null default now(),
 unique(lot_id,slot_code)
);
create table public.pricing_rules (
 id uuid primary key default gen_random_uuid(),
 lot_id uuid not null references public.parking_lots(id) on delete cascade,
 vehicle_type text not null check(vehicle_type in ('car','motorcycle','suv','ev','other','any')),
 hourly_rate numeric(10,2) not null check(hourly_rate>=0),
 effective_from timestamptz not null default now(), effective_to timestamptz,
 created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(),
 constraint pricing_dates_valid check(effective_to is null or effective_to>effective_from)
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete restrict,
 vehicle_id uuid not null references public.vehicles(id) on delete restrict,
 slot_id uuid not null references public.parking_slots(id) on delete restrict,
 start_time timestamptz not null, end_time timestamptz not null,
 status public.booking_status not null default 'confirmed',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint booking_time_valid check(end_time>start_time),
 constraint booking_duration_max check(end_time<=start_time+interval '24 hours'),
 constraint bookings_no_overlapping_active_slot exclude using gist
 (slot_id with =, tstzrange(start_time,end_time,'[)') with &&)
 where(status in ('confirmed','checked_in'))
);
create table public.parking_sessions (
 id uuid primary key default gen_random_uuid(), booking_id uuid unique references public.bookings(id) on delete restrict,
 vehicle_id uuid not null references public.vehicles(id) on delete restrict,
 slot_id uuid not null references public.parking_slots(id) on delete restrict,
 entry_time timestamptz not null default now(), exit_time timestamptz,
 rate_per_hour_snapshot numeric(10,2) not null check(rate_per_hour_snapshot>=0),
 final_charge numeric(10,2) check(final_charge is null or final_charge>=0),
 created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(),
 constraint session_exit_after_entry check(exit_time is null or exit_time>entry_time)
);
create table public.payments (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.parking_sessions(id) on delete restrict,
 amount numeric(10,2) not null check(amount>=0), method public.payment_method not null default 'other',
 status public.payment_status not null default 'pending',
 recorded_by uuid references public.profiles(id) on delete set null, paid_at timestamptz,
 created_at timestamptz not null default now(),
 constraint payment_paid_at_consistency check((status='paid' and paid_at is not null) or status<>'paid')
);
create table public.audit_logs (
 id bigint generated always as identity primary key,
 actor_id uuid references public.profiles(id) on delete set null, action text not null,
 entity_type text not null, entity_id uuid, details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create index vehicles_owner_id_idx on public.vehicles(owner_id);
create index bookings_user_created_idx on public.bookings(user_id,created_at desc);
create index bookings_slot_time_idx on public.bookings(slot_id,start_time,end_time);
create index sessions_vehicle_entry_idx on public.parking_sessions(vehicle_id,entry_time desc);
create index payments_session_created_idx on public.payments(session_id,created_at desc);
create index pricing_rules_lookup_idx on public.pricing_rules(lot_id,vehicle_type,effective_from desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type,entity_id,created_at desc);
create unique index one_active_session_per_slot_idx on public.parking_sessions(slot_id) where exit_time is null;
create unique index one_active_session_per_vehicle_idx on public.parking_sessions(vehicle_id) where exit_time is null;

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at:=now(); return new; end; $$;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger parking_lots_set_updated_at before update on public.parking_lots for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,full_name,role)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),'customer')
 on conflict(id) do nothing;
 return new;
end; $$;
revoke all on function public.handle_new_auth_user() from public,anon,authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

create or replace function public.current_app_role() returns public.app_role
language sql stable security definer set search_path='' as $$
 select p.role from public.profiles p where p.id=(select auth.uid())
$$;
revoke all on function public.current_app_role() from public,anon;
grant execute on function public.current_app_role() to authenticated;

create or replace function public.create_booking(p_slot_id uuid,p_vehicle_id uuid,p_start_time timestamptz,p_end_time timestamptz)
returns public.bookings language plpgsql security definer set search_path='' as $$
declare
 v_user_id uuid:=auth.uid(); v_slot public.parking_slots%rowtype; v_vehicle public.vehicles%rowtype;
 v_booking public.bookings%rowtype; v_lot_active boolean;
begin
 if v_user_id is null then raise exception 'Sign in to make a booking.' using errcode='28000'; end if;
 if p_start_time is null or p_end_time is null or p_start_time<now()-interval '1 minute'
 or p_end_time<=p_start_time or p_end_time>p_start_time+interval '24 hours'
 then raise exception 'Choose a valid time range up to 24 hours.'; end if;
 select s.* into v_slot from public.parking_slots s where s.id=p_slot_id and s.is_active for update;
 if not found then raise exception 'This parking slot is unavailable.'; end if;
 select l.is_active into v_lot_active from public.parking_lots l where l.id=v_slot.lot_id;
 if coalesce(v_lot_active,false)=false then raise exception 'Parking location inactive.'; end if;
 select v.* into v_vehicle from public.vehicles v where v.id=p_vehicle_id and v.owner_id=v_user_id;
 if not found then raise exception 'Choose a vehicle registered to your account.'; end if;
 if v_slot.vehicle_type<>'any' and v_slot.vehicle_type<>v_vehicle.vehicle_type then raise exception 'Slot does not support this vehicle type.'; end if;
 if not exists(select 1 from public.pricing_rules pr where pr.lot_id=v_slot.lot_id
 and pr.vehicle_type in(v_vehicle.vehicle_type,'any') and pr.effective_from<=p_start_time
 and (pr.effective_to is null or pr.effective_to>p_start_time))
 then raise exception 'No pricing rule configured for this slot and time.'; end if;
 if exists(select 1 from public.bookings b where b.slot_id=p_slot_id and b.status in('confirmed','checked_in')
 and b.start_time<p_end_time and b.end_time>p_start_time) then raise exception 'Slot already reserved for part of that time.'; end if;
 if exists(select 1 from public.parking_sessions ps where ps.slot_id=p_slot_id and ps.exit_time is null)
 then raise exception 'A vehicle is currently parked in this slot.'; end if;
 insert into public.bookings(user_id,vehicle_id,slot_id,start_time,end_time,status)
 values(v_user_id,p_vehicle_id,p_slot_id,p_start_time,p_end_time,'confirmed') returning * into v_booking;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
 values(v_user_id,'booking_created','booking',v_booking.id,jsonb_build_object('slot_id',p_slot_id,'start_time',p_start_time,'end_time',p_end_time));
 return v_booking;
end; $$;

create or replace function public.cancel_booking(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path='' as $$
declare v_user_id uuid:=auth.uid(); v_booking public.bookings%rowtype;
begin
 if v_user_id is null then raise exception 'Sign in.' using errcode='28000'; end if;
 select b.* into v_booking from public.bookings b where b.id=p_booking_id and b.user_id=v_user_id for update;
 if not found then raise exception 'Booking not found.'; end if;
 if v_booking.status<>'confirmed' or v_booking.start_time<=now() then raise exception 'Only future confirmed bookings can be cancelled.'; end if;
 update public.bookings set status='cancelled' where id=p_booking_id returning * into v_booking;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(v_user_id,'booking_cancelled','booking',p_booking_id);
 return v_booking;
end; $$;

create or replace function public.check_in_booking(p_booking_id uuid) returns public.parking_sessions
language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_booking public.bookings%rowtype; v_slot public.parking_slots%rowtype;
 v_vehicle public.vehicles%rowtype; v_rate numeric(10,2); v_session public.parking_sessions%rowtype;
begin
 if v_actor is null or coalesce(public.current_app_role()::text,'') not in('staff','admin') then raise exception 'Only staff can check in vehicles.' using errcode='42501'; end if;
 select b.* into v_booking from public.bookings b where b.id=p_booking_id for update;
 if not found or v_booking.status<>'confirmed' then raise exception 'Confirmed booking required.'; end if;
 if now()<v_booking.start_time-interval '30 minutes' or now()>=v_booking.end_time then raise exception 'Check-in window is 30 minutes before start until end time.'; end if;
 select s.* into v_slot from public.parking_slots s where s.id=v_booking.slot_id and s.is_active for update;
 if not found then raise exception 'Reserved slot is inactive.'; end if;
 select v.* into v_vehicle from public.vehicles v where v.id=v_booking.vehicle_id;
 if exists(select 1 from public.parking_sessions ps where ps.slot_id=v_booking.slot_id and ps.exit_time is null) then raise exception 'Slot already has an active session.'; end if;
 select pr.hourly_rate into v_rate from public.pricing_rules pr where pr.lot_id=v_slot.lot_id
 and pr.vehicle_type in(v_vehicle.vehicle_type,'any') and pr.effective_from<=now()
 and (pr.effective_to is null or pr.effective_to>now())
 order by(pr.vehicle_type=v_vehicle.vehicle_type) desc,pr.effective_from desc limit 1;
 if v_rate is null then raise exception 'No current pricing rule.'; end if;
 insert into public.parking_sessions(booking_id,vehicle_id,slot_id,entry_time,rate_per_hour_snapshot,created_by)
 values(v_booking.id,v_booking.vehicle_id,v_booking.slot_id,now(),v_rate,v_actor) returning * into v_session;
 update public.bookings set status='checked_in' where id=v_booking.id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
 values(v_actor,'vehicle_checked_in','parking_session',v_session.id,jsonb_build_object('booking_id',v_booking.id,'slot_id',v_booking.slot_id));
 return v_session;
end; $$;

create or replace function public.check_out_session(p_session_id uuid,p_payment_method public.payment_method default 'other',p_mark_paid boolean default false)
returns public.parking_sessions language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_session public.parking_sessions%rowtype; v_hours integer; v_charge numeric(10,2);
begin
 if v_actor is null or coalesce(public.current_app_role()::text,'') not in('staff','admin') then raise exception 'Only staff can check out vehicles.' using errcode='42501'; end if;
 select ps.* into v_session from public.parking_sessions ps where ps.id=p_session_id for update;
 if not found or v_session.exit_time is not null then raise exception 'Active session required.'; end if;
 v_hours:=greatest(1,ceil(extract(epoch from(clock_timestamp()-v_session.entry_time))/3600.0)::integer);
 v_charge:=round(v_session.rate_per_hour_snapshot*v_hours,2);
 update public.parking_sessions set exit_time=now(),final_charge=v_charge where id=p_session_id returning * into v_session;
 if v_session.booking_id is not null then update public.bookings set status='completed' where id=v_session.booking_id; end if;
 insert into public.payments(session_id,amount,method,status,recorded_by,paid_at)
 values(v_session.id,v_charge,coalesce(p_payment_method,'other'),
 case when p_mark_paid then 'paid'::public.payment_status else 'pending'::public.payment_status end,v_actor,
 case when p_mark_paid then now() else null end);
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
 values(v_actor,'vehicle_checked_out','parking_session',v_session.id,jsonb_build_object('hours_charged',v_hours,'final_charge',v_charge,'paid',p_mark_paid));
 return v_session;
end; $$;

revoke all on function public.create_booking(uuid,uuid,timestamptz,timestamptz) from public,anon;
revoke all on function public.cancel_booking(uuid) from public,anon;
revoke all on function public.check_in_booking(uuid) from public,anon;
revoke all on function public.check_out_session(uuid,public.payment_method,boolean) from public,anon;
grant execute on function public.create_booking(uuid,uuid,timestamptz,timestamptz) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.check_in_booking(uuid) to authenticated;
grant execute on function public.check_out_session(uuid,public.payment_method,boolean) to authenticated;

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.parking_lots enable row level security;
alter table public.parking_slots enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.bookings enable row level security;
alter table public.parking_sessions enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select_self_or_admin on public.profiles for select to authenticated
using(id=(select auth.uid()) or (select public.current_app_role())='admin');
create policy profiles_update_self on public.profiles for update to authenticated
using(id=(select auth.uid())) with check(id=(select auth.uid()));
grant select on public.profiles to authenticated;
grant update(full_name) on public.profiles to authenticated;

create policy vehicles_select_owner_or_staff on public.vehicles for select to authenticated
using(owner_id=(select auth.uid()) or (select public.current_app_role()) in('staff','admin'));
create policy vehicles_insert_owner on public.vehicles for insert to authenticated with check(owner_id=(select auth.uid()));
create policy vehicles_update_owner on public.vehicles for update to authenticated
using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy vehicles_delete_owner on public.vehicles for delete to authenticated using(owner_id=(select auth.uid()));
grant select,insert,update,delete on public.vehicles to authenticated;

create policy parking_lots_public_read_active on public.parking_lots for select to anon,authenticated using(is_active=true);
create policy parking_lots_admin_all on public.parking_lots for all to authenticated
using((select public.current_app_role())='admin') with check((select public.current_app_role())='admin');
grant select on public.parking_lots to anon,authenticated;
grant insert,update,delete on public.parking_lots to authenticated;

create policy parking_slots_public_read_active on public.parking_slots for select to anon,authenticated
using(is_active=true and exists(select 1 from public.parking_lots l where l.id=lot_id and l.is_active=true));
create policy parking_slots_admin_all on public.parking_slots for all to authenticated
using((select public.current_app_role())='admin') with check((select public.current_app_role())='admin');
grant select on public.parking_slots to anon,authenticated;
grant insert,update,delete on public.parking_slots to authenticated;

create policy pricing_rules_public_read_current on public.pricing_rules for select to anon,authenticated
using(effective_from<=now() and (effective_to is null or effective_to>now())
and exists(select 1 from public.parking_lots l where l.id=lot_id and l.is_active=true));
create policy pricing_rules_admin_all on public.pricing_rules for all to authenticated
using((select public.current_app_role())='admin') with check((select public.current_app_role())='admin');
grant select on public.pricing_rules to anon,authenticated;
grant insert,update,delete on public.pricing_rules to authenticated;

create policy bookings_select_owner_or_staff on public.bookings for select to authenticated
using(user_id=(select auth.uid()) or (select public.current_app_role()) in('staff','admin'));
grant select on public.bookings to authenticated;
revoke insert,update,delete on public.bookings from anon,authenticated;

create policy sessions_select_owner_or_staff on public.parking_sessions for select to authenticated
using(exists(select 1 from public.vehicles v where v.id=vehicle_id and v.owner_id=(select auth.uid()))
or (select public.current_app_role()) in('staff','admin'));
grant select on public.parking_sessions to authenticated;
revoke insert,update,delete on public.parking_sessions from anon,authenticated;

create policy payments_select_owner_or_staff on public.payments for select to authenticated
using(exists(select 1 from public.parking_sessions ps join public.vehicles v on v.id=ps.vehicle_id
where ps.id=session_id and v.owner_id=(select auth.uid())) or (select public.current_app_role()) in('staff','admin'));
grant select on public.payments to authenticated;
revoke insert,update,delete on public.payments from anon,authenticated;

create policy audit_logs_staff_read on public.audit_logs for select to authenticated
using((select public.current_app_role()) in('staff','admin'));
grant select on public.audit_logs to authenticated;
revoke insert,update,delete on public.audit_logs from anon,authenticated;

revoke all on public.profiles from anon;
revoke all on public.bookings from anon;
revoke all on public.parking_sessions from anon;
revoke all on public.payments from anon;
revoke all on public.audit_logs from anon;
