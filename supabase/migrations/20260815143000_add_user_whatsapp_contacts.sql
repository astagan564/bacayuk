create table public.user_whatsapp_contacts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  phone_e164 text not null,
  label text not null default 'Utama',
  is_default boolean not null default false,
  order_notifications_enabled boolean not null default false,
  consented_at timestamptz,
  opted_out_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_whatsapp_contacts_phone_format check (phone_e164 ~ '^62[1-9][0-9]{7,12}$'),
  constraint user_whatsapp_contacts_label_length check (char_length(label) between 1 and 40),
  constraint user_whatsapp_contacts_consent_shape check (
    not order_notifications_enabled
    or (consented_at is not null and opted_out_at is null)
  ),
  unique (user_id, phone_e164)
);

create unique index user_whatsapp_contacts_default_idx
  on public.user_whatsapp_contacts (user_id)
  where is_default;

create index user_whatsapp_contacts_user_created_idx
  on public.user_whatsapp_contacts (user_id, created_at desc);

alter table public.user_whatsapp_contacts enable row level security;
revoke all on public.user_whatsapp_contacts from public, anon, authenticated;
revoke all on sequence public.user_whatsapp_contacts_id_seq from public, anon, authenticated;
grant select, insert, update, delete on public.user_whatsapp_contacts to service_role;
grant usage, select on sequence public.user_whatsapp_contacts_id_seq to service_role;

create or replace function public.set_default_whatsapp_contact(
  p_user_id uuid,
  p_contact_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.user_whatsapp_contacts
    where id = p_contact_id and user_id = p_user_id
  ) then
    raise exception 'WhatsApp contact not found';
  end if;

  update public.user_whatsapp_contacts
  set is_default = false
  where user_id = p_user_id and is_default;

  update public.user_whatsapp_contacts
  set is_default = true,
      updated_at = now()
  where id = p_contact_id and user_id = p_user_id;
end;
$$;

revoke all on function public.set_default_whatsapp_contact(uuid, bigint) from public, anon, authenticated;
grant execute on function public.set_default_whatsapp_contact(uuid, bigint) to service_role;

create or replace function private.ensure_whatsapp_default_after_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_default then
    update public.user_whatsapp_contacts
    set is_default = true,
        updated_at = now()
    where id = (
      select id
      from public.user_whatsapp_contacts
      where user_id = old.user_id
      order by created_at asc, id asc
      limit 1
    );
  end if;
  return old;
end;
$$;

revoke all on function private.ensure_whatsapp_default_after_delete() from public, anon, authenticated;

create trigger ensure_whatsapp_default_after_delete
after delete on public.user_whatsapp_contacts
for each row execute function private.ensure_whatsapp_default_after_delete();

alter table public.payment_orders
  add column whatsapp_contact_id bigint references public.user_whatsapp_contacts (id) on delete set null,
  add column customer_whatsapp text;

alter table public.payment_orders
  add constraint payment_orders_customer_whatsapp_format check (
    customer_whatsapp is null or customer_whatsapp ~ '^62[1-9][0-9]{7,12}$'
  );

-- Once proof has been submitted, the payment deadline must no longer race the
-- Admin review. Rejected proofs receive a fresh deadline when resubmission starts.
update public.payment_orders
set expires_at = null,
    updated_at = now()
where status = 'pending_review';

create or replace function private.clear_manual_payment_expiry_after_proof()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'pending_review' then
    new.expires_at := null;
  end if;
  return new;
end;
$$;

revoke all on function private.clear_manual_payment_expiry_after_proof() from public, anon, authenticated;

drop trigger if exists clear_manual_payment_expiry_after_proof on public.payment_orders;
create trigger clear_manual_payment_expiry_after_proof
before insert or update of status on public.payment_orders
for each row execute function private.clear_manual_payment_expiry_after_proof();

comment on table public.user_whatsapp_contacts is
  'User-managed WhatsApp notification contacts. OAuth auth phone remains separate.';
comment on column public.user_whatsapp_contacts.verified_at is
  'Reserved for ownership verification after the customer authentication template is enabled.';

create or replace function private.cleanup_bacayuk_deleted_whatsapp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.payment_orders
  set customer_whatsapp = null,
      whatsapp_contact_id = null,
      updated_at = now()
  where user_id = old.id;
  return old;
end;
$$;

revoke all on function private.cleanup_bacayuk_deleted_whatsapp() from public, anon, authenticated;

drop trigger if exists cleanup_00_bacayuk_deleted_whatsapp on auth.users;
create trigger cleanup_00_bacayuk_deleted_whatsapp
before delete on auth.users
for each row execute function private.cleanup_bacayuk_deleted_whatsapp();
