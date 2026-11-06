-- =============================================================================
-- CareRx Pharmacy — core schema
-- Patients submit drug requests and book chat consultations; pharmacists/admins
-- manage inventory (CMS), review requests and run consultations.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('patient', 'pharmacist', 'admin');

create type public.request_status as enum (
  'submitted',        -- patient sent it
  'reviewing',        -- pharmacist picked it up
  'quoted',           -- prices/availability set, waiting for patient to confirm
  'confirmed',        -- patient accepted the quote
  'ready',            -- packed, ready for pickup / dispatch
  'out_for_delivery',
  'completed',
  'cancelled',        -- by patient
  'rejected'          -- by pharmacist (e.g. invalid prescription)
);

create type public.fulfilment_type as enum ('pickup', 'delivery');

create type public.consult_status as enum ('booked', 'in_progress', 'completed', 'cancelled', 'no_show');

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  email       text,
  role        public.app_role not null default 'patient',
  created_at  timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- Role helpers. SECURITY DEFINER so they can read profiles without tripping RLS.
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('pharmacist', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Create a profile whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change roles. Statements without a JWT (SQL editor, service
-- role, migrations) are allowed so the first admin can be bootstrapped.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  if new.role is distinct from old.role and old.id = (select auth.uid()) then
    raise exception 'You cannot change your own role';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- Pharmacy settings (single row) + weekly consultation hours
-- ---------------------------------------------------------------------------
create table public.pharmacy_settings (
  id                    smallint primary key default 1 check (id = 1),
  slot_minutes          smallint not null default 20 check (slot_minutes between 10 and 120),
  booking_window_days   smallint not null default 14 check (booking_window_days between 1 and 60),
  delivery_fee          numeric(12, 2) not null default 1500 check (delivery_fee >= 0),
  timezone              text not null default 'Africa/Lagos',
  updated_at            timestamptz not null default now()
);

insert into public.pharmacy_settings (id) values (1);

create table public.consultation_hours (
  weekday     smallint primary key check (weekday between 0 and 6), -- 0 = Sunday
  is_open     boolean not null default true,
  start_time  time not null default '09:00',
  end_time    time not null default '17:00',
  check (end_time > start_time)
);

insert into public.consultation_hours (weekday, is_open, start_time, end_time) values
  (0, false, '12:00', '16:00'),
  (1, true,  '09:00', '17:00'),
  (2, true,  '09:00', '17:00'),
  (3, true,  '09:00', '17:00'),
  (4, true,  '09:00', '17:00'),
  (5, true,  '09:00', '17:00'),
  (6, true,  '10:00', '14:00');

-- ---------------------------------------------------------------------------
-- Inventory (CMS)
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.drugs (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  name                  text not null,
  generic_name          text,
  brand                 text,
  category_id           uuid references public.categories (id) on delete set null,
  dosage_form           text,          -- tablet, capsule, syrup, injection…
  strength              text,          -- 500mg, 5mg/5ml…
  pack_size             text,          -- 10 x 10 tablets
  price                 numeric(12, 2) not null default 0 check (price >= 0), -- NGN
  stock_qty             int not null default 0 check (stock_qty >= 0),
  low_stock_threshold   int not null default 10 check (low_stock_threshold >= 0),
  requires_prescription boolean not null default false,
  description           text,
  usage_notes           text,
  nafdac_no             text,
  image_url             text,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index drugs_category_idx on public.drugs (category_id);
create index drugs_active_idx on public.drugs (is_active);
create index drugs_name_trgm_idx on public.drugs using gin (name extensions.gin_trgm_ops);
create index drugs_generic_trgm_idx on public.drugs using gin (generic_name extensions.gin_trgm_ops);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger drugs_touch before update on public.drugs
  for each row execute function public.touch_updated_at();

create trigger settings_touch before update on public.pharmacy_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Drug requests (orders)
-- ---------------------------------------------------------------------------
create sequence public.request_ref_seq start 1001;

create table public.drug_requests (
  id                 uuid primary key default gen_random_uuid(),
  ref                text not null unique default ('RQ-' || nextval('public.request_ref_seq')::text),
  patient_id         uuid not null references public.profiles (id) on delete cascade,
  status             public.request_status not null default 'submitted',
  fulfilment         public.fulfilment_type not null default 'pickup',
  delivery_address   text,
  contact_phone      text not null,
  patient_note       text,
  prescription_path  text,
  pharmacist_note    text,
  delivery_fee       numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  reviewed_by        uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (fulfilment = 'pickup' or coalesce(length(trim(delivery_address)), 0) > 0)
);

create index drug_requests_patient_idx on public.drug_requests (patient_id, created_at desc);
create index drug_requests_status_idx on public.drug_requests (status, created_at desc);
create index drug_requests_reviewed_by_idx on public.drug_requests (reviewed_by);

create trigger drug_requests_touch before update on public.drug_requests
  for each row execute function public.touch_updated_at();

create table public.drug_request_items (
  id                 uuid primary key default gen_random_uuid(),
  request_id         uuid not null references public.drug_requests (id) on delete cascade,
  drug_id            uuid references public.drugs (id) on delete set null,
  name               text not null,                 -- snapshot, or free text for unlisted drugs
  quantity           int not null default 1 check (quantity between 1 and 999),
  unit_price         numeric(12, 2) check (unit_price >= 0), -- set by pharmacist when quoting
  is_available       boolean,                       -- null = not yet reviewed
  pharmacist_note    text,
  created_at         timestamptz not null default now()
);

create index drug_request_items_request_idx on public.drug_request_items (request_id);
create index drug_request_items_drug_idx on public.drug_request_items (drug_id);

-- Status timeline
create table public.request_events (
  id          bigint generated always as identity primary key,
  request_id  uuid not null references public.drug_requests (id) on delete cascade,
  status      public.request_status not null,
  note        text,
  actor_id    uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index request_events_request_idx on public.request_events (request_id, created_at);
create index request_events_actor_idx on public.request_events (actor_id);

create or replace function public.log_request_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.request_events (request_id, status, actor_id, note)
    values (
      new.id,
      new.status,
      (select auth.uid()),
      case when tg_op = 'UPDATE' and new.status in ('rejected', 'quoted') then new.pharmacist_note end
    );
  end if;
  return new;
end;
$$;

create trigger drug_requests_log_status
  after insert or update of status on public.drug_requests
  for each row execute function public.log_request_status();

-- Deduct stock once a request is completed.
create or replace function public.deduct_stock_on_complete()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.drugs d
       set stock_qty = greatest(d.stock_qty - i.qty, 0)
      from (
        select drug_id, sum(quantity)::int as qty
          from public.drug_request_items
         where request_id = new.id
           and drug_id is not null
           and coalesce(is_available, true)
         group by drug_id
      ) i
     where d.id = i.drug_id;
  end if;
  return new;
end;
$$;

create trigger drug_requests_deduct_stock
  after update of status on public.drug_requests
  for each row execute function public.deduct_stock_on_complete();

-- Patient-side actions on their own request (confirm quote / cancel).
create or replace function public.patient_request_action(p_request_id uuid, p_action text)
returns public.request_status
language plpgsql security definer set search_path = ''
as $$
declare
  v_status public.request_status;
begin
  select status into v_status
    from public.drug_requests
   where id = p_request_id and patient_id = (select auth.uid())
   for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if p_action = 'confirm' and v_status = 'quoted' then
    update public.drug_requests set status = 'confirmed' where id = p_request_id;
    return 'confirmed';
  elsif p_action = 'cancel' and v_status in ('submitted', 'reviewing', 'quoted') then
    update public.drug_requests set status = 'cancelled' where id = p_request_id;
    return 'cancelled';
  end if;

  raise exception 'This request can no longer be %', case when p_action = 'confirm' then 'confirmed' else 'cancelled' end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Consultations + chat
-- ---------------------------------------------------------------------------
create sequence public.consult_ref_seq start 501;

create table public.consultations (
  id             uuid primary key default gen_random_uuid(),
  ref            text not null unique default ('CN-' || nextval('public.consult_ref_seq')::text),
  patient_id     uuid not null references public.profiles (id) on delete cascade,
  pharmacist_id  uuid references public.profiles (id) on delete set null,
  scheduled_at   timestamptz not null,
  duration_min   smallint not null default 20,
  topic          text not null,
  details        text,
  status         public.consult_status not null default 'booked',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- One live consultation per slot (single-desk pharmacy for v1).
create unique index consultations_slot_unique
  on public.consultations (scheduled_at)
  where status in ('booked', 'in_progress');

create index consultations_patient_idx on public.consultations (patient_id, scheduled_at desc);
create index consultations_pharmacist_idx on public.consultations (pharmacist_id);
create index consultations_schedule_idx on public.consultations (scheduled_at);

create trigger consultations_touch before update on public.consultations
  for each row execute function public.touch_updated_at();

-- Taken slots in a range, without exposing who booked them.
create or replace function public.get_booked_slots(p_from timestamptz, p_to timestamptz)
returns setof timestamptz
language sql stable security definer set search_path = ''
as $$
  select scheduled_at
    from public.consultations
   where status in ('booked', 'in_progress')
     and scheduled_at >= p_from
     and scheduled_at < p_to;
$$;

create or replace function public.patient_cancel_consultation(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.consultations
     set status = 'cancelled'
   where id = p_id
     and patient_id = (select auth.uid())
     and status = 'booked';
  if not found then
    raise exception 'This consultation can no longer be cancelled';
  end if;
end;
$$;

-- Private pharmacist notes, never visible to patients.
create table public.consultation_notes (
  consultation_id  uuid primary key references public.consultations (id) on delete cascade,
  notes            text not null default '',
  updated_by       uuid references public.profiles (id) on delete set null,
  updated_at       timestamptz not null default now()
);

create index consultation_notes_updated_by_idx on public.consultation_notes (updated_by);

create table public.consultation_messages (
  id               bigint generated always as identity primary key,
  consultation_id  uuid not null references public.consultations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id) on delete cascade,
  body             text check (body is null or length(body) <= 4000),
  attachment_path  text,
  created_at       timestamptz not null default now(),
  check (coalesce(length(trim(body)), 0) > 0 or attachment_path is not null)
);

create index consultation_messages_consult_idx on public.consultation_messages (consultation_id, created_at);
create index consultation_messages_sender_idx on public.consultation_messages (sender_id);

create or replace function public.can_access_consultation(p_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_staff() or exists (
    select 1 from public.consultations
     where id = p_id and patient_id = (select auth.uid())
  );
$$;

-- A patient's first message moves nothing; a staff message starts the session.
create or replace function public.on_staff_message()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if public.is_staff() then
    update public.consultations
       set status = 'in_progress',
           pharmacist_id = coalesce(pharmacist_id, new.sender_id)
     where id = new.consultation_id and status = 'booked';
  end if;
  return new;
end;
$$;

create trigger consultation_messages_staff
  after insert on public.consultation_messages
  for each row execute function public.on_staff_message();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.pharmacy_settings     enable row level security;
alter table public.consultation_hours    enable row level security;
alter table public.categories            enable row level security;
alter table public.drugs                 enable row level security;
alter table public.drug_requests         enable row level security;
alter table public.drug_request_items    enable row level security;
alter table public.request_events        enable row level security;
alter table public.consultations         enable row level security;
alter table public.consultation_messages enable row level security;
alter table public.consultation_notes    enable row level security;

-- profiles
create policy "profiles: read own or staff" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles: admin updates any" on public.profiles
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- settings & hours: public read, staff write
create policy "settings: public read" on public.pharmacy_settings
  for select to anon, authenticated using (true);
create policy "settings: staff update" on public.pharmacy_settings
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "hours: public read" on public.consultation_hours
  for select to anon, authenticated using (true);
create policy "hours: staff update" on public.consultation_hours
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- categories
create policy "categories: public read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories: staff insert" on public.categories
  for insert to authenticated with check ((select public.is_staff()));
create policy "categories: staff update" on public.categories
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "categories: staff delete" on public.categories
  for delete to authenticated using ((select public.is_staff()));

-- drugs
create policy "drugs: public read active" on public.drugs
  for select to anon, authenticated
  using (is_active or (select public.is_staff()));
create policy "drugs: staff insert" on public.drugs
  for insert to authenticated with check ((select public.is_staff()));
create policy "drugs: staff update" on public.drugs
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "drugs: staff delete" on public.drugs
  for delete to authenticated using ((select public.is_staff()));

-- drug_requests
create policy "requests: read own or staff" on public.drug_requests
  for select to authenticated
  using (patient_id = (select auth.uid()) or (select public.is_staff()));
create policy "requests: patient creates own" on public.drug_requests
  for insert to authenticated
  with check (
    patient_id = (select auth.uid())
    and status = 'submitted'
    and pharmacist_note is null
    and reviewed_by is null
    and delivery_fee = 0
  );
create policy "requests: staff update" on public.drug_requests
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- drug_request_items
create policy "items: read via request" on public.drug_request_items
  for select to authenticated
  using (exists (
    select 1 from public.drug_requests r
     where r.id = request_id
       and (r.patient_id = (select auth.uid()) or (select public.is_staff()))
  ));
create policy "items: patient adds to new request" on public.drug_request_items
  for insert to authenticated
  with check (
    unit_price is null and is_available is null and pharmacist_note is null
    and exists (
      select 1 from public.drug_requests r
       where r.id = request_id
         and r.patient_id = (select auth.uid())
         and r.status = 'submitted'
    )
  );
create policy "items: staff update" on public.drug_request_items
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "items: staff delete" on public.drug_request_items
  for delete to authenticated using ((select public.is_staff()));
create policy "items: staff insert" on public.drug_request_items
  for insert to authenticated with check ((select public.is_staff()));

-- request_events (written by trigger only)
create policy "events: read via request" on public.request_events
  for select to authenticated
  using (exists (
    select 1 from public.drug_requests r
     where r.id = request_id
       and (r.patient_id = (select auth.uid()) or (select public.is_staff()))
  ));

-- consultations
create policy "consults: read own or staff" on public.consultations
  for select to authenticated
  using (patient_id = (select auth.uid()) or (select public.is_staff()));
create policy "consults: patient books" on public.consultations
  for insert to authenticated
  with check (
    patient_id = (select auth.uid())
    and status = 'booked'
    and pharmacist_id is null
    and scheduled_at > now()
  );
create policy "consults: staff update" on public.consultations
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- consultation_messages
create policy "messages: participants read" on public.consultation_messages
  for select to authenticated
  using ((select public.can_access_consultation(consultation_id)));
create policy "messages: participants send" on public.consultation_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select public.can_access_consultation(consultation_id))
    and exists (
      select 1 from public.consultations c
       where c.id = consultation_id and c.status in ('booked', 'in_progress')
    )
  );

-- consultation_notes (staff only)
create policy "notes: staff all" on public.consultation_notes
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
revoke execute on function public.log_request_status() from public, anon, authenticated;
revoke execute on function public.deduct_stock_on_complete() from public, anon, authenticated;
revoke execute on function public.on_staff_message() from public, anon, authenticated;
revoke execute on function public.patient_request_action(uuid, text) from public, anon;
revoke execute on function public.patient_cancel_consultation(uuid) from public, anon;
revoke execute on function public.get_booked_slots(timestamptz, timestamptz) from public, anon;
grant execute on function public.patient_request_action(uuid, text) to authenticated;
grant execute on function public.patient_cancel_consultation(uuid) to authenticated;
grant execute on function public.get_booked_slots(timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: live chat + live request status
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.consultation_messages;
alter publication supabase_realtime add table public.drug_requests;
alter publication supabase_realtime add table public.consultations;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('prescriptions', 'prescriptions', false, 10485760,
     array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
  ('chat-attachments', 'chat-attachments', false, 10485760,
     array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),
  ('drug-images', 'drug-images', true, 5242880,
     array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- prescriptions/<user_id>/<file>
create policy "rx: owner uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'prescriptions' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "rx: owner or staff reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'prescriptions'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_staff())));

-- chat-attachments/<consultation_id>/<file>
create policy "chat files: participants upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-attachments'
              and (select public.can_access_consultation(((storage.foldername(name))[1])::uuid)));
create policy "chat files: participants read" on storage.objects
  for select to authenticated
  using (bucket_id = 'chat-attachments'
         and (select public.can_access_consultation(((storage.foldername(name))[1])::uuid)));

-- drug-images: public bucket (served via public URL), staff manage
create policy "drug images: staff upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'drug-images' and (select public.is_staff()));
create policy "drug images: staff update" on storage.objects
  for update to authenticated
  using (bucket_id = 'drug-images' and (select public.is_staff()));
create policy "drug images: staff delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'drug-images' and (select public.is_staff()));
