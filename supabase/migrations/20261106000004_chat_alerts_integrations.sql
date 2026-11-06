-- =============================================================================
-- Chat presence, unread tracking, admin alerts, and owner-managed integrations
-- (email + WhatsApp reminders).
-- =============================================================================

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- Feature toggles (Admin → Settings)
-- ---------------------------------------------------------------------------
alter table public.pharmacy_settings
  add column presence_enabled      boolean not null default true,
  add column unread_badges_enabled boolean not null default true,
  add column alert_sound_enabled   boolean not null default true;

-- ---------------------------------------------------------------------------
-- Unread tracking (shared by the pharmacy team; separate table so marking a
-- chat as read doesn't fire realtime updates to the patient)
-- ---------------------------------------------------------------------------
create table public.consultation_staff_reads (
  consultation_id uuid primary key references public.consultations (id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  read_by         uuid references public.profiles (id) on delete set null
);
create index consultation_staff_reads_read_by_idx on public.consultation_staff_reads (read_by);
alter table public.consultation_staff_reads enable row level security;
create policy "reads: staff all" on public.consultation_staff_reads
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create or replace function public.admin_unread_counts()
returns table (consultation_id uuid, unread int)
language sql stable security definer set search_path = ''
as $$
  select m.consultation_id, count(*)::int
    from public.consultation_messages m
    join public.consultations c on c.id = m.consultation_id
    left join public.consultation_staff_reads r on r.consultation_id = m.consultation_id
   where public.is_staff()
     and m.sender_id = c.patient_id
     and m.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz)
   group by m.consultation_id;
$$;
revoke execute on function public.admin_unread_counts() from public, anon;
grant execute on function public.admin_unread_counts() to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime Authorization for private presence channels  "consult:<uuid>"
-- Only the patient of that consultation and staff may join / track.
-- ---------------------------------------------------------------------------
create or replace function public.consult_topic_allowed(p_topic text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
begin
  if p_topic !~ '^consult:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.can_access_consultation(substring(p_topic from 9)::uuid);
end;
$$;
grant execute on function public.consult_topic_allowed(text) to authenticated;

-- Join/read check (Realtime evaluates reads without the presence extension).
create policy "consult presence: participants receive" on realtime.messages
  for select to authenticated
  using ((select public.consult_topic_allowed(realtime.topic())));

create policy "consult presence: participants track" on realtime.messages
  for insert to authenticated
  with check (realtime.messages.extension = 'presence' and (select public.consult_topic_allowed(realtime.topic())));

-- ---------------------------------------------------------------------------
-- Integrations (owner connects their own accounts). Admin-only.
-- Non-secret config lives here; API keys/tokens live in Supabase Vault.
-- ---------------------------------------------------------------------------
create table public.integration_settings (
  id                        smallint primary key default 1 check (id = 1),
  site_url                  text,
  -- Email (Resend)
  email_from_address        text,
  email_from_name           text,
  -- WhatsApp (Meta WhatsApp Cloud API)
  whatsapp_phone_number_id  text,
  whatsapp_template_name    text default 'consultation_reminder',
  whatsapp_template_lang    text default 'en',
  -- Reminders
  reminders_enabled         boolean not null default false,
  reminder_offsets_min      int[] not null default '{1440,60}',
  notify_patient_email      boolean not null default true,
  notify_patient_whatsapp   boolean not null default false,
  notify_staff_email        boolean not null default true,
  notify_staff_whatsapp     boolean not null default false,
  staff_notify_email        text,
  staff_notify_whatsapp     text,
  last_run_at               timestamptz,
  updated_at                timestamptz not null default now(),
  updated_by                uuid references public.profiles (id) on delete set null
);
insert into public.integration_settings (id) values (1);
create index integration_settings_updated_by_idx on public.integration_settings (updated_by);

alter table public.integration_settings enable row level security;
create policy "integrations: admin read" on public.integration_settings
  for select to authenticated using ((select public.is_admin()));
create policy "integrations: admin update" on public.integration_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create trigger integration_settings_touch before update on public.integration_settings
  for each row execute function public.touch_updated_at();

-- Reminder log (dedupe + audit)
create table public.consultation_reminders (
  id               bigint generated always as identity primary key,
  consultation_id  uuid not null references public.consultations (id) on delete cascade,
  offset_min       int not null,
  channel          text not null check (channel in ('email', 'whatsapp')),
  audience         text not null check (audience in ('patient', 'staff')),
  recipient        text not null,
  status           text not null check (status in ('sent', 'failed')),
  error            text,
  created_at       timestamptz not null default now(),
  unique (consultation_id, offset_min, channel, audience)
);
create index consultation_reminders_created_idx on public.consultation_reminders (created_at desc);
alter table public.consultation_reminders enable row level security;
create policy "reminders: admin read" on public.consultation_reminders
  for select to authenticated using ((select public.is_admin()));

-- ---- Vault-backed secrets ---------------------------------------------------
-- Allowed secret names. Values are never returned to the browser.
create or replace function public._integration_secret_name(p_key text)
returns text
language sql immutable
as $$
  select case p_key
    when 'resend_api_key' then 'carerx_resend_api_key'
    when 'whatsapp_token' then 'carerx_whatsapp_token'
    when 'cron_secret'    then 'carerx_cron_secret'
  end;
$$;

create or replace function public._get_secret(p_key text)
returns text
language sql stable security definer set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = public._integration_secret_name(p_key) limit 1;
$$;
revoke execute on function public._get_secret(text) from public, anon, authenticated;

create or replace function public.admin_set_integration_secret(p_key text, p_value text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_name text := public._integration_secret_name(p_key);
  v_id uuid;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if v_name is null then raise exception 'UNKNOWN_SECRET'; end if;
  select id into v_id from vault.secrets where name = v_name;
  if p_value is null or length(trim(p_value)) = 0 then
    if v_id is not null then delete from vault.secrets where id = v_id; end if;
    return;
  end if;
  if v_id is null then
    perform vault.create_secret(trim(p_value), v_name, 'CareRx integration secret');
  else
    perform vault.update_secret(v_id, trim(p_value), v_name);
  end if;
end;
$$;
revoke execute on function public.admin_set_integration_secret(text, text) from public, anon;
grant execute on function public.admin_set_integration_secret(text, text) to authenticated;

-- Which secrets are configured (booleans only).
create or replace function public.admin_integration_status()
returns json
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return json_build_object(
    'resend_api_key', public._get_secret('resend_api_key') is not null,
    'whatsapp_token', public._get_secret('whatsapp_token') is not null,
    'cron_secret',    public._get_secret('cron_secret') is not null,
    'schedule_active', exists (select 1 from cron.job where jobname = 'carerx-reminders' and active)
  );
end;
$$;
revoke execute on function public.admin_integration_status() from public, anon;
grant execute on function public.admin_integration_status() to authenticated;

-- Server-side only (admin test sends). Returns decrypted keys to the server action.
create or replace function public.admin_get_integration_secrets()
returns json
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return json_build_object(
    'resend_api_key', public._get_secret('resend_api_key'),
    'whatsapp_token', public._get_secret('whatsapp_token'),
    'cron_secret',    public._get_secret('cron_secret')
  );
end;
$$;
revoke execute on function public.admin_get_integration_secrets() from public, anon;
grant execute on function public.admin_get_integration_secrets() to authenticated;

-- ---- Scheduler: pg_cron → pg_net → <site>/api/reminders/run ---------------
create or replace function public.run_reminders_http()
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  v_url text;
  v_secret text := public._get_secret('cron_secret');
begin
  select site_url into v_url from public.integration_settings where id = 1;
  if v_url is null or v_secret is null then return null; end if;
  return net.http_post(
    url := rtrim(v_url, '/') || '/api/reminders/run',
    headers := jsonb_build_object('content-type', 'application/json', 'x-cron-secret', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  );
end;
$$;
revoke execute on function public.run_reminders_http() from public, anon, authenticated;

create or replace function public.admin_set_reminder_schedule(p_enabled boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if exists (select 1 from cron.job where jobname = 'carerx-reminders') then
    perform cron.unschedule('carerx-reminders');
  end if;
  if p_enabled then
    if public._get_secret('cron_secret') is null then
      perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'carerx_cron_secret', 'CareRx reminder scheduler');
    end if;
    perform cron.schedule('carerx-reminders', '*/5 * * * *', 'select public.run_reminders_http()');
  end if;
  update public.integration_settings set reminders_enabled = p_enabled where id = 1;
end;
$$;
revoke execute on function public.admin_set_reminder_schedule(boolean) from public, anon;
grant execute on function public.admin_set_reminder_schedule(boolean) to authenticated;

-- Admin "Run now": returns the same payload the scheduler uses.
create or replace function public.admin_trigger_reminders()
returns bigint
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  return public.run_reminders_http();
end;
$$;
revoke execute on function public.admin_trigger_reminders() from public, anon;
grant execute on function public.admin_trigger_reminders() to authenticated;

-- ---- Reminder worker RPCs (authenticated by the cron secret) ---------------
create or replace function public.reminders_due(p_secret text)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  v_cfg public.integration_settings;
  v_secret text := public._get_secret('cron_secret');
  v_tz text;
  v_items json;
begin
  if v_secret is null or p_secret is null or p_secret <> v_secret then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_cfg from public.integration_settings where id = 1;
  select timezone into v_tz from public.pharmacy_settings where id = 1;
  update public.integration_settings set last_run_at = now() where id = 1;
  if not v_cfg.reminders_enabled then
    return json_build_object('enabled', false);
  end if;

  with due as (
    select c.id, c.ref, c.topic, c.scheduled_at, c.duration_min, o.offset_min,
           p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone,
           ph.full_name as pharmacist_name
      from public.consultations c
      join public.profiles p on p.id = c.patient_id
      left join public.profiles ph on ph.id = c.pharmacist_id
      cross join lateral unnest(v_cfg.reminder_offsets_min) as o(offset_min)
     where c.status = 'booked'
       and c.scheduled_at > now()
       and now() >= c.scheduled_at - make_interval(mins => o.offset_min)
       and c.created_at <= c.scheduled_at - make_interval(mins => o.offset_min)
  ), jobs as (
    select d.*, ch.channel, ch.audience, ch.recipient
      from due d
      cross join lateral (values
        ('email',    'patient', case when v_cfg.notify_patient_email    then d.patient_email end),
        ('whatsapp', 'patient', case when v_cfg.notify_patient_whatsapp then d.patient_phone end),
        ('email',    'staff',   case when v_cfg.notify_staff_email      then v_cfg.staff_notify_email end),
        ('whatsapp', 'staff',   case when v_cfg.notify_staff_whatsapp   then v_cfg.staff_notify_whatsapp end)
      ) as ch(channel, audience, recipient)
     where ch.recipient is not null and length(trim(ch.recipient)) > 0
       -- skip if this or a closer reminder was already sent (no late "24h" after the "1h")
       and not exists (
         select 1 from public.consultation_reminders r
          where r.consultation_id = d.id and r.offset_min <= d.offset_min
            and r.channel = ch.channel and r.audience = ch.audience)
  ), next_jobs as (
    -- only the most imminent due reminder per consultation/channel/audience
    select distinct on (id, channel, audience) *
      from jobs
     order by id, channel, audience, offset_min asc
  )
  select coalesce(json_agg(json_build_object(
           'consultation_id', id, 'ref', ref, 'topic', topic, 'scheduled_at', scheduled_at,
           'duration_min', duration_min, 'offset_min', offset_min,
           'patient_name', patient_name, 'pharmacist_name', pharmacist_name,
           'channel', channel, 'audience', audience, 'recipient', recipient)), '[]'::json)
    into v_items
    from (select * from next_jobs limit 200) j;

  return json_build_object(
    'enabled', true,
    'timezone', v_tz,
    'site_url', v_cfg.site_url,
    'email', json_build_object('api_key', public._get_secret('resend_api_key'),
                               'from_address', v_cfg.email_from_address, 'from_name', v_cfg.email_from_name),
    'whatsapp', json_build_object('token', public._get_secret('whatsapp_token'),
                                  'phone_number_id', v_cfg.whatsapp_phone_number_id,
                                  'template_name', v_cfg.whatsapp_template_name,
                                  'template_lang', v_cfg.whatsapp_template_lang),
    'items', v_items
  );
end;
$$;
revoke execute on function public.reminders_due(text) from public;
grant execute on function public.reminders_due(text) to anon, authenticated;

create or replace function public.reminders_record(p_secret text, p_results jsonb)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_secret text := public._get_secret('cron_secret');
  v_count int;
begin
  if v_secret is null or p_secret is null or p_secret <> v_secret then
    raise exception 'FORBIDDEN';
  end if;
  insert into public.consultation_reminders (consultation_id, offset_min, channel, audience, recipient, status, error)
  select (r ->> 'consultation_id')::uuid, (r ->> 'offset_min')::int, r ->> 'channel', r ->> 'audience',
         left(r ->> 'recipient', 200), r ->> 'status', left(r ->> 'error', 500)
    from jsonb_array_elements(p_results) r
  on conflict (consultation_id, offset_min, channel, audience) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke execute on function public.reminders_record(text, jsonb) from public;
grant execute on function public.reminders_record(text, jsonb) to anon, authenticated;
