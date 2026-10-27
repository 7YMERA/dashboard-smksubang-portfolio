-- SMK Subang dashboard: core schema
-- Public data is readable by anyone (anon key); writes go through the Render API (service role).

create extension if not exists "pgcrypto";

-- Link hub (mirrors the links on the school's old link page)
create table if not exists public.links (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  url         text not null check (url ~* '^https?://'),
  category    text not null default 'Umum',
  description text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Announcements / pengumuman
create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text,
  published_at timestamptz not null default now(),
  expires_at   timestamptz,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Key figures shown as dashboard cards (e.g. jumlah murid, kehadiran)
create table if not exists public.metrics (
  key        text primary key,
  label      text not null,
  value      numeric not null default 0,
  unit       text,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- Raw rows imported from external sources (Google Sheets CSV etc.)
create table if not exists public.dataset_rows (
  id          bigint generated always as identity primary key,
  dataset     text not null,
  data        jsonb not null,
  imported_at timestamptz not null default now()
);
create index if not exists dataset_rows_dataset_idx on public.dataset_rows (dataset);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists links_touch on public.links;
create trigger links_touch before update on public.links
  for each row execute function public.touch_updated_at();
drop trigger if exists metrics_touch on public.metrics;
create trigger metrics_touch before update on public.metrics
  for each row execute function public.touch_updated_at();

-- Row Level Security: public read-only, no public writes
alter table public.links         enable row level security;
alter table public.announcements enable row level security;
alter table public.metrics       enable row level security;
alter table public.dataset_rows  enable row level security;

drop policy if exists "public read active links" on public.links;
create policy "public read active links" on public.links
  for select using (is_active);

drop policy if exists "public read live announcements" on public.announcements;
create policy "public read live announcements" on public.announcements
  for select using (is_active and (expires_at is null or expires_at > now()));

drop policy if exists "public read metrics" on public.metrics;
create policy "public read metrics" on public.metrics
  for select using (true);
-- dataset_rows: no policy => only service role can read/write
