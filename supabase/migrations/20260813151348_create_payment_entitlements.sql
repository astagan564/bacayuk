create table public.payment_orders (
  order_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  purchase_type text not null check (purchase_type in ('book', 'vip')),
  story_id text not null,
  story_title text not null,
  amount integer not null check (amount > 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  coupon_code text,
  customer_name text not null,
  customer_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'refunded')),
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_orders_story_shape check (
    (purchase_type = 'vip' and story_id = 'vip_sub')
    or (purchase_type = 'book' and story_id <> 'vip_sub')
  )
);

create index payment_orders_user_created_at_idx
  on public.payment_orders (user_id, created_at desc);

create index payment_orders_status_created_at_idx
  on public.payment_orders (status, created_at desc);

create table public.user_entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  entitlement_type text not null check (entitlement_type in ('book', 'vip')),
  story_id text,
  story_title text not null,
  source_order_id text not null unique references public.payment_orders (order_id),
  customer_name text not null,
  customer_email text not null,
  payment_method text not null,
  amount integer not null check (amount >= 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  token_expires_at timestamptz,
  download_count integer not null default 0 check (download_count >= 0),
  download_limit integer check (download_limit is null or download_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_entitlements_shape check (
    (
      entitlement_type = 'vip'
      and story_id is null
      and expires_at is not null
      and token_expires_at is null
      and download_limit is null
    )
    or (
      entitlement_type = 'book'
      and story_id is not null
      and expires_at is null
      and token_expires_at is not null
      and download_limit is not null
    )
  )
);

create index user_entitlements_user_type_expires_idx
  on public.user_entitlements (user_id, entitlement_type, expires_at desc);

create index user_entitlements_user_story_idx
  on public.user_entitlements (user_id, story_id)
  where entitlement_type = 'book';

alter table public.payment_orders enable row level security;
alter table public.user_entitlements enable row level security;

revoke all on public.payment_orders from public, anon, authenticated;
revoke all on public.user_entitlements from public, anon, authenticated;
revoke all on sequence public.user_entitlements_id_seq from public, anon, authenticated;

grant select, insert, update on public.payment_orders to service_role;
grant select, insert, update on public.user_entitlements to service_role;
grant usage, select on sequence public.user_entitlements_id_seq to service_role;

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

  if payment_order.amount <> p_gross_amount then
    raise exception 'Paid amount does not match the payment order.';
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
      paid_at = p_paid_at,
      updated_at = now()
  where order_id = p_order_id;

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

create or replace function public.consume_download_entitlement(
  p_user_id uuid,
  p_story_id text
)
returns public.user_entitlements
language plpgsql
security definer
set search_path = ''
as $$
declare
  entitlement public.user_entitlements;
begin
  select *
  into entitlement
  from public.user_entitlements
  where user_id = p_user_id
    and entitlement_type = 'vip'
    and starts_at <= now()
    and expires_at > now()
  order by expires_at desc
  limit 1;

  if entitlement.id is not null then
    return entitlement;
  end if;

  select *
  into entitlement
  from public.user_entitlements
  where user_id = p_user_id
    and entitlement_type = 'book'
    and story_id = p_story_id
  order by created_at desc
  limit 1
  for update;

  if entitlement.id is null then
    raise exception 'No download entitlement found.';
  end if;
  if entitlement.token_expires_at <= now() then
    raise exception 'Download token has expired.';
  end if;
  if entitlement.download_count >= entitlement.download_limit then
    raise exception 'Download limit has been reached.';
  end if;

  update public.user_entitlements
  set download_count = download_count + 1,
      updated_at = now()
  where id = entitlement.id
  returning * into entitlement;

  return entitlement;
end;
$$;

create or replace function public.renew_download_entitlement(
  p_user_id uuid,
  p_story_id text
)
returns public.user_entitlements
language plpgsql
security definer
set search_path = ''
as $$
declare
  entitlement public.user_entitlements;
begin
  select *
  into entitlement
  from public.user_entitlements
  where user_id = p_user_id
    and entitlement_type = 'book'
    and story_id = p_story_id
  order by created_at desc
  limit 1
  for update;

  if entitlement.id is null then
    raise exception 'No download entitlement found.';
  end if;
  if entitlement.token_expires_at > now() then
    raise exception 'Download token is still active.';
  end if;

  update public.user_entitlements
  set token_expires_at = now() + interval '24 hours',
      download_count = 0,
      updated_at = now()
  where id = entitlement.id
  returning * into entitlement;

  return entitlement;
end;
$$;

revoke all on function public.finalize_payment_entitlement(text, integer, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.consume_download_entitlement(uuid, text)
  from public, anon, authenticated;
revoke all on function public.renew_download_entitlement(uuid, text)
  from public, anon, authenticated;

grant execute on function public.finalize_payment_entitlement(text, integer, text, timestamptz)
  to service_role;
grant execute on function public.consume_download_entitlement(uuid, text)
  to service_role;
grant execute on function public.renew_download_entitlement(uuid, text)
  to service_role;
