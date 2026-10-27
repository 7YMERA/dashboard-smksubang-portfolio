/** MODULE Analisis: averages, score bands, per-aspect and per-subject charts (config: ANALYTICS). */
function buildAnalytics_(ctx) {
  const metrics = [];
  const breakdowns = [];
  const book = book_(ctx, ANALYTICS.sheetId);
  const source = book.getName();
  const tab = (name) => {
    const s = book.getSheetByName(name);
    if (!s) throw new Error('Tab tidak dijumpai: ' + name);
    return s;
  };
  const part = (name, fn) => { try { fn(); } catch (e) { warn_(ctx, 'Analisis: ' + name, e.message); } };

  // Averages (cards) and KBAT distribution
  part('purata skor', () => {
    const sc = ANALYTICS.scores;
    const valid = (rows, col, where) => rows.map((r) => {
      const v = r[col];
      if (notAScore_(v) || !hasLetters_(r[sc.nameColumn])) return null;
      const n = toNumber_(v);
      if (n === null || n < 0 || n > 100) {
        warn_(ctx, where + ' baris ' + r.row, r[sc.nameColumn] + ': ' + col + ' = ' + v + ' (di luar 0–100, diabaikan)');
        return null;
      }
      return n;
    }).filter((n) => n !== null);

    const p1 = readTable_(tab(sc.p1Tab), [sc.nameColumn, sc.totalColumn, sc.kbatColumn]);
    const p1Scores = valid(p1, sc.totalColumn, sc.p1Tab);
    const kbat = valid(p1, sc.kbatColumn, sc.p1Tab);
    const kendiri = valid(readTable_(tab(sc.kendiriTab), [sc.nameColumn, sc.totalColumn]), sc.totalColumn, sc.kendiriTab);

    [['purata_pencerapan_1', 'Purata Pencerapan 1', p1Scores],
     ['purata_kendiri', 'Purata Pencerapan Kendiri', kendiri],
     ['purata_kbat', 'Purata Skor KBAT', kbat]].forEach(([key, label, xs], i) => {
      if (xs.length) metrics.push({ key: key, label: label, value: round1_(mean_(xs)), sort_order: i + 1 });
    });

    const bins = [['90–100', 90, 101], ['80–89', 80, 90], ['70–79', 70, 80], ['60–69', 60, 70], ['Bawah 60', 0, 60]];
    breakdowns.push({
      key: 'kbat_taburan_2026', title: 'Skor KBAT PdP 2026: taburan', source: source,
      items: bins.map(([label, lo, hi]) => ({ label: label, value: kbat.filter((n) => n >= lo && n < hi).length })),
    });
  });

  // Score-band summary tables (TARAF PDP)
  ANALYTICS.bands.forEach((b) => part(b.title, () => {
    const s = tab(b.tab);
    const labels = s.getRange(b.labelRange).getDisplayValues().map((r) => r[0]);
    const values = s.getRange(b.valueRange).getValues().map((r) => toNumber_(r[0]) || 0);
    let band = '';
    const bands = s.getRange(b.bandRange).getDisplayValues().map((r) => (band = r[0] || band));
    breakdowns.push({
      key: b.key, title: b.title, source: source,
      items: labels.map((l, i) => ({ label: (bands[i] ? bands[i] + ' ' : '') + l, value: values[i] })),
    });
  }));

  // Per-aspect averages, Kendiri vs Pencerapan 1 (public), and per-subject averages (admin)
  part('aspek', () => {
    const a = ANALYTICS.aspects;
    const kendiri = aspectTable_(ctx, tab(a.kendiriTab), a);
    const p1 = aspectTable_(ctx, tab(a.p1Tab), a);
    breakdowns.push({
      key: 'aspek_pdpc_2026', title: 'Purata mengikut aspek: Kendiri vs Pencerapan 1', source: source,
      series: ['Kendiri', 'Pencerapan 1'],
      items: p1.aspects.map((asp, i) => ({
        label: asp.label,
        values: [kendiri.aspects[i] ? kendiri.aspects[i].avg : null, asp.avg],
      })),
    });

    const groups = {};
    p1.rows.forEach((r) => {
      if (r.mean === null || !r.subject) return;
      (groups[r.subject] = groups[r.subject] || []).push(r.mean);
    });
    const items = Object.keys(groups)
      .filter((s) => groups[s].length >= ANALYTICS.minSubjectGroup)
      .map((s) => ({ label: s + ' (' + groups[s].length + ')', value: round1_(mean_(groups[s])) }))
      .sort((x, y) => y.value - x.value);
    breakdowns.push({
      key: 'subjek_pencerapan_1_2026', title: 'Purata Pencerapan 1 mengikut mata pelajaran', source: source,
      visibility: 'admin', items: items,
    });
  });

  return { metrics: metrics, breakdowns: breakdowns };
}

/** Reads an ANALISIS tab: aspect columns (4.1.1 …), their averages, and each teacher's mean + subject. */
function aspectTable_(ctx, sheet, cfg) {
  const values = sheet.getDataRange().getValues();
  const h = headerRow_(values, [cfg.nameColumn]);
  if (h < 0) throw new Error(sheet.getName() + ': lajur ' + cfg.nameColumn + ' tidak dijumpai');
  const head = values[h];
  const nameCol = findCol_(head, cfg.nameColumn);
  const subjCol = findCol_(head, cfg.subjectColumn);
  const cols = head.map((c, i) => (/^\d+\.\d+\.\d+$/.test(String(c).trim()) ? i : -1)).filter((i) => i >= 0);

  const sums = cols.map(() => []);
  const rows = [];
  for (let r = h + 1; r < values.length; r++) {
    const name = values[r][nameCol];
    if (!hasLetters_(name)) continue;
    const own = [];
    cols.forEach((c, k) => {
      const raw = values[r][c];
      if (notAScore_(raw)) return;
      const n = toNumber_(raw);
      if (n === null || n < 0 || n > 100) {
        warn_(ctx, sheet.getName() + ' baris ' + (r + 1), name + ': ' + head[c] + ' = ' + raw + ' (di luar 0–100, diabaikan)');
        return;
      }
      sums[k].push(n);
      own.push(n);
    });
    let subject = subjCol >= 0 ? norm_(values[r][subjCol]) : '';
    subject = ANALYTICS.subjectAliases[subject] || subject;
    rows.push({ mean: own.length ? mean_(own) : null, subject: subject });
  }
  const aspects = cols.map((c, k) => {
    const title = h > 0 ? String(values[h - 1][c] || '') : '';
    const short = title.replace(/^(GURU|MURID) SEBAGAI /i, '').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
    return { label: (String(head[c]).trim() + ' ' + short).trim().slice(0, 120), avg: sums[k].length ? round1_(mean_(sums[k])) : null };
  });
  return { aspects: aspects, rows: rows };
}

/** Empty, "belum respons", "CTG" … : no score yet, which is not a data error. */
function notAScore_(v) {
  return isBlank_(v) || PENDING_TEXT.test(String(v)) || EXEMPT_TEXT.test(String(v));
}
