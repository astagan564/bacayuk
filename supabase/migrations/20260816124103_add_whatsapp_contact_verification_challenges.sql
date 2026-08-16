create table public.whatsapp_contact_verification_challenges (
  contact_id bigint primary key references public.user_whatsapp_contacts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  next_send_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whatsapp_contact_verification_attempts_check check (attempts between 0 and 5)
);

create index whatsapp_contact_verification_user_idx
  on public.whatsapp_contact_verification_challenges (user_id);

alter table public.whatsapp_contact_verification_challenges enable row level security;
revoke all on public.whatsapp_contact_verification_challenges from public, anon, authenticated;
grant select, insert, update, delete on public.whatsapp_contact_verification_challenges to service_role;

comment on table public.whatsapp_contact_verification_challenges is
  'Short-lived, server-only WhatsApp ownership verification challenges. Only keyed hashes are stored.';
