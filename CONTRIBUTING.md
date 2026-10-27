# Working on the dashboard

The user guide is [PANDUAN.md](PANDUAN.md) (Bahasa Melayu); [docs/SETUP.md](docs/SETUP.md) → "Modules"
explains where each module's code lives.

## What you need

- **Node.js 20+** (`node -v`). Mac: `brew install node`
- **Git** and access to this repo
- For full local runs: **Vercel CLI** (`npm i -g vercel`) and your own Vercel project.
- For database changes: **Supabase CLI** (`brew install supabase/tap/supabase`) and your own
  Supabase project (`<project-ref>`).

Secrets (Supabase secret key, `ADMIN_TOKEN`) live only in Vercel. Never commit them or send
them in chat; `vercel env pull` fetches them for you.

## Run it on your computer

```bash
git clone https://github.com/7YMERA/dashboard-smksubang-portfolio
cd dashboard-smksubang-portfolio
cd api && npm install && cd ../web && npm install && cd ..
```

**Option A: same setup as production (recommended)**

```bash
vercel link        # choose your team → your project
vercel env pull    # writes .env.local with the real variables (git-ignored)
vercel dev         # http://localhost:3000, both services, /api routed like production
```

**Option B: without Vercel access**

```bash
cp api/.env.example api/.env       # fill in SUPABASE_SERVICE_ROLE_KEY and ADMIN_TOKEN (your own values)
cd api && npm run dev              # terminal 1: API on http://localhost:4000
cd web && npm run dev              # terminal 2: site on http://localhost:3000
```

**Check it works:** <http://localhost:3000/api/health> (Option A) or <http://localhost:4000/api/health>
(Option B) shows `"ok":true` and an empty `missingEnv`, and the home page lists the 7 links.

## Making a change

1. Pull first: `git pull`
2. Make the change and check it locally (see above). `cd web && npm run build` must pass.
3. Keep a change inside its module: `web/app/modules/<module>/`, `api/src/modules/<module>.js`,
   `google-apps-script/<Module>.gs`. Settings belong in `Config.gs`.
4. Update the docs in the **same commit**:
   - `docs/SETUP.md`: if setup, env vars, endpoints, roles or data sources changed
   - `PANDUAN.md`: if anything the teacher sees or does changed (plain Malay, no jargon)
5. Push. GitHub Actions builds both apps; Vercel deploys `main` automatically (pull requests get a
   preview URL).

## Changing the database

Add a new file in `supabase/migrations/` named `YYYYMMDDHHMMSS_what_it_does.sql`. Never edit one that
has already been applied. That's all: when the pull request is merged into `main`, the **Database migrations**
GitHub Action (`.github/workflows/db-migrations.yml`) applies it to the live database. Check it went green under
GitHub → Actions. Keep migrations additive (new tables/columns) so the site keeps working during the minute
between Vercel deploying and the migration landing.

By hand, if ever needed (needs the database password):

```bash
supabase link --project-ref <project-ref>   # once
supabase db push --linked
```



## Editing links and announcements (no code needed)

Log in at `/admin`. To get an account, ask the admin to add you in Panel Admin → Akaun (docs/SETUP.md → "Managing accounts"); you then log in with email + password.
Locally, the login uses the same Supabase project, so your real account works with `vercel dev`.

## Rules

- The site is public. Only totals and counts go to Supabase's public tables: no names, IC numbers,
  emails or individual form answers.
- Keep secrets out of git (`.env`, `.env.local` are ignored).
