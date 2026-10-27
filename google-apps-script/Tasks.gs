/** MODULE Tugasan: the task table from SEMAKAN TINJAUAN KUTIPAN DATA (config: TASKS). */
function buildTasks_(ctx, trackers) {
  const sheet = sheet_(ctx, TASKS.sheetId, TASKS.tab, [TASKS.deadlineColumn, TASKS.statusColumn]);
  const range = sheet.getDataRange();
  const values = range.getValues();
  const rich = range.getRichTextValues();
  const formulas = range.getFormulas();
  const h = headerRow_(values, [TASKS.deadlineColumn, TASKS.statusColumn]);
  const dCol = findCol_(values[h], TASKS.deadlineColumn);
  const sCol = findCol_(values[h], TASKS.statusColumn);
  const tCol = dCol - 1; // the title sits just left of TARIKH AKHIR
  const today = isoDate_(new Date());

  // A task whose link points at a tracked spreadsheet shows that tracker's progress.
  const trackerBySheet = {};
  TRACKERS.forEach((t) => { if (!trackerBySheet[t.sheetId]) trackerBySheet[t.sheetId] = t.key; });
  const known = {};
  trackers.forEach((t) => { known[t.key] = true; });

  const tasks = [];
  for (let r = h + 1; r < values.length; r++) {
    const title = String(values[r][tCol] || '').trim();
    if (!title) continue;
    const link = linkOf_(rich[r][tCol], formulas[r][tCol]);
    const deadline = isoDate_(values[r][dCol]);
    const status = norm_(values[r][sCol]) || null;
    const where = 'Tugasan baris ' + (r + 1) + ' (' + title.slice(0, 60) + ')';
    if (!deadline && !isBlank_(values[r][dCol])) warn_(ctx, where, 'Tarikh akhir tidak dapat dibaca: ' + values[r][dCol]);
    if (status === 'BUKA' && deadline && deadline < today) {
      warn_(ctx, where, 'Status masih BUKA tetapi tarikh akhir (' + deadline + ') sudah lepas. Tarikh salah atau status perlu dikemas kini?');
    }
    const sheetId = link && (link.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/) || [])[1];
    const trackerKey = sheetId && trackerBySheet[sheetId];
    tasks.push({
      title: title.slice(0, 300),
      url: link || null,
      deadline: deadline,
      status: status,
      tracker_key: trackerKey && known[trackerKey] ? trackerKey : null,
    });
  }
  return tasks;
}

/** URL from a rich-text link or a =HYPERLINK("url", …) formula, else null. */
function linkOf_(richText, formula) {
  let url = richText && richText.getLinkUrl ? richText.getLinkUrl() : null;
  if (!url && richText && richText.getRuns) {
    const run = richText.getRuns().find((x) => x.getLinkUrl());
    url = run ? run.getLinkUrl() : null;
  }
  if (!url && formula) url = (String(formula).match(/HYPERLINK\(\s*"([^"]+)"/i) || [])[1] || null;
  return url && /^https?:\/\//.test(url) ? url : null;
}
