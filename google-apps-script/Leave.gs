/** VIEW Penyata Cuti: leave summary per teacher (config: LEAVE). Login-only on the dashboard. */
function buildLeave_(ctx, force) {
  const props = PropertiesService.getScriptProperties();
  const last = Number(props.getProperty('LEAVE_DONE_AT') || 0);
  let cursor = Number(props.getProperty('LEAVE_CURSOR') || 0);
  const fresh = Date.now() - last < LEAVE.refreshHours * 3600 * 1000;
  if (fresh && cursor === 0 && !force) return null; // read recently, nothing in progress

  const index = readLeaveIndex_(ctx);
  ctx.leaveTotal = index.length; // the dashboard shows "x of y teachers read" while batches are in progress
  const started = Date.now();
  const out = [];
  for (; cursor < index.length; cursor++) {
    if ((Date.now() - started) / 1000 > LEAVE.maxSecondsPerRun) break; // continue next run
    const t = index[cursor];
    try { out.push(readLeaveStatement_(t)); }
    catch (e) { warn_(ctx, 'Penyata Cuti: ' + t.name, e.message); }
  }
  if (cursor >= index.length) { props.setProperty('LEAVE_DONE_AT', String(Date.now())); cursor = 0; }
  props.setProperty('LEAVE_CURSOR', String(cursor));
  return out;
}

