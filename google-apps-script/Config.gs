/**
 * CONFIG: the only file you normally edit. Each section belongs to one dashboard module.
 * Spreadsheet ID = the long part of its URL: docs.google.com/spreadsheets/d/<ID>/edit
 */

const SHEET = {
  SEMAKAN: 'YOUR_SPREADSHEET_ID_SEMAKAN',     // SEMAKAN TINJAUAN KUTIPAN DATA
  PENCERAPAN_2026: 'YOUR_SPREADSHEET_ID_PENCERAPAN', // PENCERAPAN PDPC 2026
  SKS_2026: 'YOUR_SPREADSHEET_ID_SKS',     // SKS SMK SUBANG 2026 - KEKUATAN GURU
  CUTI: 'YOUR_SPREADSHEET_ID_CUTI',         // PENYATA CUTI GURU (index)
};

// ---- View: Jadual Makmal (computer lab timetable) --------------------------------------------
// The workbook is an Excel file (.xlsx) in Drive. Each sync checks if it changed; if so, it makes a temporary
// Google Sheets copy, reads tabs M1..M43, and deletes the copy. The original stays untouched.
const LAB = {
  fileId: 'YOUR_DRIVE_FILE_ID_LAB',  // JADUAL PENGGUNAAN MAKMAL KOMPUTER 2026.xlsx
  year: 2026,
  weekTab: /^M\d+$/i,                          // tabs named M1, M2, …
  days: ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'],
};

// ---- View: Penyata Cuti (leave summary, login only) ------------------------------------------
// Reads the index (one row per teacher with a "klik" link to their own statement), then each statement.
// 155 sheets is slow, so it runs once a day (or on "Sync sekarang"), in batches that fit Google's time limit.
const LEAVE = {
  indexSheetId: SHEET.CUTI,
  nameColumn: 'NAMA GURU',
  crkColumn: 'KELAYAKAN CRK',
  linkColumn: 'LINK PENYATA CUTI',
  yearTab: '2026',            // tab inside each teacher's statement (falls back to the first tab)
  refreshHours: 20,           // read all statements at most once per this many hours
  maxSecondsPerRun: 200,      // stop and continue next run before Google's 6-minute limit
};

// Words the sheets use instead of a score. They are not data errors:
//   PENDING_TEXT → the teacher hasn't submitted yet (counted as pending)
//   EXEMPT_TEXT  → not expected to submit, e.g. on leave (left out of the total)
const PENDING_TEXT = /belum/i;
const EXEMPT_TEXT = /^\s*(CTG|CUTI|CRK|CBS|CBP|BERSALIN|BERSARA|PINDAH|TIADA|N\/?A)\b/i;

// ---- Module: Tugasan (tasks & deadlines) ----------------------------------------------------
// Reads the task table. Title = the cell left of TARIKH AKHIR; its hyperlink becomes the task link.
const TASKS = {
  sheetId: SHEET.SEMAKAN,
  tab: '',                 // '' = first tab that has the headers below
  deadlineColumn: 'TARIKH AKHIR',
  statusColumn: 'STATUS',
};

// ---- Module: Penghantaran (who has / hasn't submitted) ----------------------------------------
// One row per teacher. A row is PENDING when statusColumn is empty or matches PENDING_TEXT (or the
// tracker's own pendingPattern), EXEMPT (left out) when it matches EXEMPT_TEXT, otherwise DONE. Column names match from the start, ignoring case ('NAMA' matches 'NAMA (Pada 1/8/2026)').
// Names are only shown in /admin; the public page only gets the counts.
const TRACKERS = [
  { key: 'sks_kekuatan_guru_2026', title: 'SKS Kekuatan Guru 2026', sheetId: SHEET.SKS_2026, tab: '',
    nameColumn: 'NAMA', statusColumn: 'KEKUATAN GURU' },
  { key: 'pencerapan_1_2026', title: 'Pencerapan 1 2026', sheetId: SHEET.PENCERAPAN_2026, tab: 'PENCERAPAN 1',
    nameColumn: 'NAMA', statusColumn: 'JUMLAH SKOR', detailColumn: 'PENCERAP' },
  { key: 'kbat_pdp_2026', title: 'Skor KBAT PdP 2026', sheetId: SHEET.PENCERAPAN_2026, tab: 'PENCERAPAN 1',
    nameColumn: 'NAMA', statusColumn: 'SKOR KBAT', detailColumn: 'PENCERAP' },
  { key: 'pencerapan_kendiri_2026', title: 'Pencerapan Kendiri 2026', sheetId: SHEET.PENCERAPAN_2026,
    tab: 'PENCERAPAN KENDIRI', nameColumn: 'NAMA', statusColumn: 'JUMLAH SKOR' },
];

