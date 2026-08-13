create table if not exists public.book_cost_events (
  id text primary key,
  reference_id text,
  story_id text,
  story_title text not null default '',
  event_type text not null check (event_type in ('book_draft', 'image_generation', 'pdf_ocr', 'payment_fee')),
  provider text not null,
  model text,
  amount_idr integer not null check (amount_idr >= 0),
  amount_usd numeric(14, 8),
  input_tokens integer,
  output_tokens integer,
  image_tokens integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.book_cost_events add column if not exists reference_id text;
create unique index if not exists book_cost_events_reference_id_idx
  on public.book_cost_events (reference_id)
  where reference_id is not null;

create index if not exists book_cost_events_story_created_at_idx
  on public.book_cost_events (story_id, created_at desc);

create index if not exists book_cost_events_created_at_idx
  on public.book_cost_events (created_at desc);

alter table public.book_cost_events enable row level security;
revoke all on public.book_cost_events from anon, authenticated;
grant select, insert on public.book_cost_events to service_role;;
