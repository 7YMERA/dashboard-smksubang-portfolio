// Data coming in: the Apps Script (POST /api/sync) and manual imports/metrics.
// Public tables only ever receive numbers and short labels; names go to the private
// tracker_pending table and are only shown in /admin.
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabase.js';
import { parseCsv } from '../csv.js';
import { fail, requireAdmin, requirePanel } from '../auth.js';
import { audit } from '../audit.js';
import { linkSchema } from './links.js';

const router = Router();
const key = z.string().regex(/^[a-z0-9_]+$/);
const label = z.string().trim().min(1).max(120);

const syncSchema = z.object({
  metrics: z.array(z.object({
    key, label, value: z.number().finite(),
    unit: z.string().max(10).nullable().optional(), sort_order: z.number().int().optional(),
  })).max(100).optional(),
  breakdowns: z.array(z.object({
    key, title: label, source: z.string().max(200).optional(),
    sort_order: z.number().int().optional(),
    visibility: z.enum(['public', 'admin']).default('public'),
    series: z.array(label).min(1).max(4).nullable().optional(),
    items: z.array(z.object({
      label,
      value: z.number().finite().optional(),
      values: z.array(z.number().finite().nullable()).max(4).optional(),
    }).refine((i) => i.value !== undefined || i.values, 'value or values required')).max(60),
  })).max(50).optional(),
  trackers: z.array(z.object({
    key, title: label, source: z.string().max(200).optional(),
    total: z.number().int().min(0), done: z.number().int().min(0),
    pending: z.array(z.object({ name: label, detail: z.string().max(200).nullable().optional() })).max(1000).default([]),
  }).refine((t) => t.done <= t.total, 'done > total')).max(30).optional(),
  tasks: z.array(z.object({
    title: z.string().trim().min(1).max(300),
    url: z.string().url().nullable().optional(),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    status: z.string().max(40).nullable().optional(),
    tracker_key: key.nullable().optional(),
  })).max(300).optional(),
  links: z.array(linkSchema.omit({ is_active: true, sort_order: true })).max(200).optional(),
  // Jadual Makmal: full replacement of the weeks sent (only sent when the workbook changed)
  lab: z.object({
    weeks: z.array(z.object({
      week: z.number().int().min(1).max(60), lab: z.string().max(60), label: z.string().max(120),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
      days: z.array(z.string().max(20)).max(7),
      periods: z.array(z.object({ label: z.string().max(40), time: z.string().max(40).nullable().optional(), session: z.string().max(20) })).max(40),
    })).max(200),
    slots: z.array(z.object({
      week: z.number().int(), lab: z.string().max(60), day: z.string().max(20), period: z.number().int().min(0).max(40),
      span: z.number().int().min(1).max(20).default(1), subject: z.string().max(60).nullable(), class_name: z.string().max(60).nullable(),
      teacher: z.string().max(120).nullable(), raw: z.string().max(200),
    })).max(20000),
  }).optional(),
  // Penyata Cuti: upsert per teacher (may arrive in batches over several runs)
  leave: z.array(z.object({
    name: z.string().trim().min(1).max(120), position: z.number().int().nullable().optional(),
    crk_entitled: z.number().nullable().optional(), crk_used: z.number().default(0),
    types: z.array(z.object({ type: z.string().max(80), used: z.number(), entitled: z.number().nullable().optional() })).max(20),
    sheet_url: z.string().url().nullable().optional(), year: z.number().int().nullable().optional(),
  })).max(400).optional(),
  leave_total: z.number().int().min(0).max(2000).optional(), // teachers in the CUTI index (progress of the batched read)
  warnings: z.array(z.object({ source: z.string().max(200), message: z.string().max(500) })).max(300).default([]),
});

