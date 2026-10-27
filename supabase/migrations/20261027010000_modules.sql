-- Modules: Penghantaran (trackers), Tugasan (tasks), Analisis (multi-series / admin-only charts),
-- Status Sync (sync_runs). All filled by the Apps Script through POST /api/sync.

-- Penghantaran: one row per tracked submission (public: counts only)
create table if not exists public.trackers (
  key        text primary key,
  title      text not null,
  source     text,
  total      int  not null default 0,
  done       int  not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.trackers enable row level security;
drop policy if exists "public read trackers" on public.trackers;
create policy "public read trackers" on public.trackers for select using (true);

-- Names still pending. PRIVATE: no policy, only the API (service role) can read it, for /admin.
create table if not exists public.tracker_pending (
  id          bigint generated always as identity primary key,
  tracker_key text not null references public.trackers (key) on delete cascade,
  name        text not null,
  detail      text,
  position    int  not null default 0
);
create index if not exists tracker_pending_key_idx on public.tracker_pending (tracker_key);
alter table public.tracker_pending enable row level security;

-- A link can show the progress of one tracker
alter table public.links add column if not exists tracker_key text;
update public.links set tracker_key = 'sks_kekuatan_guru_2026'
  where title = 'GF - SKS Kekuatan Guru 2026' and tracker_key is null;
update public.links set tracker_key = 'kbat_pdp_2026'
  where title = 'GF Sekolah - Rekod Pengisian Skor KBAT PdP 2026' and tracker_key is null;
update public.links set tracker_key = 'pencerapan_1_2026'
  where title = 'Penghantaran Skor Pencerapan PdPc (Pencerapan 1)' and tracker_key is null;

-- Tugasan: tasks and deadlines from "SEMAKAN TINJAUAN KUTIPAN DATA" (public)
create table if not exists public.tasks (
  id          bigint generated always as identity primary key,
  title       text not null,
  url         text,
  tracker_key text,                                -- progress shown on the task, if its sheet is tracked
  deadline   date,
  status     text,
  position   int  not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
drop policy if exists "public read tasks" on public.tasks;
create policy "public read tasks" on public.tasks for select using (true);

-- Analisis: series names for grouped charts, and admin-only charts
alter table public.breakdowns add column if not exists series jsonb;
alter table public.breakdowns add column if not exists visibility text not null default 'public';
alter table public.breakdowns drop constraint if exists breakdowns_visibility_check;
alter table public.breakdowns add constraint breakdowns_visibility_check check (visibility in ('public', 'admin'));
drop policy if exists "public read breakdowns" on public.breakdowns;
create policy "public read breakdowns" on public.breakdowns for select using (visibility = 'public');

-- Status Sync: one row per sync, with data warnings. PRIVATE (no policy).
create table if not exists public.sync_runs (
  id       bigint generated always as identity primary key,
  ran_at   timestamptz not null default now(),
  summary  jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb
);
alter table public.sync_runs enable row level security;

-- The placeholder card from the first seed; averages from the sync replace it.
delete from public.metrics where key = 'guru';

-- Roles: 'admin' (manages everything) and 'pentadbir' (Pengetua/PK: sees everything, read-only).
alter table public.admins drop constraint if exists admins_role_check;
update public.admins set role = 'pentadbir' where role = 'viewer';
alter table public.admins add constraint admins_role_check check (role in ('admin', 'pentadbir'));
