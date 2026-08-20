-- Keep the current reading position small and quick to query, while preserving
-- a server-written event trail for engagement analytics.
create table if not exists public.user_reading_activity_events (
  id bigint generated always as identity primary key,
  user_id text not null,
  story_id text not null,
  last_page_read integer not null check (last_page_read >= 0),
  total_pages integer not null check (total_pages >= 0),
  is_completed boolean not null default false,
  event_type text not null check (event_type in ('progress', 'completed')),
  occurred_at timestamptz not null default now()
);

create index if not exists user_reading_activities_updated_at_idx
  on public.user_reading_activities (updated_at desc);

create index if not exists user_reading_activity_events_occurred_at_idx
  on public.user_reading_activity_events (occurred_at desc);

create index if not exists user_reading_activity_events_user_occurred_at_idx
  on public.user_reading_activity_events (user_id, occurred_at desc);

create index if not exists user_reading_activity_events_story_occurred_at_idx
  on public.user_reading_activity_events (story_id, occurred_at desc);

alter table public.user_reading_activity_events enable row level security;

revoke all on public.user_reading_activity_events from anon, authenticated;
grant select, insert, update, delete on public.user_reading_activity_events to service_role;
grant usage, select on sequence public.user_reading_activity_events_id_seq to service_role;

-- Extend the existing account-deletion cleanup so the event trail is deleted
-- with the account instead of retaining behavioural data indefinitely.
create or replace function private.cleanup_bacayuk_deleted_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  anonymized_email text := 'deleted-' || old.id::text || '@deleted.invalid';
begin
  delete from public.user_entitlements where user_id = old.id;
  delete from public.user_reading_activity_events where user_id = old.id::text;
  delete from public.user_reading_activities where user_id = old.id::text;
  delete from public.users where id = old.id::text;

  update public.payment_orders
  set user_id = null, customer_name = 'Akun Dihapus', customer_email = anonymized_email,
      account_deleted_at = now(), updated_at = now()
  where user_id = old.id;

  if old.email is not null then
    update public.transaction_records
    set customer_name = 'Akun Dihapus', customer_email = anonymized_email, customer_phone = null
    where lower(customer_email) = lower(old.email);
    update public.purchase_receipts
    set customer_name = 'Akun Dihapus', customer_email = anonymized_email
    where lower(customer_email) = lower(old.email);
  end if;
  return old;
end;
$$;

revoke all on function private.cleanup_bacayuk_deleted_account() from public, anon, authenticated;
