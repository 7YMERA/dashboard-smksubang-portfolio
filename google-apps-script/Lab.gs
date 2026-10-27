/** VIEW Jadual Makmal: computer lab timetable from the .xlsx workbook (config: LAB). */
function buildLab_(ctx, force) {
  const props = PropertiesService.getScriptProperties();
  const file = DriveApp.getFileById(LAB.fileId);
  const modified = String(file.getLastUpdated().getTime());
  if (!force && props.getProperty('LAB_MODIFIED') === modified) return null; // unchanged: keep what the dashboard has

  // Temporary Google Sheets copy of the Excel file (Drive advanced service), deleted afterwards.
  const copy = Drive.Files.copy({ name: 'tmp-jadual-dashboard', mimeType: MimeType.GOOGLE_SHEETS }, LAB.fileId);
  try {
    const book = SpreadsheetApp.openById(copy.id);
    const weeks = []; const slots = [];
    book.getSheets().filter((s) => LAB.weekTab.test(s.getName().trim())).forEach((sheet) => {
      try { parseLabSheet_(sheet, weeks, slots); }
      catch (e) { warn_(ctx, 'Jadual Makmal ' + sheet.getName(), e.message); }
    });
    if (!weeks.length) throw new Error('Tiada tab minggu (M1, M2, …) yang dapat dibaca');
    props.setProperty('LAB_MODIFIED', modified);
    return { weeks: weeks, slots: slots };
  } finally {
    Drive.Files.remove(copy.id);
  }
}

/** One tab = one week; it may hold several labs (MAKMAL KOMPUTER A, B…). */
function parseLabSheet_(sheet, weeks, slots) {
  const range = sheet.getDataRange();
  const values = range.getDisplayValues();
  // Merged cells (a booking over 2+ periods) only hold text in their first cell: remember the span.
  const spans = {};
  range.getMergedRanges().forEach((m) => {
    spans[(m.getRow() - 1) + ':' + (m.getColumn() - 1)] = m.getNumColumns();
  });

  let label = '', week = Number(sheet.getName().replace(/\D/g, '')), lab = null, header = null;
  for (let r = 0; r < values.length; r++) {
    const row = values[r].map((c) => String(c).replace(/\s+/g, ' ').trim());
    const first = row.find((c) => c) || '';
    const weekCell = row.find((c) => /^MINGGU\s+\d+/i.test(c));
    if (weekCell) label = weekCell;
    if (/^MAKMAL\b/i.test(first)) { lab = first.toUpperCase(); header = null; continue; }

    // Period header row: cells like "1 7.30 - 8.05"; "SESI PETANG" switches session; "REHAT" is a break.
    if (lab && !header && row.some((c) => /^\d+\s+\d{1,2}[.:]\d{2}/.test(c))) {
      header = []; let session = 'pagi';
      row.forEach((c, col) => {
        if (/SESI PETANG/i.test(c)) { session = 'petang'; return; }
        const m = c.match(/^(\d+)\s+(.+)$/);
        if (m) header.push({ col: col, label: m[1], time: m[2], session: session });
        else if (/^REHAT/i.test(c)) header.push({ col: col, label: 'REHAT', time: c.replace(/^REHAT\s*/i, ''), session: session });
      });
      const dates = labDates_(label);
      weeks.push({ week: week, lab: lab, label: label || ('MINGGU ' + week), start_date: dates[0], end_date: dates[1],
        days: LAB.days, periods: header.map((h) => ({ label: h.label, time: h.time, session: h.session })) });
      continue;
    }

    const day = LAB.days.find((d) => d === first.toUpperCase());
    if (lab && header && day) {
      header.forEach((h, p) => {
        const raw = row[h.col];
        if (!raw || h.label === 'REHAT') return;
        const span = spans[r + ':' + h.col] || 1;
        const parts = splitBooking_(raw);
        // span in periods: count header columns covered by the merged range
        const covered = header.filter((x) => x.col >= h.col && x.col < h.col + span).length || 1;
        slots.push({ week: week, lab: lab, day: day, period: p, span: covered,
          subject: parts.subject, class_name: parts.className, teacher: parts.teacher, raw: raw.slice(0, 200) });
      });
    }
  }
}

/** "ASK 3 MAWAR AMINAH" → subject ASK, class 3 MAWAR, teacher AMINAH. "SL ALI" → subject SL, teacher ALI. */
function splitBooking_(raw) {
  const t = raw.replace(/\s+/g, ' ').trim();
  let m = t.match(/^(\S+)\s+(\d\s*[A-Za-z]+)\s+(.+)$/);
  if (m) return { subject: m[1], className: m[2].toUpperCase(), teacher: m[3] };
  m = t.match(/^(\S+)\s+(\d\s*[A-Za-z]+)$/);
  if (m) return { subject: m[1], className: m[2].toUpperCase(), teacher: null };
  m = t.match(/^(\S+)\s+([A-Za-z].*)$/);
  if (m) return { subject: m[1], className: null, teacher: m[2] };
  return { subject: t.slice(0, 60), className: null, teacher: null };
}

/** "MINGGU 38 (26/10 - 30/10)" → ['2026-10-26', '2026-10-30'] */
function labDates_(label) {
  const m = String(label).match(/\((\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})\)/);
  if (!m) return [null, null];
  const iso = (d, mo) => isoDate_(new Date(LAB.year, Number(mo) - 1, Number(d)));
  return [iso(m[1], m[2]), iso(m[3], m[4])];
}
