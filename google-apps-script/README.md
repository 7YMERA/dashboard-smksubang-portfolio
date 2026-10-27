# Google Apps Script: data sync + input checks

Runs **inside the school Google account** (DELIMa), so school files are never shared outside. Every hour
it reads the sheets, then sends the dashboard: counts, deadlines, averages, and the names still pending
(names are stored privately and only shown in Panel Admin).

## Files (one per module)

| File | Module | Edit it? |
|---|---|---|
| `Config.gs` | All settings: sheet IDs, trackers, input rules | **Yes, the only one** |
| `Core.gs` | `checkSetup`, `previewSync`, `syncDashboard`, `installHourlyTrigger`, `checkSyncRequest`, helpers | no |
| `Tasks.gs` | Tugasan: reads SEMAKAN TINJAUAN KUTIPAN DATA | no |
| `Trackers.gs` | Penghantaran: done / pending per teacher list | no |
| `Analytics.gs` | Analisis: averages, bands, aspects, subjects | no |
| `Lab.gs` | Jadual Makmal: reads the .xlsx timetable through a temporary Google Sheets copy (only when the file changed) | no |
| `Leave.gs` | Penyata Cuti: index + each teacher's statement, once a day, in batches under Google's time limit | no |
| `Links.gs` | Pautan from a sheet (optional, off by default) | no |
| `Validation.gs` | Pengesahan Input: `auditInputs`, `applyInputRules` | no |
| `appsscript.json` | Permissions and Malaysia time zone | no |
| `pasang.sh`, `.claspignore` | Upload from Terminal with clasp (Option A) | no |

## Setup

### Option A: from Terminal (recommended, about 10 minutes)

Uploads all files in one go, and later updates are one command.

1. Turn on the Apps Script API (once): <https://script.google.com/home/usersettings> →
   **Google Apps Script API** → **On**. Use the account that owns the sheets.
2. In Terminal:
   ```bash
   brew install node
   npm install -g @google/clasp
   clasp login                     # browser opens: choose the MOE account that owns the sheets
   cd ~/dashboard-smksubang/google-apps-script
   bash pasang.sh                  # creates "Dashboard SMK Subang Sync" and uploads everything
   clasp open-script               # opens the project in the browser
   ```
   If `clasp login` says the app is blocked by your organisation (DELIMa can restrict this), use Option B.
3. Continue with **After uploading** below.

**Updating later** (after `git pull` brings new script changes): `cd google-apps-script && bash pasang.sh`.

### Option B: copy and paste in the browser

1. <https://script.google.com>, signed in with the account that owns the sheets → **New project**,
   named `Dashboard SMK Subang Sync`.
2. For each `.gs` file in the table above: **＋ → Script**, same name without `.gs`, paste the contents.
   Delete the empty `Code.gs` Google creates.
3. ⚙️ **Project Settings** → tick *Show "appsscript.json"* → paste `appsscript.json`.

### After uploading (both options)

1. ⚙️ **Project Settings → Script properties → Add script property**:
   - `API_URL` = `https://<your-app>.vercel.app`
   - `ADMIN_TOKEN` = the same value as in Vercel → Settings → Environment Variables
2. Back in the **Editor** (`< >`), open `Core.gs`, choose **`previewSync`** in the function menu at the top,
   then **Run**. Allow the permissions (*Advanced → Go to … (unsafe)* is normal for your own script).
   The log shows what would be sent (names hidden) and any data problems.
3. Choose **`syncDashboard`** → **Run**. The log should show `200 {...}`, and Panel Admin → Status Sync
   turns green.
4. Choose **`installHourlyTrigger`** → **Run** once. It now syncs every hour, and checks every 5 minutes
   for a **"Sync sekarang"** request from Panel Admin.
5. Choose **`checkSetup`** → **Run**. Every line should start with ✅; each ❌ says what to fix.

## Input checks (Pengesahan Input)

1. In `Config.gs` → `INPUT_RULES.forms`, add the **Pencerapan 1** and **KBAT PdP 2026** form IDs
   (open the form in edit mode; the ID is in `docs.google.com/forms/d/<ID>/edit`).
2. Run **`auditInputs`**. It **only reports**, for example "Skor: tiada semakan nombor 0–100 (akan ditambah)",
   or that a name question is free text (suggestion: change it to a dropdown of teacher names, by hand).
3. Run **`applyInputRules`** to add the checks. Safe to run again. It replaces any existing validation on
   those columns, and existing answers are not changed.

## Adding things

**Track another teacher list** (`TRACKERS` in `Config.gs`):

```js
{ key: 'nama_unik_2027', title: 'Nama dipaparkan', sheetId: '<spreadsheet id>', tab: '',
  nameColumn: 'NAMA', statusColumn: '<column that is filled when done>', pendingPattern: /belum/i },
```

A row is *pending* when the status cell is empty or says e.g. "belum respons" (`PENDING_TEXT`), and is left
out of the total when it says e.g. "CTG" / "CUTI" (`EXEMPT_TEXT`). Both are set at the top of `Config.gs`.
`tab: ''` finds the tab by its headers. Column names match from the start, ignoring case. If a task in
SEMAKAN links to that spreadsheet, the task card shows its progress automatically.

**Another spreadsheet ID** = the long part of its URL: `docs.google.com/spreadsheets/d/<ID>/edit`.

## Timetable and leave (v2.6)

- **Jadual Makmal** needs the **Drive** advanced service (declared in `appsscript.json`, enabled automatically by
  `pasang.sh`/clasp). The first run after updating asks for the new Drive permission: allow it.
- **Penyata Cuti** reads ~155 statements, so it runs at most once per `LEAVE.refreshHours` (20 h) and continues across runs
  if it takes longer than `LEAVE.maxSecondsPerRun`. "Sync sekarang" forces a fresh read.
- Settings: `LAB` and `LEAVE` at the top of `Config.gs`. Next year: change `LAB.fileId`, `LAB.year`, `LEAVE.yearTab`.

## Checking it works: `checkSetup()`

Run `checkSetup` any time. It checks, in order: the script properties; that the dashboard is up and accepts
`ADMIN_TOKEN`; when the last sync ran; that each spreadsheet opens; that the task table, every tracker and the
analysis tabs can be read (with counts); and that both triggers exist. It changes nothing.

## "Sync sekarang" (manual refresh)

Panel Admin → Status Sync → **Sync sekarang** records a request. `checkSyncRequest` (every 5 minutes, installed by
`installHourlyTrigger`) sees it and runs `syncDashboard`. Re-run `installHourlyTrigger` once after updating from an
older version, or the button will wait forever (Panel Admin warns after 15 minutes).

## When something goes wrong

- Every problem shows in **Panel Admin → Status Sync** and in the Apps Script log. One failing sheet
  never stops the others.
- *Tab tidak dijumpai* / *lajur tidak dijumpai* means a tab or column was renamed: update `Config.gs`.
- Status Sync shows "⚠ Lewat": open Apps Script → ⏰ **Triggers** and check `syncDashboard` is there
  (run `installHourlyTrigger` again).
