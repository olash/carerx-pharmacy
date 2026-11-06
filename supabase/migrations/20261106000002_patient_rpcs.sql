-- =============================================================================
-- Patient-facing RPCs: atomic, validated in the database.
-- =============================================================================

-- Submit a drug request with its items in one transaction.
-- p_items: [{ "drug_id": uuid|null, "name": text|null, "quantity": int }]
create or replace function public.submit_drug_request(
  p_fulfilment        public.fulfilment_type,
  p_delivery_address  text,
  p_contact_phone     text,
  p_patient_note      text,
  p_prescription_path text,
  p_items             jsonb
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid        uuid := (select auth.uid());
  v_request_id uuid;
  v_item       jsonb;
  v_drug       public.drugs;
  v_qty        int;
  v_name       text;
  v_needs_rx   boolean := false;
  v_fee        numeric(12, 2) := 0;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_REQUEST';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'TOO_MANY_ITEMS';
  end if;
  if coalesce(length(trim(p_contact_phone)), 0) < 7 then
    raise exception 'PHONE_REQUIRED';
  end if;
  if p_fulfilment = 'delivery' and coalesce(length(trim(p_delivery_address)), 0) < 8 then
    raise exception 'ADDRESS_REQUIRED';
  end if;
  if p_prescription_path is not null and split_part(p_prescription_path, '/', 1) <> v_uid::text then
    raise exception 'INVALID_PRESCRIPTION_PATH';
  end if;

  if p_fulfilment = 'delivery' then
    select delivery_fee into v_fee from public.pharmacy_settings where id = 1;
  end if;

  insert into public.drug_requests
    (patient_id, fulfilment, delivery_address, contact_phone, patient_note, prescription_path, delivery_fee)
  values (
    v_uid,
    p_fulfilment,
    case when p_fulfilment = 'delivery' then left(trim(p_delivery_address), 500) end,
    left(trim(p_contact_phone), 32),
    nullif(left(trim(coalesce(p_patient_note, '')), 2000), ''),
    p_prescription_path,
    coalesce(v_fee, 0)
  )
  returning id into v_request_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'quantity')::int, 1);
    if v_qty < 1 or v_qty > 99 then
      raise exception 'INVALID_QUANTITY';
    end if;

    if nullif(v_item ->> 'drug_id', '') is not null then
      select * into v_drug from public.drugs
       where id = (v_item ->> 'drug_id')::uuid and is_active;
      if not found then
        raise exception 'DRUG_NOT_FOUND';
      end if;
      v_needs_rx := v_needs_rx or v_drug.requires_prescription;
      v_name := case
        when v_drug.strength is null or position(lower(v_drug.strength) in lower(v_drug.name)) > 0 then v_drug.name
        else v_drug.name || ' · ' || v_drug.strength
      end;
      insert into public.drug_request_items (request_id, drug_id, name, quantity)
      values (v_request_id, v_drug.id, v_name, v_qty);
    else
      v_name := left(trim(coalesce(v_item ->> 'name', '')), 120);
      if v_name = '' then
        raise exception 'ITEM_NAME_REQUIRED';
      end if;
      insert into public.drug_request_items (request_id, drug_id, name, quantity)
      values (v_request_id, null, v_name, v_qty);
    end if;
  end loop;

  if v_needs_rx and p_prescription_path is null then
    raise exception 'PRESCRIPTION_REQUIRED';
  end if;

  return v_request_id;
end;
$$;

revoke execute on function public.submit_drug_request(public.fulfilment_type, text, text, text, text, jsonb) from public, anon;
grant execute on function public.submit_drug_request(public.fulfilment_type, text, text, text, text, jsonb) to authenticated;

-- Book a consultation slot after validating it against opening hours.
create or replace function public.book_consultation(p_scheduled_at timestamptz, p_topic text, p_details text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_settings public.pharmacy_settings;
  v_hours    public.consultation_hours;
  v_local    timestamp;
  v_id       uuid;
  v_active   int;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if coalesce(length(trim(p_topic)), 0) = 0 then
    raise exception 'TOPIC_REQUIRED';
  end if;

  select * into v_settings from public.pharmacy_settings where id = 1;
  v_local := p_scheduled_at at time zone v_settings.timezone;

  select * into v_hours from public.consultation_hours where weekday = extract(dow from v_local)::smallint;

  if not found or not v_hours.is_open
     or v_local::time < v_hours.start_time
     or v_local::time + make_interval(mins => v_settings.slot_minutes) > v_hours.end_time
     or (extract(epoch from (v_local::time - v_hours.start_time))::int % (v_settings.slot_minutes * 60)) <> 0
     or extract(second from v_local) <> 0 then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  if p_scheduled_at <= now() + interval '10 minutes'
     or p_scheduled_at > now() + make_interval(days => v_settings.booking_window_days) then
    raise exception 'SLOT_UNAVAILABLE';
  end if;

  -- Fair use: max 3 upcoming bookings per patient.
  select count(*) into v_active from public.consultations
   where patient_id = v_uid and status = 'booked' and scheduled_at > now();
  if v_active >= 3 then
    raise exception 'TOO_MANY_BOOKINGS';
  end if;

  begin
    insert into public.consultations (patient_id, scheduled_at, duration_min, topic, details)
    values (v_uid, p_scheduled_at, v_settings.slot_minutes, left(trim(p_topic), 120),
            nullif(left(trim(coalesce(p_details, '')), 2000), ''))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'SLOT_TAKEN';
  end;

  return v_id;
end;
$$;

revoke execute on function public.book_consultation(timestamptz, text, text) from public, anon;
grant execute on function public.book_consultation(timestamptz, text, text) to authenticated;

-- Visitors can see which slots are taken (times only) before logging in.
grant execute on function public.get_booked_slots(timestamptz, timestamptz) to anon;

-- Names of pharmacy staff, so patients can see who they're chatting with.
create or replace function public.staff_directory()
returns table (id uuid, full_name text, role public.app_role)
language sql stable security definer set search_path = ''
as $$
  select p.id, coalesce(p.full_name, 'Pharmacist'), p.role
    from public.profiles p
   where p.role in ('pharmacist', 'admin');
$$;

revoke execute on function public.staff_directory() from public, anon;
grant execute on function public.staff_directory() to authenticated;
