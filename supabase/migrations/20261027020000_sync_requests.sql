-- "Sync sekarang" button: Panel Admin records a request; the Apps Script checks every 5 minutes
-- (GET /api/sync/pending) and runs the sync when one is waiting. PRIVATE (no policy).
create table if not exists public.sync_control (
  id           int primary key default 1 check (id = 1),
  requested_at timestamptz,
  requested_by text
);
alter table public.sync_control enable row level security;
insert into public.sync_control (id) values (1) on conflict (id) do nothing;
