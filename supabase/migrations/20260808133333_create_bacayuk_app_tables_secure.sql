create table if not exists public.admin_stories (
  id text primary key,
  title text not null,
  category text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  story jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_stories_status_sort_order_idx
  on public.admin_stories (status, sort_order);

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  login_method text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists users_email_idx on public.users (email);

create table if not exists public.admin_settings (
  id integer primary key default 1,
  eye_rest_interval_minutes integer not null default 20,
  download_link_expire_hours integer not null default 24,
  default_ebook_price integer not null default 15000,
  enable_global_watermark boolean not null default true,
  allow_guest_free_book_count integer not null default 1,
  enable_copy_protection boolean not null default true,
  promo_banner_text text not null default '',
  promo_banner_active boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint admin_settings_singleton check (id = 1)
);

create table if not exists public.discount_coupons (
  code text primary key,
  type text not null check (type in ('percent', 'fixed')),
  value integer not null,
  min_purchase integer,
  usage_count integer not null default 0,
  max_usage integer,
  expires_at timestamptz,
  is_active boolean not null default true
);

create table if not exists public.transaction_records (
  id text primary key,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  story_id text not null,
  story_title text not null,
  payment_method text not null,
  amount integer not null,
  discount_amount integer,
  coupon_code text,
  status text not null check (status in ('success', 'pending', 'expired')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists transaction_records_customer_email_idx
  on public.transaction_records (customer_email);

create index if not exists transaction_records_status_created_at_idx
  on public.transaction_records (status, created_at desc);

create table if not exists public.purchase_receipts (
  id text primary key,
  story_id text not null,
  story_title text not null,
  customer_name text not null,
  customer_email text not null,
  transaction_id text not null,
  payment_method text not null,
  amount integer not null,
  purchased_at timestamptz not null,
  download_count integer not null default 0,
  token_expires_at timestamptz not null
);

create index if not exists purchase_receipts_customer_email_idx
  on public.purchase_receipts (customer_email);

create unique index if not exists purchase_receipts_transaction_id_idx
  on public.purchase_receipts (transaction_id);

create table if not exists public.user_reading_activities (
  user_id text not null,
  user_name text not null,
  user_email text not null,
  story_id text not null,
  story_title text not null,
  last_page_read integer not null default 0,
  total_pages integer not null default 0,
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

create index if not exists user_reading_activities_story_id_idx
  on public.user_reading_activities (story_id);

alter table public.admin_stories enable row level security;
alter table public.users enable row level security;
alter table public.admin_settings enable row level security;
alter table public.discount_coupons enable row level security;
alter table public.transaction_records enable row level security;
alter table public.purchase_receipts enable row level security;
alter table public.user_reading_activities enable row level security;

drop policy if exists "Public can read published stories" on public.admin_stories;
create policy "Public can read published stories"
  on public.admin_stories
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Client can upsert demo users" on public.users;
drop policy if exists "Client can manage app settings" on public.admin_settings;
drop policy if exists "Client can manage coupons" on public.discount_coupons;
drop policy if exists "Client can manage transaction records" on public.transaction_records;
drop policy if exists "Client can manage purchase receipts" on public.purchase_receipts;
drop policy if exists "Client can manage reading activities" on public.user_reading_activities;

grant select on public.admin_stories to anon, authenticated;
revoke all on public.users from anon, authenticated;
revoke all on public.admin_settings from anon, authenticated;
revoke all on public.discount_coupons from anon, authenticated;
revoke all on public.transaction_records from anon, authenticated;
revoke all on public.purchase_receipts from anon, authenticated;
revoke all on public.user_reading_activities from anon, authenticated;;