// ---- Module: Analisis (charts & averages) ---------------------------------------------------
const ANALYTICS = {
  sheetId: SHEET.PENCERAPAN_2026,
  // Score-band tables (TARAF PDP) → bar charts
  bands: [
    { key: 'pencerapan_1', title: 'Pencerapan 1 2026: taburan skor', tab: 'PENCERAPAN 1',
      bandRange: 'B5:B12', labelRange: 'C5:C12', valueRange: 'D5:D12' },
    { key: 'pencerapan_kendiri', title: 'Pencerapan Kendiri 2026: taburan skor', tab: 'PENCERAPAN KENDIRI',
      bandRange: 'B5:B12', labelRange: 'C5:C12', valueRange: 'D5:D12' },
  ],
  // Per-aspect tables (4.1.1 … 4.6.1), compared Kendiri vs Pencerapan 1
  aspects: { kendiriTab: 'ANALISIS PENCERAPAN KENDIRI', p1Tab: 'ANALISIS PENCERAPAN 1',
             nameColumn: 'NAMA GURU', subjectColumn: 'MATA PELAJARAN' },
  // Averages and KBAT distribution from the PENCERAPAN 1 / KENDIRI lists
  scores: { p1Tab: 'PENCERAPAN 1', kendiriTab: 'PENCERAPAN KENDIRI', nameColumn: 'NAMA',
            totalColumn: 'JUMLAH SKOR', kbatColumn: 'SKOR KBAT' },
  // Subjects with fewer teachers than this are hidden from the per-subject chart (it's admin-only anyway)
  minSubjectGroup: 2,
  subjectAliases: { 'P.ISLAM': 'PENDIDIKAN ISLAM', 'P ISLAM': 'PENDIDIKAN ISLAM', 'RBT': 'REKA BENTUK TEKNOLOGI' },
};

// ---- Module: Pautan (optional) ---------------------------------------------------------------
// A sheet with columns title | url | category | description replaces the links on each sync.
// Leave '' to manage links in /admin instead (recommended).
const LINKS = { sheetId: '', tab: 'PAUTAN' };

// ---- Module: Pengesahan Input (stop mistakes at entry) ---------------------------------------
// auditInputs()     – REPORT ONLY: lists questions/columns without checks
// applyInputRules() – applies the rules below to the forms and sheets listed here
// Form ID = the long part of the form's EDIT URL: docs.google.com/forms/d/<ID>/edit
const INPUT_RULES = {
  forms: [
    { title: 'Kutipan Data SKPM Kualiti @ Sekolah-Kekuatan Guru', id: 'YOUR_FORM_ID_KEKUATAN_GURU' },
    { title: 'Markah Pencerapan Guru 2026 (KENDIRI)', id: 'YOUR_FORM_ID_KENDIRI' },
    // Add the Pencerapan 1 and KBAT PdP 2026 forms here (open each form → copy the ID from its edit URL):
    // { title: 'Pencerapan 1 2026', id: '...' },
    // { title: 'Skor KBAT PdP 2026', id: '...' },
  ],
  // Short-answer questions whose title matches this must be a number 0–100
  scoreQuestion: /(skor|markah|jumlah)/i,
  // Questions whose title matches this become required
  requiredQuestion: /(nama|skor|markah)/i,
  sheets: [
    // The task register: STATUS as a dropdown, TARIKH AKHIR must be a real date
    { sheetId: SHEET.SEMAKAN, tab: '', dropdowns: { 'STATUS': ['BUKA', 'TUTUP', 'SELESAI'] }, dates: ['TARIKH AKHIR'] },
    // Analysis tabs: aspect scores must be 0–100. (Not the PENCERAPAN 1 / KENDIRI lists: their score
    // columns hold "belum respons" / "CTG" on purpose.)
    { sheetId: SHEET.PENCERAPAN_2026, tab: 'ANALISIS PENCERAPAN 1', scores: ['4.'], header: 'NAMA GURU' },
    { sheetId: SHEET.PENCERAPAN_2026, tab: 'ANALISIS PENCERAPAN KENDIRI', scores: ['4.'], header: 'NAMA GURU' },
  ],
};
