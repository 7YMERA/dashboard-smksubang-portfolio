# Technical setup & reference

> 👩‍🏫 **Untuk cikgu / pengguna:** baca **[PANDUAN.md](../PANDUAN.md)** (Bahasa Melayu, tanpa istilah teknikal).
> This file is the technical reference. To run it locally, see [CONTRIBUTING.md](../CONTRIBUTING.md).

Once deployed: `https://<your-app>.vercel.app` · Panel Admin: `https://<your-app>.vercel.app/admin`

**Pengurusan Data dan Maklumat SMK Subang 2026.** One site with a view switcher at the top:
**Semakan Tinjauan** (main), **Jadual Makmal**, **Penyata Cuti** (login), **Analisis PdPc**, **Pautan**. It shows the content
of the school's sheets directly (no more "click to open the sheet"), read from Google Sheets/Excel every hour.
The original sheets stay the source of truth ("legacy kept"): people keep editing them, and every view links back.

```
            ┌──────────── one Vercel project (vercel.json services) ────────────┐
Browser ──► │ /*      → web (Next.js) ──binding API_URL──► smksubang-api        │ ──► Supabase
            │ /api/*  → smksubang-api (Express)                                 │    (Postgres)
            └───────────────────────────────────────────────▲─────────────────┘
   Google Sheets/Forms ─► Apps Script ── POST /api/sync ─────┘  (hourly)
```

| Folder | What it is |
|---|---|
| `web/` | Next.js site (Vercel service `web`, public at `/`). Modules in `web/app/modules/<module>/`. |
| `api/` | Express API (Vercel service `smksubang-api`, public at `/api/*`). One router per module in `api/src/modules/`. |
| `supabase/` | Database migrations and starter data. |
| `google-apps-script/` | Runs inside the school Google account; one `.gs` file per module. Only `Config.gs` needs editing. |

---

## Modules

Each module has its own code in all three layers, so it can be changed on its own.

