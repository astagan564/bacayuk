alter table public.payment_orders
  add column charged_amount integer,
  add column customer_fee_amount integer not null default 0;

alter table public.payment_orders
  add constraint payment_orders_charged_amount_check
    check (charged_amount is null or charged_amount >= amount),
  add constraint payment_orders_customer_fee_amount_check
    check (customer_fee_amount >= 0);

create or replace function public.finalize_payment_entitlement(
  p_order_id text,
  p_gross_amount integer,
  p_payment_method text,
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
  vip_start timestamptz;
begin
  select *
  into payment_order
  from public.payment_orders
  where order_id = p_order_id
  for update;

  if payment_order.order_id is null then
    raise exception 'Payment order not found.';
  end if;

  -- Midtrans can add a customer-borne channel fee to gross_amount. Never
  -- accept an underpayment, while preserving the catalog price on the order.
  if p_gross_amount < payment_order.amount then
    raise exception 'Paid amount is lower than the payment order.';
  end if;

  select *
  into entitlement
  from public.user_entitlements
  where source_order_id = p_order_id;

  if entitlement.id is not null then
    return entitlement;
  end if;

  update public.payment_orders
  set status = 'paid',
      payment_method = p_payment_method,
      charged_amount = p_gross_amount,
      customer_fee_amount = p_gross_amount - payment_order.amount,
      paid_at = p_paid_at,
      updated_at = now()
  where order_id = p_order_id;

  -- A provider webhook may arrive after the customer has deleted the account.
  -- Reconcile the financial order, but never create access for a deleted user.
  if payment_order.user_id is null then
    return null;
  end if;

  if payment_order.purchase_type = 'vip' then
    select greatest(now(), coalesce(max(expires_at), now()))
    into vip_start
    from public.user_entitlements
    where user_id = payment_order.user_id
      and entitlement_type = 'vip'
      and expires_at > now();

    insert into public.user_entitlements (
      user_id, entitlement_type, story_id, story_title, source_order_id,
      customer_name, customer_email, payment_method, amount, starts_at, expires_at
    ) values (
      payment_order.user_id, 'vip', null, payment_order.story_title, payment_order.order_id,
      payment_order.customer_name, payment_order.customer_email, p_payment_method,
      payment_order.amount, vip_start, vip_start + interval '1 month'
    ) returning * into entitlement;
  else
    insert into public.user_entitlements (
      user_id, entitlement_type, story_id, story_title, source_order_id,
      customer_name, customer_email, payment_method, amount, token_expires_at, download_limit
    ) values (
      payment_order.user_id, 'book', payment_order.story_id, payment_order.story_title,
      payment_order.order_id, payment_order.customer_name, payment_order.customer_email,
      p_payment_method, payment_order.amount, now() + interval '24 hours', 3
    ) returning * into entitlement;
  end if;

  return entitlement;
end;
$$;