router.post('/api/sync', requireAdmin, async (req, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { metrics, breakdowns, trackers, tasks, links, lab, leave, warnings } = parsed.data;
  const now = new Date().toISOString();
  const run = async (q) => { const { error } = await q; if (error) throw error; };

  try {
    if (metrics?.length) await run(supabase.from('metrics').upsert(metrics));
    if (breakdowns?.length) {
      await run(supabase.from('breakdowns').upsert(breakdowns.map((b, i) => ({ sort_order: i, series: null, ...b }))));
    }
    for (const t of trackers ?? []) {
      const { pending, ...row } = t;
      await run(supabase.from('trackers').upsert({ ...row, updated_at: now }));
      await run(supabase.from('tracker_pending').delete().eq('tracker_key', t.key));
      if (pending.length) {
        await run(supabase.from('tracker_pending').insert(
          pending.map((p, i) => ({ tracker_key: t.key, name: p.name, detail: p.detail ?? null, position: i })),
        ));
      }
    }
    if (tasks) {
      await run(supabase.from('tasks').delete().gte('id', 0));
      if (tasks.length) {
        await run(supabase.from('tasks').insert(tasks.map((t, i) => ({ ...t, position: i, updated_at: now }))));
      }
    }
    if (lab?.weeks.length) {
      const weekNos = [...new Set(lab.weeks.map((w) => w.week))];
      await run(supabase.from('lab_slots').delete().in('week', weekNos));
      await run(supabase.from('lab_weeks').upsert(lab.weeks.map((w) => ({ ...w, updated_at: now }))));
      for (let i = 0; i < lab.slots.length; i += 1000) {
        await run(supabase.from('lab_slots').insert(lab.slots.slice(i, i + 1000)));
      }
    }
    if (leave?.length) {
      await run(supabase.from('leave_summary').upsert(leave.map((l) => ({ ...l, synced_at: now }))));
    }
    if (links) {
      // Sheet-sourced links are replaced wholesale; manually added links are left alone.
      await run(supabase.from('links').delete().eq('source', 'sheet'));
      if (links.length) {
        await run(supabase.from('links').insert(links.map((l, i) => ({ ...l, sort_order: 100 + i, source: 'sheet' }))));
      }
    }
  } catch (error) {
    return fail(res, error);
  }

  const summary = {
    metrics: metrics?.length ?? 0, breakdowns: breakdowns?.length ?? 0, trackers: trackers?.length ?? 0,
    tasks: tasks?.length ?? 0, links: links?.length ?? 0, lab_weeks: lab?.weeks.length ?? 0,
    leave: leave?.length ?? 0, warnings: warnings.length,
    ...(parsed.data.leave_total !== undefined && { leave_total: parsed.data.leave_total }),
  };
  await supabase.from('sync_runs').insert({ summary, warnings });
  // A finished sync answers any waiting "Sync sekarang" request.
  await supabase.from('sync_control').update({ requested_at: null, requested_by: null }).eq('id', 1);
  res.json(summary);
});

// "Sync sekarang": anyone in Panel Admin can ask for a sync; the Apps Script picks it up within ~5 minutes.
router.post('/api/admin/sync-request', requirePanel, async (req, res) => {
  const by = req.who.name || req.who.email || 'sistem';
  const { error } = await supabase.from('sync_control').upsert({ id: 1, requested_at: new Date().toISOString(), requested_by: by });
  if (error) return fail(res, error);
  await audit(req, 'sync.request');
  res.json({ ok: true });
});

// Polled by the Apps Script (checkSyncRequest, every 5 minutes) and by checkSetup.
router.get('/api/sync/pending', requireAdmin, async (_req, res) => {
  const [control, last] = await Promise.all([
    supabase.from('sync_control').select('requested_at,requested_by').eq('id', 1).maybeSingle(),
    supabase.from('sync_runs').select('ran_at').order('ran_at', { ascending: false }).limit(1),
  ]);
  if (control.error) return fail(res, control.error);
  res.json({
    requested: Boolean(control.data?.requested_at),
    requested_at: control.data?.requested_at ?? null,
    requested_by: control.data?.requested_by ?? null,
    last_sync_at: last.data?.[0]?.ran_at ?? null,
  });
});

const metricSchema = z.object({ value: z.number(), label: z.string().optional(), unit: z.string().nullable().optional() });

router.put('/api/metrics/:key', requireAdmin, async (req, res) => {
  const parsed = metricSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { data, error } = await supabase.from('metrics')
    .upsert({ key: req.params.key, label: parsed.data.label ?? req.params.key, ...parsed.data })
    .select().single();
  if (error) return fail(res, error);
  if (req.who.role !== 'system') await audit(req, 'metric.update', { target: data.label, details: { value: data.value } });
  res.json(data);
});

// Import a published Google Sheet (File → Share → Publish to web → CSV) into dataset_rows (private).
const importSchema = z.object({ dataset: z.string().regex(/^[a-z0-9_-]+$/), csvUrl: z.string().url(), replace: z.boolean().default(true) });

router.post('/api/import', requireAdmin, async (req, res) => {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { dataset, csvUrl, replace } = parsed.data;

  const resp = await fetch(csvUrl);
  if (!resp.ok) return res.status(502).json({ error: `fetch failed: ${resp.status}` });
  const rows = parseCsv(await resp.text());

  if (replace) {
    const { error } = await supabase.from('dataset_rows').delete().eq('dataset', dataset);
    if (error) return fail(res, error);
  }
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500).map((data) => ({ dataset, data }));
    const { error } = await supabase.from('dataset_rows').insert(chunk);
    if (error) return fail(res, error);
  }
  await audit(req, 'data.import', { target: dataset, details: { rows: rows.length, replace } });
  res.json({ dataset, imported: rows.length });
});

router.get('/api/datasets/:dataset', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('dataset_rows')
    .select('data,imported_at').eq('dataset', req.params.dataset).limit(5000);
  if (error) return fail(res, error);
  res.json(data.map((r) => r.data));
});

export default router;
