/** MODULE Penghantaran: counts done / pending per tracker (config: TRACKERS). */
function buildTrackers_(ctx) {
  const out = [];
  TRACKERS.forEach((t) => {
    try {
      const columns = [t.nameColumn, t.statusColumn].concat(t.detailColumn ? [t.detailColumn] : []);
      const sheet = sheet_(ctx, t.sheetId, t.tab, columns);
      const rows = readTable_(sheet, columns)
        .filter((r) => hasLetters_(r[t.nameColumn]))
        .filter((r) => !EXEMPT_TEXT.test(String(r[t.statusColumn])));
      const pendingRe = t.pendingPattern || PENDING_TEXT;
      const pending = rows
        .filter((r) => isBlank_(r[t.statusColumn]) || pendingRe.test(String(r[t.statusColumn])))
        .map((r) => ({
          name: String(r[t.nameColumn]).trim().slice(0, 120),
          detail: t.detailColumn && !isBlank_(r[t.detailColumn]) ? String(r[t.detailColumn]).trim().slice(0, 200) : null,
        }));
      out.push({
        key: t.key, title: t.title, source: book_(ctx, t.sheetId).getName(),
        total: rows.length, done: rows.length - pending.length, pending: pending,
      });
    } catch (e) {
      warn_(ctx, 'Penghantaran: ' + t.title, e.message);
    }
  });
  return out;
}
