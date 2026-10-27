-- Penyata Cuti: a personal link per teacher (/cuti/<token>) so each teacher can see only their own
-- statement without an account. The token is a 32-character random secret; changing it ("Tukar pautan")
-- stops the old link working. Private table: only the API (service role) reads or writes it.
create table if not exists public.leave_links (
  name           text primary key references public.leave_summary (name) on delete cascade on update cascade,
  token          text not null unique,
  created_at     timestamptz not null default now(),
  last_viewed_at timestamptz,
  view_count     int not null default 0
);

alter table public.leave_links enable row level security;
