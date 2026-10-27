-- v2.6 views: Jadual Makmal (computer lab timetable) and Penyata Cuti (leave summary).
-- Both PRIVATE (no policy): the API decides what is public. The public lab view never gets `teacher`.

-- One row per lab per school week (from the tabs M1..M43 of the timetable workbook)
create table if not exists public.lab_weeks (
  week       int  not null,
  lab        text not null,
  label      text not null,             -- e.g. "MINGGU 38 (26/10 - 30/10)"
  start_date date,
  end_date   date,
  days       jsonb not null default '[]'::jsonb,   -- ["ISNIN", …]
  periods    jsonb not null default '[]'::jsonb,   -- [{ "label": "1", "time": "7.30 - 8.05", "session": "pagi" }, …]
  updated_at timestamptz not null default now(),
  primary key (week, lab)
);
alter table public.lab_weeks enable row level security;

-- Booked slots only (empty = free)
create table if not exists public.lab_slots (
  id         bigint generated always as identity primary key,
  week       int  not null,
  lab        text not null,
  day        text not null,
  period     int  not null,             -- index into lab_weeks.periods
  span       int  not null default 1,   -- merged cells: how many periods this booking covers
  subject    text,                      -- public: "ASK"
  class_name text,                      -- public: "3 ALAMANDA"
  teacher    text,                      -- login only
  raw        text not null              -- original cell text (login only)
);
create index if not exists lab_slots_week_idx on public.lab_slots (week, lab);
alter table public.lab_slots enable row level security;

-- Leave summary per teacher (from each teacher's PENYATA CUTI sheet). Sensitive: login only.
create table if not exists public.leave_summary (
  name        text primary key,
  position    int,
  crk_entitled numeric,
  crk_used    numeric not null default 0,
  types       jsonb not null default '[]'::jsonb,  -- [{ "type": "CUTI SAKIT (SWASTA)", "used": 1, "entitled": 15 }, …]
  sheet_url   text,
  year        int,
  synced_at   timestamptz not null default now()
);
alter table public.leave_summary enable row level security;