| Module | Shows | Where it gets data | Files |
|---|---|---|---|
| **Tugasan / Semakan Tinjauan** (main view) | Open tasks with countdown and progress, plus the full sheet as a table with status filter and search | Sheet *SEMAKAN TINJAUAN KUTIPAN DATA* | `Tasks.gs` · `modules/tasks/` · table `tasks` |
| **Jadual Makmal** (view) | Lab timetable per week, both labs, free/booked, today highlighted; public sees subject + class, login adds teacher | *JADUAL PENGGUNAAN MAKMAL KOMPUTER 2026.xlsx* (tabs M1–M43), read via a temporary Google Sheets copy when the file changes | `Lab.gs` · `modules/lab/` · `api/src/modules/views.js` · tables `lab_weeks`, `lab_slots` |
| **Penyata Cuti** (view, login only) | Per teacher: CRK entitlement/used/balance, sick and other leave; search and sort; link to each statement. **Pautan guru:** each teacher's own statement at a personal secret link `/cuti/<token>` (no login), copied from the table for WhatsApp; shows if opened; **Tukar pautan** replaces a leaked link | *PENYATA CUTI GURU* index + each teacher's statement sheet (from the "klik" link, or found by exact file name when the link can't be read), once a day in batches | `Leave.gs` · `modules/leave/` · `app/cuti/[token]/` · tables `leave_summary`, `leave_links` |
| **Pautan** (links) | Colour-coded, searchable buttons, with progress on form links | Panel Admin (or optional `PAUTAN` sheet) | `modules/links/` (web + api) · `Links.gs` · table `links` |
| **Penghantaran** (submissions) | Public: “133/150 dihantar” on tasks and links. Panel Admin: names not yet submitted + **Salin senarai** (copy for WhatsApp) | Teacher lists in *SKS … KEKUATAN GURU*, *PENCERAPAN PDPC 2026* | `Trackers.gs` · `modules/admin/PendingLists.js` · tables `trackers`, `tracker_pending` |
| **Analisis** (analysis) | Averages; score bands; Kendiri vs Pencerapan 1 per aspect; KBAT distribution. Panel Admin: per-subject averages | *PENCERAPAN PDPC 2026* | `Analytics.gs` · `modules/analytics/` · tables `metrics`, `breakdowns` |
| **Pengumuman** (announcements) | Notices at the top, with optional end date | Panel Admin | `modules/announcements/` (web + api) · table `announcements` |
| **Status Sync** | When the sync last ran; **Sync sekarang** button (fresh data in ~5 min); **data problems to fix** (e.g. score 9,286.00, task BUKA after its deadline) | Every sync run | `Core.gs` · `modules/admin/SyncStatus.js` · table `sync_runs` |
| **Log Audit** (audit trail) | Who logged in (and failed attempts), and every change made in Panel Admin: links, announcements, accounts, Sync sekarang, with old → new values. Filter by type. Append-only, kept ≥ 1 year, never stores passwords | Written by the API on each action | `api/src/audit.js` · `modules/admin/AuditLog.js` · table `audit_log` |
| **Pengesahan Input** (input checks) | Stops mistakes at entry: 0–100 score questions, required fields, STATUS dropdown, date-only TARIKH AKHIR | Google Forms & Sheets | `Validation.gs` |

### How to use each module

**Tugasan.** Keep using the SEMAKAN sheet exactly as before: one row per task, a hyperlinked title,
TARIKH AKHIR and STATUS (BUKA / TUTUP / SELESAI). Within an hour the dashboard shows open tasks first. If a
task's link points at a spreadsheet listed in `TRACKERS` (`Config.gs`), its progress appears on the card automatically.

**Pautan.** Panel Admin → *Pautan* → **+ Tambah pautan**, or **Ubah** on a card. Set title, URL (use the `forms.gle/…` share link, not the
form's edit link: the form rejects edit links), category (buttons are grouped and coloured by category),
note, order, and **Kemajuan** (which tracker's progress to show on the button). Untick *Paparkan di dashboard* to hide without deleting.

**Penghantaran.** Panel Admin → *Penghantaran*: one card per tracker with the names still pending (and
their pencerap, if any). **Salin senarai** copies a numbered list ready for WhatsApp. To track another
sheet, add an entry to `TRACKERS` in `Config.gs`: which column has the names, and which column shows it's done.

**Analisis.** Automatic from PENCERAPAN PDPC 2026. Cards and charts on the public page; the per-subject
chart is in Panel Admin only. Scores outside 0–100 are left out of averages and listed in Status Sync.

**Pengumuman.** Panel Admin → *Pengumuman*: title, details, optional *Tamat* (end) date. It disappears
from the dashboard after that date.

**Status Sync.** Panel Admin → *Status Sync*: a green “Aktif” means the hourly sync is running. The list
under it is your **to-fix list in Google Sheets**, with the sheet, row and what's wrong. Fix the cell; the
warning disappears on the next sync.

**Pengesahan Input.** In the Apps Script editor run `auditInputs` (report only, changes nothing), read
the log, then run `applyInputRules`. Forms: score questions only accept 0–100, name/score questions
become required. Sheets: STATUS becomes a dropdown, TARIKH AKHIR only accepts real dates, score cells only
accept 0–100. Existing data is not changed; existing wrong cells get a red corner so you can spot them.
Add the Pencerapan 1 and KBAT PdP form IDs to `INPUT_RULES.forms` (they're owned elsewhere or weren't found).

---

## Branding

The header recreates the banner from the SEMAKAN sheet: school blue with light waves, the crest, the title
(Manrope + DM Serif Display, self-hosted via `@fontsource`), and the people behind the dashboard.

- Settings: `web/app/modules/ui/brand.js` (school name, motto, crest, people with name/role/photo).
  `people: []` hides the photos (as in this public copy).
- Images: `web/public/brand/` (`logo.png` crest with transparent background; staff photos go here too).
- Site icons, squared from the crest: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-icon.png`,
  plus `web/public/favicon.ico`; the home-screen manifest is `web/app/manifest.js`.
- Original sheet links per view: `web/app/modules/ui/sources.js`.
- Photos and names of staff are on a public page: keep the people listed there informed and agreeable,
  and remove them from any public copy of the code.

## Access control (RBAC)

Two people roles plus the sync script. Accounts are email + password (Supabase Auth); the `admins`
table gives each account its role. Public sign-up is off. (Google login was tried and shelved.)

| What | Public (no login) | **pentadbir**<br>(Pengetua, PK) | **admin**<br>(cikgu / data manager) | **system**<br>(Apps Script, `ADMIN_TOKEN`) |
|---|:-:|:-:|:-:|:-:|
| View dashboard: tasks, links, announcements, counts, public charts | ✅ | ✅ | ✅ | – |
| Jadual Makmal: subject + class | ✅ | ✅ | ✅ | – |
| Jadual Makmal: **teacher names** | ❌ | ✅ | ✅ | – |
| **Penyata Cuti** (leave summary, all teachers) | ❌ | ✅ | ✅ | – |
| A teacher's **own** statement via their personal link | only that teacher (whoever has the link) | ✅ copy link | ✅ copy + **Tukar pautan** | – |
| Log in to Panel Admin (`/admin`) | ❌ | ✅ | ✅ | – |
| See **names** not yet submitted (Penghantaran) | ❌ | ✅ | ✅ | – |
| See per-subject analysis, Status Sync & data warnings | ❌ | ✅ | ✅ | – |
| Add / edit / hide / delete links | ❌ | ❌ | ✅ | ✅ |
| Add / edit / delete announcements | ❌ | ❌ | ✅ | ✅ |
| Send data (`POST /api/sync`), set metrics, import | ❌ | ❌ | ✅ | ✅ |
| Manage accounts and roles (Panel Admin → **Akaun**) | ❌ | ❌ | ✅ (not their own account) | ❌ |
| See **Log Audit** | ❌ | ✅ | ✅ | – |
| Edit or delete Log Audit entries | ❌ | ❌ | ❌ | ❌ (database trigger; only entries > 1 year old can be deleted) |

Admin and pentadbir use the **same login page** (`/admin`, or **Log masuk** in the top bar); the role on
the account decides what they can do.

How it is enforced:

- **Personal leave links:** 192-bit random tokens in the private `leave_links` table; no IC, birthdate or other
  personal data is used or stored. The page is `noindex` and `no-referrer`, and Vercel Analytics records it as
  `/cuti/[pautan]`, never the token. Password-protected PDFs/sheets keyed on IC or birthdate were considered and
  rejected: a birthdate is guessed offline in under a second, and it would mean handling IC numbers (PDPA).

- **Database:** public tables (`links`, `announcements`, `metrics`, `breakdowns` where `visibility='public'`,
  `trackers`, `tasks`) are read-only to everyone through row-level security. Private tables (`admins`, `audit_log`,
  `tracker_pending`, `sync_runs`, `dataset_rows`, admin-only `breakdowns`) have **no policy**, so only the API's
  secret key can read them.
- **API:** every `/api/admin/*` and write route checks the caller on each request (`api/src/auth.js`):
  admin session → role from `admins`; `ADMIN_TOKEN` → `system`. Removing someone from `admins` takes effect immediately.
- **Web:** Panel Admin pages require a login; `pentadbir` gets no edit buttons and no Akaun page, and the API refuses their writes anyway.

### Panel Admin layout

`web/app/admin/(panel)/` holds one page per section, framed by `layout.js` → `modules/admin/AdminShell.js`: a sidebar
(collapsible on computers and remembered per browser; a ☰ slide-out menu on phones) with badges for pending
submissions and data problems, who is logged in, the theme switch, **Lihat dashboard** and **Log keluar**.

| URL | Section | Who |
|---|---|---|
| `/admin` | **Ringkasan**: tiles (system status, not yet submitted, data problems, links, announcements), pending forms, latest activity | pentadbir+ |
| `/admin/penghantaran` | Penghantaran | pentadbir+ |
| `/admin/sync` | Status Sync + Sync sekarang | pentadbir+ |
| `/admin/analisis` | Analisis dalaman | pentadbir+ |
| `/admin/pautan` | Pautan: cards grouped by category; **Ubah** opens a labelled form, **+ Tambah pautan** | pentadbir (view) · admin (edit) |
| `/admin/pengumuman` | Pengumuman: cards with Dipaparkan / Tersembunyi / Sudah tamat | pentadbir (view) · admin (edit) |
| `/admin/akaun` | Akaun | admin |
| `/admin/audit?type=` | Log Audit | pentadbir+ |

`lib/admin-data.js` fetches the overview once per request (sidebar badges and pages share it). The public top bar
shows **Panel Admin** and **Log keluar** when logged in.
- Sessions last 7 days. Changing `ADMIN_TOKEN` in Vercel logs everyone out.
- **Audit:** every login (success or failure, with method and the visitor's IP) and every write through Panel Admin is
  recorded in `audit_log` by the API (`api/src/audit.js`). Updates store only the fields that changed (`dari → kepada`).
  The hourly Apps Script sync is not logged there (it has `sync_runs`).

### Managing accounts

**Normally from Panel Admin → Akaun** (admin only): add an account (name, email, role), change role, send a new
set-password link, remove access. Nobody types or sees anyone else's password: adding an account (or **Pautan kata
laluan baharu**) makes a **one-time link** `/admin/tetapkan/<token>`, valid 24 hours, which the admin sends with
**Hantar di Telegram** (Telegram's share page, no bot) or **Salin pautan**. The person sets their own password there and
is logged straight in. Only a SHA-256 hash of the link is stored (private table `account_setup_links`); making a new
link cancels that person's older unused one. Optional: with `RESEND_API_KEY` + `EMAIL_FROM` set, the link is also emailed. An admin can't
remove or downgrade their own account, so nobody locks themselves out. Step-by-step in Malay: [PANDUAN.md](../PANDUAN.md).

The **first admin** (or recovery when the only admin forgot the password) is done in Supabase:

1. Supabase → **Authentication → Users → Add user → Create new user**: email + password, tick **Auto Confirm User**.
2. **SQL Editor**:
   ```sql
   -- role: 'admin' (can edit) or 'pentadbir' (view only)
   insert into public.admins (user_id, role, name)
   select id, 'pentadbir', 'Pengetua' from auth.users where email = 'their@email';
   ```
3. Change a role: `update public.admins set role = 'admin' where user_id = (select id from auth.users where email = 'their@email');`
4. Remove access: `delete from public.admins where user_id = (select id from auth.users where email = 'their@email');`

Once, at the start: Supabase → **Authentication → Sign In / Providers → Email** → turn **off**
“Allow new users to sign up”.

---

## Setup

### 1. Supabase (database)

Project `<project-ref>`. From the repo folder (skip `supabase init`, the config already exists):

```bash
supabase login
supabase link --project-ref <project-ref>   # asks for the database password
supabase db push --linked --include-seed            # first time: migrations + starter data
supabase db push --linked                           # later: new migrations only
```

Then create your account as in [Managing accounts](#managing-accounts) with role `admin`.

**Later migrations are automatic.** The GitHub Action **Database migrations** (`.github/workflows/db-migrations.yml`)
runs `supabase db push` whenever a file in `supabase/migrations/` reaches `main` (or by hand: Actions → Run workflow).
It needs two secrets and one variable in GitHub → repo → Settings → Secrets and variables → Actions
(without them the job is skipped):

| Secret | Where to get it |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase → your avatar → **Account preferences → Access Tokens → Generate new token** (from an account that can manage the project) |
| `SUPABASE_DB_PASSWORD` | Supabase → project → **Project Settings → Database → Database password** (reset it there if nobody knows it; the site uses the API key, not this password) |
| `SUPABASE_PROJECT_ID` (variable, not secret) | the project ref, from the Supabase URL `https://<project-ref>.supabase.co` |

### 2. Vercel (web + API)

Import the repo with **Root Directory `./`** (services are read from `vercel.json`). Environment
variables (Production + Preview), then **Redeploy** after any change:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key (`sb_secret_…`) |
| `ADMIN_TOKEN` | long random string (`openssl rand -hex 32`), also used by the Apps Script |
| `SITE_URL` | optional: public address used in set-password links (default: the Vercel production domain) |
| `RESEND_API_KEY`, `EMAIL_FROM` | optional: also email set-password links through [Resend](https://resend.com) (`EMAIL_FROM` on a domain verified there). Without them, links are sent by Telegram from Panel Admin |

Don't set `API_URL`; the `web` service gets it from its binding. Check `/api/health` shows `"ok":true`
and an empty `missingEnv`.

### 2b. Visitor numbers (optional)

The web app includes Vercel Web Analytics (`@vercel/analytics`, no cookies; query strings are stripped except the
`?v=` view). Turn it on in Vercel → project → **Analytics → Enable**. Counts appear after the next deploy.

### 3. Google Apps Script (data sync + input checks)

See [google-apps-script/README.md](../google-apps-script/README.md): paste the `.gs` files, set
`API_URL` and `ADMIN_TOKEN`, run `previewSync`, `syncDashboard`, then `installHourlyTrigger`.

---

## API

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | public | Health check (`missingEnv`, `adminTokenSet`) |
| GET | `/api/dashboard` | public | Everything the home page shows (public data only) |
| GET | `/api/lab?week=N` | public / session | Lab timetable for a week (teacher names only with a session or `ADMIN_TOKEN`) |
| GET | `/api/admin/leave` | pentadbir+ | `{rows, total}`: leave summary per teacher (with `link_token`, `link_viewed_at`; missing links are created), and how many teachers the CUTI index has |
| POST | `/api/admin/leave/link` | admin, system | `{name}` → new personal link for that teacher (old one stops working); audited |
| GET | `/api/cuti/:token` | public (secret link) | One teacher's own statement; counts the view. 32-char token, nothing else reachable |
| POST | `/api/auth/login` | public | `{email,password}` → 7-day session token |
| POST | `/api/auth/logout` | pentadbir+ | Records the logout in the audit log |
| GET | `/api/admin/audit?type=&before=` | pentadbir+ | Log Audit, 100 newest; `type` = login, link, announcement, account, sync |
| GET | `/api/admin/me` | pentadbir+ | Who is logged in |
| GET | `/api/admin/overview` | pentadbir+ | Trackers with pending names, all charts, last 10 syncs |
| GET | `/api/admin/links`, `/api/admin/announcements` | pentadbir+ | Everything, including hidden |
| GET/POST | `/api/admin/accounts` | admin, system | List / add Panel Admin accounts (creates the Supabase Auth user; POST `{name,email,role}` returns a set-password link) |
| PATCH/DELETE | `/api/admin/accounts/:userId` | admin, system | Change role / remove access (not your own) |
| POST | `/api/admin/accounts/:userId/setup-link` | admin, system | New one-time set-password link (`{setup_url, expires_at, emailed}`); audited |
| GET | `/api/auth/setup/:token` | public (secret link) | Who a set-password link is for (name, email, role), if unused and unexpired |
| POST | `/api/auth/setup` | public (secret link) | `{token, password}` → sets the password, uses up the link, returns a 7-day session |
| POST | `/api/links`, `/api/admin/announcements` | admin, system | Create |
| PATCH/DELETE | `/api/admin/links/:id`, `/api/admin/announcements/:id` | admin, system | Edit / delete |
| POST | `/api/admin/sync-request` | pentadbir+ | "Sync sekarang": ask the Apps Script to sync within ~5 minutes |
| GET | `/api/sync/pending` | admin, system | Polled by the Apps Script: is a sync requested? last sync time |
| POST | `/api/sync` | admin, system | Apps Script data: `{trackers, tasks, metrics, breakdowns, lab?, leave?, leave_total?, links?, warnings}` |
| PUT | `/api/metrics/:key` | admin, system | Set one card value |
| POST/GET | `/api/import`, `/api/datasets/:name` | admin, system | Raw CSV import (private) |

Calls need `Authorization: Bearer <token>`: a session token from `/api/auth/login`, or `ADMIN_TOKEN`.

## Versions

- `web/versions.json` is the version history (newest first, in Malay). The site footer shows the current version.
- The private repo also builds a Malay PDF user guide with screenshots; it is left out here because the
  screenshots show staff.

## Local development

```bash
npm i -g vercel
vercel link && vercel env pull   # once
vercel dev                       # web + API together, like production
```

Without Vercel access, see [CONTRIBUTING.md](../CONTRIBUTING.md).
