alter table public.payment_orders
  drop constraint payment_orders_user_id_fkey;

alter table public.payment_orders
  alter column user_id drop not null,
  add column account_deleted_at timestamptz;

alter table public.payment_orders
  add constraint payment_orders_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete set null;

create or replace function private.cleanup_bacayuk_deleted_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  anonymized_email text := 'deleted-' || old.id::text || '@deleted.invalid';
begin
  -- Download rights and reading/profile data have no retention requirement.
  delete from public.user_entitlements where user_id = old.id;
  delete from public.user_reading_activities where user_id = old.id::text;
  delete from public.users where id = old.id::text;

  -- Keep financial records for reconciliation, without retaining account identity.
  update public.payment_orders
  set
    user_id = null,
    customer_name = 'Akun Dihapus',
    customer_email = anonymized_email,
    account_deleted_at = now(),
    updated_at = now()
  where user_id = old.id;

  if old.email is not null then
    update public.transaction_records
    set
      customer_name = 'Akun Dihapus',
      customer_email = anonymized_email,
      customer_phone = null
    where lower(customer_email) = lower(old.email);

    update public.purchase_receipts
    set
      customer_name = 'Akun Dihapus',
      customer_email = anonymized_email
    where lower(customer_email) = lower(old.email);
  end if;

  return old;
end;
$$;

revoke all on function private.cleanup_bacayuk_deleted_account()
from public, anon, authenticated;

drop trigger if exists cleanup_bacayuk_deleted_account on auth.users;
create trigger cleanup_bacayuk_deleted_account
before delete on auth.users
for each row execute function private.cleanup_bacayuk_deleted_account();
