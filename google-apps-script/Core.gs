/**
 * CORE: entry points and shared helpers. Run these from the Apps Script editor:
 *   checkSetup()           – self-check: lists ✅/❌ for settings, connection, sheets, columns and triggers
 *   previewSync()          – logs what would be sent, sends nothing
 *   syncDashboard()        – sends everything to the dashboard API
 *   installHourlyTrigger() – run once: syncs every hour + answers "Sync sekarang" within ~5 minutes
 * Script properties needed: API_URL, ADMIN_TOKEN.
 */

function previewSync() {
  const p = buildPayload_(true);
  // A short summary (the full payload is too long for the log). Names are never printed.
  const lines = ['=== PRATONTON (tiada apa dihantar) ==='];
  (p.trackers || []).forEach((t) => lines.push('Penghantaran · ' + t.title + ': ' + t.done + '/' + t.total + ' hantar, ' + t.pending.length + ' belum'));
  const open = (p.tasks || []).filter((t) => t.status === 'BUKA');
  lines.push('Tugasan: ' + (p.tasks || []).length + ' (' + open.length + ' BUKA)');
  open.forEach((t) => lines.push('  · ' + t.title + ' — ' + (t.deadline || 'tiada tarikh') + (t.tracker_key ? ' [kemajuan: ' + t.tracker_key + ']' : '')));
  (p.metrics || []).forEach((m) => lines.push('Analisis · ' + m.label + ': ' + m.value));
  lines.push('Carta: ' + (p.breakdowns || []).map((b) => b.title).join(' | '));
  lines.push('Jadual Makmal: ' + (p.lab ? p.lab.weeks.length + ' minggu/makmal, ' + p.lab.slots.length + ' slot ditempah' : 'tiada perubahan'));
  lines.push('Penyata Cuti: ' + (p.leave ? p.leave.length + ' daripada ' + p.leave_total + ' guru dibaca dalam larian ini (nama disembunyikan)' : 'belum masa (sekali sehari)'));
  lines.push('', '=== ' + p.warnings.length + ' MASALAH DATA ===');
  p.warnings.forEach((w) => lines.push('⚠ ' + w.source + ': ' + w.message));
  Logger.log(lines.join('\n'));
}

function syncDashboard(force) {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty('API_URL');
  const token = props.getProperty('ADMIN_TOKEN');
  if (!apiUrl || !token) throw new Error('Set API_URL and ADMIN_TOKEN in Project Settings → Script properties');

  const res = UrlFetchApp.fetch(apiUrl.replace(/\/$/, '') + '/api/sync', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(buildPayload_(force === true)),
    muteHttpExceptions: true,
  });
  Logger.log(res.getResponseCode() + ' ' + res.getContentText());
  if (res.getResponseCode() >= 300) throw new Error('Sync failed: ' + res.getContentText());
}

function installHourlyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((t) => ['syncDashboard', 'checkSyncRequest'].indexOf(t.getHandlerFunction()) >= 0)
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncDashboard').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('checkSyncRequest').timeBased().everyMinutes(5).create();
  Logger.log('✅ Triggers: syncDashboard setiap jam, checkSyncRequest setiap 5 minit.');
}

/** Every 5 minutes: if someone pressed "Sync sekarang" in Panel Admin, sync now. A cheap call otherwise. */
function checkSyncRequest() {
  const res = api_('get', '/api/sync/pending');
  if (res.code !== 200) throw new Error('Tidak dapat semak permintaan sync: ' + res.code + ' ' + res.text);
  // A manual request re-reads everything, including the timetable and leave statements.
  if (JSON.parse(res.text).requested) syncDashboard(true);
}