function readLeaveIndex_(ctx) {
  const sheet = sheet_(ctx, LEAVE.indexSheetId, '', [LEAVE.nameColumn, LEAVE.linkColumn]);
  const range = sheet.getDataRange();
  const values = range.getValues();
  const rich = range.getRichTextValues();
  const formulas = range.getFormulas();
  const h = headerRow_(values, [LEAVE.nameColumn, LEAVE.linkColumn]);
  const nameCol = findCol_(values[h], LEAVE.nameColumn);
  const crkCol = findCol_(values[h], LEAVE.crkColumn);
  const linkCol = findCol_(values[h], LEAVE.linkColumn);
  const list = [];
  for (let r = h + 1; r < values.length; r++) {
    const name = String(values[r][nameCol] || '').trim();
    if (!hasLetters_(name)) continue;
    const url = linkOf_(rich[r][linkCol], formulas[r][linkCol]) || (/^https?:\/\//.test(String(values[r][linkCol])) ? String(values[r][linkCol]) : null);
    const id = driveId_(url);
    list.push({ name: name, position: list.length + 1, crk: crkCol >= 0 ? toNumber_(values[r][crkCol]) : null, url: url, id: id,
      via: id ? 'pautan' : null, raw: id ? null : (formulas[r][linkCol] || rawLink_(rich[r][linkCol]) || String(values[r][linkCol] || '')).slice(0, 120) });
  }
  // A "klik" whose link can't be read: the statement is a Google Sheet named exactly after the teacher, so find it
  // by name. Found ids are remembered (one Script Property per teacher), so Drive is searched once per teacher.
  const props = PropertiesService.getScriptProperties();
  const folders = {};
  list.filter((t) => t.id).slice(0, 5).forEach((t) => {
    try { const it = DriveApp.getFileById(t.id).getParents(); while (it.hasNext()) folders[it.next().getId()] = true; } catch (e) {}
  });
  const searchUntil = Date.now() + 90 * 1000; // first run only; the rest are found next run
  list.filter((t) => !t.id).forEach((t) => {
    const key = 'LEAVE_ID_' + t.name.slice(0, 80);
    const cached = props.getProperty(key);
    if (cached) { t.id = cached; t.via = 'nama'; }
    else if (Date.now() < searchUntil) {
      t.id = findSheetByName_(t.name, folders);
      if (t.id) { t.via = 'nama'; props.setProperty(key, t.id); }
    } else t.notSearched = true;
    if (t.id && !t.url) t.url = 'https://docs.google.com/spreadsheets/d/' + t.id + '/edit';
  });
  return list;
}

/** Whatever link a cell holds, even one that is not a web address (e.g. "#gid=…"), for checkSetup's report. */
function rawLink_(rt) {
  if (!rt || !rt.getLinkUrl) return '';
  const run = rt.getRuns ? rt.getRuns().find((x) => x.getLinkUrl()) : null;
  return rt.getLinkUrl() || (run ? run.getLinkUrl() : '') || '';
}

/** The Drive file id in any Google link: /d/<id>/…, ?id=<id>, open?id=<id>. */
function driveId_(url) {
  if (!url) return null;
  const m = String(url).match(/\/d\/([A-Za-z0-9_-]{20,})/) || String(url).match(/[?&]id=([A-Za-z0-9_-]{20,})/);
  return m ? m[1] : null;
}

/** A Google Sheet titled exactly `name` (not in the bin); prefers one in the same folder as the other statements. */
function findSheetByName_(name, folders) {
  const it = DriveApp.getFilesByName(name);
  let best = null;
  while (it.hasNext()) {
    const f = it.next();
    if (f.isTrashed() || f.getMimeType() !== MimeType.GOOGLE_SHEETS) continue;
    let inFolder = false;
    const ps = f.getParents();
    while (ps.hasNext()) if (folders[ps.next().getId()]) inFolder = true;
    const score = (inFolder ? 2e13 : 0) + f.getLastUpdated().getTime();
    if (!best || score > best.score) best = { id: f.getId(), score: score };
  }
  return best ? best.id : null;
}

/**
 * One teacher's statement. Each section: "JENIS CUTI : <type>", a header row BIL | TARIKH CUTI | TEMPOH | BAKI …,
 * then (merged header cells leave it otherwise empty) a row with the entitlement in the column after TEMPOH,
 * then entry rows: a date in TARIKH CUTI and the number of days in TEMPOH.
 */
function readLeaveStatement_(t) {
  if (!t.id) throw new Error('Penyata tidak dijumpai: tiada pautan yang boleh dibaca dalam lajur ' + LEAVE.linkColumn + ', dan tiada Google Sheet bernama "' + t.name + '"');
  const book = SpreadsheetApp.openById(t.id);
  const sheet = book.getSheetByName(LEAVE.yearTab) || book.getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues();
  const types = [];
  let cur = null, tarikhCol = -1, tempohCol = -1, expectEntitlement = false;
  values.forEach((row) => {
    const cells = row.map((c) => String(c).replace(/\s+/g, ' ').trim());
    const typeCell = cells.find((c) => /JENIS CUTI\s*:/i.test(c));
    if (typeCell) {
      cur = { type: typeCell.replace(/.*JENIS CUTI\s*:\s*/i, '').toUpperCase(), used: 0, entitled: null };
      types.push(cur); tarikhCol = tempohCol = -1; expectEntitlement = false; return;
    }
    if (!cur) return;
    const ti = cells.findIndex((c) => /^TARIKH CUTI$/i.test(c));
    if (ti >= 0) { tarikhCol = ti; tempohCol = cells.findIndex((c) => /^TEMPOH$/i.test(c)); expectEntitlement = true; return; }
    if (tarikhCol < 0 || tempohCol < 0) return;
    if (expectEntitlement) {
      expectEntitlement = false;
      const e = toNumber_(cells[tempohCol + 1]);
      if (!cells[tarikhCol] && e !== null) { cur.entitled = (cur.entitled || 0) + e; return; }
    }
    if (cells[tarikhCol]) {
      const days = toNumber_(cells[tempohCol]);
      if (days !== null) cur.used += days;
    }
  });
  const crk = types.find((x) => /REHAT KHAS/.test(x.type));
  return {
    name: t.name.slice(0, 120), position: t.position, crk_entitled: t.crk !== null ? t.crk : (crk ? crk.entitled : null),
    crk_used: crk ? crk.used : 0, types: types.slice(0, 20), sheet_url: t.url, year: Number(LEAVE.yearTab) || null,
  };
}
