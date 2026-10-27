-- Aggregated data pushed from Google Sheets/Forms by the Apps Script (google-apps-script/).
-- Only totals and counts live here: never names or individual responses.

create table if not exists public.breakdowns (
  key        text primary key,
  title      text not null,
  source     text,
  items      jsonb not null default '[]'::jsonb,  -- [{ "label": text, "value": number }]
  sort_order int  not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists breakdowns_touch on public.breakdowns;
create trigger breakdowns_touch before update on public.breakdowns
  for each row execute function public.touch_updated_at();

alter table public.breakdowns enable row level security;
drop policy if exists "public read breakdowns" on public.breakdowns;
create policy "public read breakdowns" on public.breakdowns for select using (true);

-- Where a link came from: 'manual' (Table Editor / API) or 'sheet' (synced, replaced on each sync)
alter table public.links add column if not exists source text not null default 'manual';
