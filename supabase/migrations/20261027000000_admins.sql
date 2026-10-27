-- Who may use /admin. Accounts live in Supabase Auth (email + password, public sign-up disabled);
-- this table says which of them are admins and what they may do.
--   admin  : full access (edit links, announcements, see detailed data)
--   pentadbir : read-only access to the admin panel (Pengetua, PK); renamed from 'viewer' in 20261027010000
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'admin' check (role in ('admin', 'viewer')),
  name       text,
  created_at timestamptz not null default now()
);

-- No policies: only the API (service role) reads or writes this table.
alter table public.admins enable row level security;
