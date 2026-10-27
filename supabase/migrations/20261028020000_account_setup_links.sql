-- Akaun: one-time links to set a password ("Tetapkan kata laluan"), made when an account is added or when an admin
-- presses "Pautan kata laluan baharu". The admin sends it by WhatsApp (or it is emailed). Each link works once, for 24 hours.
-- Only a SHA-256 hash of the secret is stored. Private table: only the API (service role) reads or writes it.
create table if not exists public.account_setup_links (
  token_hash text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  purpose    text not null check (purpose in ('invite', 'reset')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at    timestamptz
);
create index if not exists account_setup_links_user on public.account_setup_links (user_id, created_at desc);

alter table public.account_setup_links enable row level security;