/** Self-check. Read the log: every line should start with ✅. */
function checkSetup() {
  const out = [];
  const ok = (msg) => out.push('✅ ' + msg);
  const bad = (msg) => out.push('❌ ' + msg);
  const props = PropertiesService.getScriptProperties();

  // 1. Settings
  const apiUrl = props.getProperty('API_URL');
  const token = props.getProperty('ADMIN_TOKEN');
  apiUrl ? ok('API_URL: ' + apiUrl) : bad('API_URL belum ditetapkan (Project Settings → Script properties)');
  token ? ok('ADMIN_TOKEN ada (' + token.length + ' aksara)') : bad('ADMIN_TOKEN belum ditetapkan');

  // 2. Dashboard reachable, configured, and accepts our token
  if (apiUrl) {
    try {
      const h = UrlFetchApp.fetch(apiUrl.replace(/\/$/, '') + '/api/health', { muteHttpExceptions: true });
      const health = JSON.parse(h.getContentText());
      health.ok ? ok('Dashboard hidup (/api/health)') : bad('Dashboard tidak lengkap: ' + JSON.stringify(health.missingEnv));
    } catch (e) { bad('Dashboard tidak dapat dihubungi: ' + e.message); }
    if (token) {
      const p = api_('get', '/api/sync/pending');
      if (p.code === 200) {
        const info = JSON.parse(p.text);
        ok('ADMIN_TOKEN diterima oleh dashboard');
        info.last_sync_at ? ok('Sync terakhir: ' + info.last_sync_at) : bad('Belum pernah sync: jalankan syncDashboard');
        if (info.requested) out.push('⏳ Ada permintaan "Sync sekarang" oleh ' + info.requested_by + ' (akan dijalankan)');
      } else if (p.code === 401) bad('ADMIN_TOKEN tidak sama dengan Vercel (ditolak 401)');
      else bad('Semakan token gagal: ' + p.code + ' ' + p.text.slice(0, 120));
    }
  }

  // 3. Sheets, tabs and columns (same checks the sync uses)
  const ctx = { warnings: [], books: {} };
  Object.keys(SHEET).forEach((k) => {
    try { ok('Sheet ' + k + ': ' + book_(ctx, SHEET[k]).getName()); }
    catch (e) { bad('Sheet ' + k + ' tidak dapat dibuka (' + e.message + ')'); }
  });
  try {
    const tasks = buildTasks_(ctx, []);
    ok('Tugasan: ' + tasks.length + ' baris (' + tasks.filter((t) => t.status === 'BUKA').length + ' BUKA)');
  } catch (e) { bad('Tugasan: ' + e.message); }
  const trackers = buildTrackers_(ctx);
  TRACKERS.forEach((t) => {
    const r = trackers.find((x) => x.key === t.key);
    r ? ok('Penghantaran ' + t.title + ': ' + r.done + '/' + r.total) : bad('Penghantaran ' + t.title + ': tidak dapat dibaca');
  });
  try {
    const a = buildAnalytics_(ctx);
    ok('Analisis: ' + a.metrics.length + ' purata, ' + a.breakdowns.length + ' carta');
  } catch (e) { bad('Analisis: ' + e.message); }
  try {
    const f = DriveApp.getFileById(LAB.fileId);
    ok('Jadual Makmal: ' + f.getName() + ' (dikemas kini ' + f.getLastUpdated().toLocaleDateString() + ')');
    if (typeof Drive === 'undefined') bad('Jadual Makmal: perkhidmatan Drive belum aktif (pasang semula dengan pasang.sh)');
  } catch (e) { bad('Jadual Makmal: ' + e.message); }
  try {
    const idx = readLeaveIndex_(ctx);
    const byLink = idx.filter((t) => t.via === 'pautan').length;
    const byName = idx.filter((t) => t.via === 'nama');
    const missing = idx.filter((t) => !t.id && !t.notSearched);
    const later = idx.filter((t) => t.notSearched).length;
    ok('Penyata Cuti: ' + idx.length + ' guru dalam indeks · ' + byLink + ' melalui pautan "klik" · ' + byName.length + ' dijumpai mengikut nama fail');
    if (byName.length) Logger.log('   ℹ contoh pautan yang tidak dapat dibaca: ' + byName.slice(0, 3).map((t) => '"' + t.raw + '"').join(', '));
    if (later) ok('Penyata Cuti: ' + later + ' guru belum dicari (had masa 90 saat). Jalankan checkSetup sekali lagi untuk sambung.');
    if (missing.length) bad('Penyata Cuti: ' + missing.length + ' guru tiada penyata (pautan tidak boleh dibaca, tiada Google Sheet sama nama): '
      + missing.slice(0, 5).map((t) => t.name).join(', ') + (missing.length > 5 ? ', …' : ''));
  } catch (e) { bad('Penyata Cuti: ' + e.message); }
  ctx.warnings.filter((w) => /Gagal|tidak dijumpai|tidak dapat/.test(w.message))
    .forEach((w) => bad(w.source + ': ' + w.message));

  // 4. Triggers
  const handlers = ScriptApp.getProjectTriggers().map((t) => t.getHandlerFunction());
  handlers.indexOf('syncDashboard') >= 0 ? ok('Trigger setiap jam (syncDashboard)') : bad('Tiada trigger setiap jam: jalankan installHourlyTrigger');
  handlers.indexOf('checkSyncRequest') >= 0 ? ok('Trigger "Sync sekarang" (checkSyncRequest)') : bad('Butang "Sync sekarang" belum aktif: jalankan installHourlyTrigger');

  const fails = out.filter((l) => l.indexOf('❌') === 0).length;
  out.push('', fails ? '⚠ ' + fails + ' perkara perlu dibetulkan (lihat ❌ di atas).' : '🎉 Semua OK.');
  Logger.log(out.join('\n'));
  return fails;
}

