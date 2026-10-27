-- Log Audit: who did what in Panel Admin (log in, edit links/announcements/accounts, Sync sekarang).
-- Written only by the API (service role); read in Panel Admin → Log Audit.
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_id    uuid,                -- auth user id (null for failed logins and the Apps Script)
  actor_email text,
  actor_name  text,
  actor_role  text,                -- admin / pentadbir / system / null
  action      text not null,       -- e.g. login, login_failed, link.update, account.create
  target      text,                -- what was changed, in words (e.g. the link title)
  details     jsonb,               -- changed fields; never passwords
  ip          text
);

create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_action_idx on public.audit_log (action);

-- No policies: nobody reads it with the public key.
alter table public.audit_log enable row level security;

-- Append-only: entries cannot be edited, and can only be deleted once they are over a year old.
create or replace function public.audit_log_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'audit_log is append-only';
  end if;
  if old.at > now() - interval '365 days' then
    raise exception 'audit_log entries are kept for a year';
  end if;
  return old;
end $$;

drop trigger if exists audit_log_guard on public.audit_log;
create trigger audit_log_guard before update or delete on public.audit_log
  for each row execute function public.audit_log_guard();
