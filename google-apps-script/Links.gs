/** MODULE Pautan (optional): links from a sheet instead of /admin (config: LINKS). */
function buildLinks_(ctx) {
  const rows = book_(ctx, LINKS.sheetId).getSheetByName(LINKS.tab).getDataRange().getValues();
  return rows.slice(1)
    .filter((r) => r[0] && /^https?:\/\//.test(r[1]))
    .map((r) => ({ title: String(r[0]), url: String(r[1]), category: String(r[2] || 'Umum'),
                   description: r[3] ? String(r[3]) : undefined }));
}
