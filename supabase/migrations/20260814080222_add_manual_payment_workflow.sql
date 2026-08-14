alter table public.payment_orders
  add column provider text not null default 'midtrans',
  add column expires_at timestamptz,
  add column proof_object_path text,
  add column proof_mime_type text,
  add column proof_submitted_at timestamptz,
  add column payer_note text,
  add column review_note text,
  add column reviewed_at timestamptz,
  add column reviewed_by text;

alter table public.payment_orders
  drop constraint if exists payment_orders_status_check;

alter table public.payment_orders
  add constraint payment_orders_status_check check (
    status in (
      'pending',
      'pending_payment',
      'pending_review',
      'paid',
      'rejected',
      'cancelled',
      'failed',
      'expired',
      'refunded'
    )
  ),
  add constraint payment_orders_provider_check check (
    provider in ('manual', 'midtrans')
  ),
  add constraint payment_orders_manual_proof_shape check (
    provider <> 'manual'
    or (
      status not in ('pending_review', 'paid')
      or (
        proof_object_path is not null
        and proof_mime_type is not null
        and proof_submitted_at is not null
      )
    )
  );

create index payment_orders_user_status_created_idx
  on public.payment_orders (user_id, status, created_at desc)
  where user_id is not null;

create index payment_orders_manual_review_idx
  on public.payment_orders (proof_submitted_at asc)
  where provider = 'manual' and status = 'pending_review';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'payment-proofs',
  'payment-proofs',
  false,
  1572864,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.approve_manual_payment_order(
  p_order_id text,
  p_reviewed_by text,
  p_review_note text default null
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

  if payment_order.provider <> 'manual' then
    raise exception 'Only manual payment orders can be reviewed here.';
  end if;

  select *
  into entitlement
  from public.user_entitlements
  where source_order_id = p_order_id;

  if entitlement.id is not null then
    return entitlement;
  end if;

  if payment_order.status <> 'pending_review' then
    raise exception 'Payment order is not waiting for review.';
  end if;

  if payment_order.expires_at is not null and payment_order.expires_at <= now() then
    update public.payment_orders
    set status = 'expired',
        updated_at = now()
    where order_id = p_order_id;
    raise exception 'Payment order has expired.';
  end if;

  if payment_order.user_id is null then
    raise exception 'Deleted accounts cannot receive entitlements.';
  end if;

  if payment_order.proof_object_path is null then
    raise exception 'Payment proof has not been submitted.';
  end if;

  select *
  into entitlement
  from public.finalize_payment_entitlement(
    p_order_id,
    payment_order.amount,
    coalesce(payment_order.payment_method, 'manual_bank_transfer'),
    now()
  );

  update public.payment_orders
  set reviewed_at = now(),
      reviewed_by = nullif(trim(p_reviewed_by), ''),
      review_note = nullif(trim(p_review_note), ''),
      updated_at = now()
  where order_id = p_order_id;

  return entitlement;
end;
$$;

revoke all on function public.approve_manual_payment_order(text, text, text)
  from public, anon, authenticated;

grant execute on function public.approve_manual_payment_order(text, text, text)
  to service_role;