function api_(method, path, body) {
  const props = PropertiesService.getScriptProperties();
  const res = UrlFetchApp.fetch(String(props.getProperty('API_URL') || '').replace(/\/$/, '') + path, {
    method: method, contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + props.getProperty('ADMIN_TOKEN') },
    payload: body ? JSON.stringify(body) : undefined,
  });
  return { code: res.getResponseCode(), text: res.getContentText() };
}

/** Runs every module. A failing module becomes a warning instead of stopping the others. */
function buildPayload_(force) {
  const ctx = { warnings: [], books: {} };
  const payload = { warnings: ctx.warnings };
  const step = (name, fn) => {
    try { fn(); } catch (e) { warn_(ctx, name, 'Gagal: ' + e.message); }
  };
  step('Penghantaran', () => { payload.trackers = buildTrackers_(ctx); });
  step('Tugasan', () => { payload.tasks = buildTasks_(ctx, payload.trackers || []); });
  step('Analisis', () => {
    const a = buildAnalytics_(ctx);
    payload.metrics = a.metrics;
    payload.breakdowns = a.breakdowns;
  });
  step('Jadual Makmal', () => { const lab = buildLab_(ctx, force); if (lab) payload.lab = lab; });
  step('Penyata Cuti', () => {
    const leave = buildLeave_(ctx, force);
    if (leave && leave.length) payload.leave = leave;
    if (ctx.leaveTotal) payload.leave_total = ctx.leaveTotal;
  });
  if (LINKS.sheetId) step('Pautan', () => { payload.links = buildLinks_(ctx); });
  return payload;
}

// ---- Helpers ----------------------------------------------------------------------------------

function warn_(ctx, source, message) {
  ctx.warnings.push({ source: String(source).slice(0, 200), message: String(message).slice(0, 500) });
}

function book_(ctx, id) {
  if (!ctx.books[id]) ctx.books[id] = SpreadsheetApp.openById(id);
  return ctx.books[id];
}

const norm_ = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().toUpperCase();

/** The tab by name, or ('' name) the first tab whose data contains all `columns` in one row. */
function sheet_(ctx, sheetId, tab, columns) {
  const book = book_(ctx, sheetId);
  if (tab) {
    const s = book.getSheetByName(tab);
    if (!s) throw new Error('Tab tidak dijumpai: ' + tab);
    return s;
  }
  const found = book.getSheets().find((s) => headerRow_(s.getDataRange().getValues(), columns) >= 0);
  if (!found) throw new Error('Tiada tab dengan lajur: ' + columns.join(', '));
  return found;
}

/** Column index in a header row: an exact name wins, otherwise the first header starting with it. */
function findCol_(headerRow, column) {
  const want = norm_(column);
  const exact = headerRow.findIndex((cell) => norm_(cell) === want);
  return exact >= 0 ? exact : headerRow.findIndex((cell) => norm_(cell).startsWith(want));
}

/** Index of the first row that has a cell starting with each column name, or -1. */
function headerRow_(values, columns) {
  return values.findIndex((row) => columns.every((c) => row.some((cell) => norm_(cell).startsWith(norm_(c)))));
}

/** Reads a list under a header row: [{ row: sheetRowNumber, [column]: value }] for each wanted column. */
function readTable_(sheet, columns) {
  const values = sheet.getDataRange().getValues();
  const h = headerRow_(values, columns);
  if (h < 0) throw new Error(sheet.getName() + ': lajur tidak dijumpai: ' + columns.join(', '));
  const idx = {};
  columns.forEach((c) => { idx[c] = findCol_(values[h], c); });
  return values.slice(h + 1).map((r, i) => {
    const o = { row: h + i + 2 };
    columns.forEach((c) => { o[c] = r[idx[c]]; });
    return o;
  });
}

const hasLetters_ = (v) => /[A-Za-z]/.test(String(v || ''));
const isBlank_ = (v) => v === '' || v === null || v === undefined || String(v).trim() === '' || String(v).trim() === '-';

function toNumber_(v) {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

const round1_ = (n) => Math.round(n * 10) / 10;
const mean_ = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Date cell or 'd/m/yyyy' text → 'YYYY-MM-DD', else null. */
function isoDate_(v) {
  let d = null;
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) d = v;
  else {
    const m = String(v || '').trim().match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (m) d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }
  if (!d) return null;
  const pad = (n) => (n < 10 ? '0' : '') + n;
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}
