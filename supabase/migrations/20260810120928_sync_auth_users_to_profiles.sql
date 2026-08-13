alter table public.users alter column email drop not null;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.sync_bacayuk_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, name, email, phone, login_method, created_at)
  values (
    new.id::text,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'parent_name', ''),
      case when new.phone is not null then 'Orang Tua (' || right(new.phone, 4) || ')' end,
      split_part(coalesce(new.email, ''), '@', 1),
      'Orang Tua'
    ),
    new.email,
    new.phone,
    coalesce(
      nullif(new.raw_app_meta_data ->> 'provider', ''),
      case when new.phone is not null then 'whatsapp' else 'email' end
    ),
    new.created_at
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone,
    login_method = excluded.login_method;
  return new;
end;
$$;

revoke all on function private.sync_bacayuk_auth_user() from public, anon, authenticated;

drop trigger if exists sync_bacayuk_auth_user on auth.users;
create trigger sync_bacayuk_auth_user
after insert or update of email, phone, raw_user_meta_data, raw_app_meta_data
on auth.users
for each row execute function private.sync_bacayuk_auth_user();

insert into public.users (id, name, email, phone, login_method, created_at)
select
  id::text,
  coalesce(
    nullif(raw_user_meta_data ->> 'full_name', ''),
    nullif(raw_user_meta_data ->> 'name', ''),
    nullif(raw_user_meta_data ->> 'parent_name', ''),
    case when phone is not null then 'Orang Tua (' || right(phone, 4) || ')' end,
    split_part(coalesce(email, ''), '@', 1),
    'Orang Tua'
  ),
  email,
  phone,
  coalesce(
    nullif(raw_app_meta_data ->> 'provider', ''),
    case when phone is not null then 'whatsapp' else 'email' end
  ),
  created_at
from auth.users
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  phone = excluded.phone,
  login_method = excluded.login_method;;
