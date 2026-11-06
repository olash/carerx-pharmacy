-- =============================================================================
-- Admin helpers
-- =============================================================================

-- Inventory with a computed stock status. security_invoker => RLS of `drugs` applies.
create or replace view public.inventory_view
with (security_invoker = true) as
select
  d.*,
  c.name as category_name,
  case
    when d.stock_qty <= 0 then 'out_of_stock'
    when d.stock_qty <= d.low_stock_threshold then 'low_stock'
    else 'in_stock'
  end as stock_status
from public.drugs d
left join public.categories c on c.id = d.category_id;

grant select on public.inventory_view to authenticated;
revoke select on public.inventory_view from anon;

-- Dashboard counters in one round-trip. Staff only.
create or replace function public.admin_dashboard_stats()
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_tz text;
  v_result json;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  select timezone into v_tz from public.pharmacy_settings where id = 1;

  select json_build_object(
    'needs_review',   (select count(*) from public.drug_requests where status in ('submitted', 'reviewing')),
    'awaiting_patient', (select count(*) from public.drug_requests where status = 'quoted'),
    'to_fulfil',      (select count(*) from public.drug_requests where status in ('confirmed', 'ready', 'out_for_delivery')),
    'completed_7d',   (select count(*) from public.drug_requests where status = 'completed' and updated_at > now() - interval '7 days'),
    'consults_today', (select count(*) from public.consultations
                        where status in ('booked', 'in_progress', 'completed')
                          and (scheduled_at at time zone v_tz)::date = (now() at time zone v_tz)::date),
    'consults_upcoming', (select count(*) from public.consultations where status = 'booked' and scheduled_at > now()),
    'low_stock',      (select count(*) from public.drugs where is_active and stock_qty > 0 and stock_qty <= low_stock_threshold),
    'out_of_stock',   (select count(*) from public.drugs where is_active and stock_qty <= 0),
    'active_products', (select count(*) from public.drugs where is_active)
  ) into v_result;
  return v_result;
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
