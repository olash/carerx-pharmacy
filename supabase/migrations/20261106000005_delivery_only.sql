-- =============================================================================
-- CareRx is an online-only, delivery-only pharmacy: no in-store pickup.
-- =============================================================================

alter table public.drug_requests alter column fulfilment set default 'delivery';

-- New requests must be deliveries with an address.
create or replace function public.enforce_delivery_only()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.fulfilment <> 'delivery' then
    raise exception 'DELIVERY_ONLY';
  end if;
  return new;
end;
$$;

drop trigger if exists drug_requests_delivery_only on public.drug_requests;
create trigger drug_requests_delivery_only
  before insert on public.drug_requests
  for each row execute function public.enforce_delivery_only();

revoke execute on function public.enforce_delivery_only() from public, anon, authenticated;
