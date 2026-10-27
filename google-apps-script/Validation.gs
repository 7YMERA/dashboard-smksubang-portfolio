/**
 * MODULE Pengesahan Input: stop wrong data at entry (config: INPUT_RULES).
 *   auditInputs()     – report only, changes nothing. Read the log first.
 *   applyInputRules() – adds the checks. Safe to run again; existing answers are not changed.
 *
 * Forms: score questions (short answer) only accept a number 0–100; name/score questions become required.
 * Sheets: dropdowns (e.g. STATUS), date-only columns (TARIKH AKHIR), 0–100 score cells.
 *         Wrong input is REJECTED with a help message, so the 9,286.00-type mistake can't be typed.
 */

function auditInputs() {
  const lines = [];
  INPUT_RULES.forms.forEach((f) => {
    try {
      const form = FormApp.openById(f.id);
      formItems_(form).forEach((it) => {
        const t = it.getTitle();
        if (INPUT_RULES.scoreQuestion.test(t) && it.getType() === FormApp.ItemType.TEXT) {
          lines.push('BORANG ' + f.title + ' → "' + t + '": tiada semakan nombor 0–100 (akan ditambah)');
        }
        if (INPUT_RULES.requiredQuestion.test(t) && !it.isRequired()) {
          lines.push('BORANG ' + f.title + ' → "' + t + '": tidak wajib (akan dijadikan wajib)');
        }
        if (/nama/i.test(t) && it.getType() === FormApp.ItemType.TEXT) {
          lines.push('BORANG ' + f.title + ' → "' + t + '": nama ditaip bebas. Cadangan: tukar kepada senarai pilihan (dropdown) nama guru supaya ejaan sama dengan senarai.');
        }
      });
    } catch (e) {
      lines.push('BORANG ' + f.title + ': tidak dapat dibuka (' + e.message + ')');
    }
  });
  INPUT_RULES.sheets.forEach((s) => {
    try {
      const plan = sheetPlan_(s);
      plan.forEach((p) => lines.push('SHEET ' + plan.sheetName + ' → ' + p.describe + ' (baris ' + p.firstRow + ' ke bawah)'));
    } catch (e) {
      lines.push('SHEET ' + (s.tab || s.sheetId) + ': ' + e.message);
    }
  });
  Logger.log(lines.length ? lines.join('\n') : 'Semua sudah ada semakan.');
  return lines;
}

function applyInputRules() {
  INPUT_RULES.forms.forEach((f) => {
    const form = FormApp.openById(f.id);
    formItems_(form).forEach((it) => {
      const t = it.getTitle();
      if (INPUT_RULES.scoreQuestion.test(t) && it.getType() === FormApp.ItemType.TEXT) {
        it.asTextItem().setValidation(FormApp.createTextValidation()
          .setHelpText('Masukkan nombor antara 0 hingga 100 (contoh: 92.86). Guna titik, bukan koma.')
          .requireNumberBetween(0, 100).build());
      }
      if (INPUT_RULES.requiredQuestion.test(t) && !it.isRequired()) setRequired_(it);
    });
  });
  INPUT_RULES.sheets.forEach((s) => sheetPlan_(s).forEach((p) => p.apply()));
  Logger.log('Selesai. Jalankan auditInputs() sekali lagi untuk semak.');
}

function formItems_(form) {
  const kinds = [FormApp.ItemType.TEXT, FormApp.ItemType.PARAGRAPH_TEXT, FormApp.ItemType.LIST,
                 FormApp.ItemType.MULTIPLE_CHOICE, FormApp.ItemType.SCALE, FormApp.ItemType.DATE];
  return form.getItems().filter((it) => kinds.indexOf(it.getType()) >= 0);
}

function setRequired_(it) {
  const typed = {
    TEXT: () => it.asTextItem(), PARAGRAPH_TEXT: () => it.asParagraphTextItem(), LIST: () => it.asListItem(),
    MULTIPLE_CHOICE: () => it.asMultipleChoiceItem(), SCALE: () => it.asScaleItem(), DATE: () => it.asDateItem(),
  }[String(it.getType())];
  if (typed) typed().setRequired(true);
}

/** Works out which ranges get which rule, so audit and apply always agree. */
function sheetPlan_(cfg) {
  const ctx = { warnings: [], books: {} };
  const wanted = [].concat(Object.keys(cfg.dropdowns || {}), cfg.dates || [], cfg.header ? [cfg.header] : (cfg.scores || []));
  const sheet = sheet_(ctx, cfg.sheetId, cfg.tab, wanted);
  const values = sheet.getDataRange().getValues();
  const h = headerRow_(values, wanted);
  if (h < 0) throw new Error('lajur tidak dijumpai: ' + wanted.join(', '));
  const head = values[h];
  const firstRow = h + 2;
  const rows = Math.max(sheet.getMaxRows() - h - 1, 1);
  const col = (name) => findCol_(head, name);
  const range = (c) => sheet.getRange(firstRow, c + 1, rows, 1);
  const plan = [];
  plan.sheetName = sheet.getName();

  Object.keys(cfg.dropdowns || {}).forEach((name) => {
    const c = col(name);
    if (c < 0) return;
    const opts = cfg.dropdowns[name];
    plan.push({ firstRow: firstRow, describe: name + ': senarai pilihan ' + opts.join('/'),
      apply: () => range(c).setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInList(opts, true).setAllowInvalid(false)
        .setHelpText('Pilih ' + opts.join(', ')).build()) });
  });
  (cfg.dates || []).forEach((name) => {
    const c = col(name);
    if (c < 0) return;
    plan.push({ firstRow: firstRow, describe: name + ': mesti tarikh sah', apply: () => {
      range(c).setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false)
        .setHelpText('Masukkan tarikh sah, contoh 23/10/2026 (semak tahun!)').build());
      range(c).setNumberFormat('d/m/yyyy');
    } });
  });
  // Score columns: every header starting with one of cfg.scores (e.g. '4.' matches 4.1.1 … 4.6.1)
  head.forEach((cell, c) => {
    if (!(cfg.scores || []).some((p) => norm_(cell).startsWith(norm_(p)))) return;
    plan.push({ firstRow: firstRow, describe: String(cell).replace(/\s+/g, ' ') + ': nombor 0–100 sahaja',
      apply: () => range(c).setDataValidation(SpreadsheetApp.newDataValidation()
        .requireNumberBetween(0, 100).setAllowInvalid(false)
        .setHelpText('Nombor 0 hingga 100 sahaja (contoh 92.86)').build()) });
  });
  return plan;
}
