alter table public.payment_orders
  add column provider_reference_no text,
  add column provider_external_id text,
  add column provider_qr_content text,
  add column provider_qr_url text;

alter table public.payment_orders
  drop constraint payment_orders_provider_check;

alter table public.payment_orders
  add constraint payment_orders_provider_check check (
    provider in ('manual', 'midtrans', 'dana')
  ),
  add constraint payment_orders_dana_paid_shape check (
    provider <> 'dana'
    or status <> 'paid'
    or provider_reference_no is not null
  );

create unique index payment_orders_dana_reference_idx
  on public.payment_orders (provider_reference_no)
  where provider = 'dana' and provider_reference_no is not null;

create index payment_orders_dana_pending_idx
  on public.payment_orders (expires_at asc)
  where provider = 'dana' and status = 'pending_payment';

create or replace function public.finalize_dana_payment_order(
  p_order_id text,
  p_dana_reference_no text,
  p_dana_external_id text,
  p_gross_amount integer,
  p_paid_at timestamptz default now()
)
returns public.user_entitlements
language plpgsql
security definer
set search_path = ''
as $$
declare
  payment_order public.payment_orders;
  entitlement public.user_entitlements;
begin
  select *
  into payment_order
  from public.payment_orders
  where order_id = p_order_id
  for update;

  if payment_order.order_id is null then
    raise exception 'Payment order not found.';
  end if;

  if payment_order.provider <> 'dana' then
    raise exception 'Payment order does not belong to DANA.';
  end if;

  if p_gross_amount <> payment_order.amount then
    raise exception 'DANA payment amount does not match the order.';
  end if;

  if nullif(trim(p_dana_reference_no), '') is null then
    raise exception 'DANA reference number is required.';
  end if;

  if payment_order.provider_reference_no is not null
     and payment_order.provider_reference_no <> p_dana_reference_no then
    raise exception 'DANA reference number does not match the order.';
  end if;

  select *
  into entitlement
  from public.user_entitlements
  where source_order_id = p_order_id;

  if entitlement.id is not null then
    return entitlement;
  end if;

  if payment_order.status not in ('pending', 'pending_payment') then
    raise exception 'Payment order cannot be finalized from its current status.';
  end if;

  update public.payment_orders
  set provider_reference_no = p_dana_reference_no,
      provider_external_id = nullif(trim(p_dana_external_id), ''),
      updated_at = now()
  where order_id = p_order_id;

  select *
  into entitlement
  from public.finalize_payment_entitlement(
    p_order_id,
    p_gross_amount,
    'dana_qris',
    p_paid_at
  );

  return entitlement;
end;
$$;

revoke all on function public.finalize_dana_payment_order(
  text, text, text, integer, timestamptz
) from public, anon, authenticated;

grant execute on function public.finalize_dana_payment_order(
  text, text, text, integer, timestamptz
) to service_role;
