// v2.6 views. Jadual Makmal: public without teacher names, full detail for Panel Admin users.
// Penyata Cuti: everyone's for Panel Admin users; one teacher's own via their personal link (/cuti/<token>).
import crypto from 'node:crypto';
import { Router } from 'express';
import { supabase } from '../supabase.js';
import { fail, identify, requireAdmin, requirePanel } from '../auth.js';
import { audit } from '../audit.js';

const router = Router();

async function labWeek(req, res, withTeacher) {
  const weeks = await supabase.from('lab_weeks').select('week,lab,label,start_date,end_date').order('week');
  if (weeks.error) return fail(res, weeks.error);
  if (!weeks.data.length) return res.json({ weeks: [], labs: [], week: null, slots: [] });

  // Default: the week containing today (Malaysia time), else the next one, else the last.
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
  const list = [...new Map(weeks.data.map((w) => [w.week, w])).values()];
  const requested = Number(req.query.week);
  const current = list.find((w) => w.start_date <= today && today <= w.end_date)
    ?? list.find((w) => w.start_date > today) ?? list[list.length - 1];
  const week = list.some((w) => w.week === requested) ? requested : current.week;

  const [detail, slots] = await Promise.all([
    supabase.from('lab_weeks').select('*').eq('week', week).order('lab'),
    supabase.from('lab_slots').select('lab,day,period,span,subject,class_name,teacher,raw').eq('week', week),
  ]);
  if (detail.error || slots.error) return fail(res, detail.error || slots.error);
  res.json({
    weeks: list.map(({ week: w, label, start_date, end_date }) => ({ week: w, label, start_date, end_date })),
    currentWeek: current.week,
    week,
    labs: detail.data,
    slots: slots.data.map((s) => (withTeacher ? s : { lab: s.lab, day: s.day, period: s.period, span: s.span, subject: s.subject, class_name: s.class_name })),
  });
}

router.get('/api/lab', async (req, res) => {
  // Public; a valid Panel Admin session (or ADMIN_TOKEN) also gets teacher names.
  const who = await identify(req).catch(() => null);
  return labWeek(req, res, Boolean(who));
});

const newToken = () => crypto.randomBytes(24).toString('base64url'); // 32 characters, unguessable

// Every teacher in leave_summary gets a personal link the first time Panel Admin asks for the list.
async function ensureLinks(names) {
  const { data, error } = await supabase.from('leave_links').select('name,token,last_viewed_at,view_count');
  if (error) throw error;
  const have = new Set(data.map((l) => l.name));
  const missing = names.filter((n) => !have.has(n)).map((name) => ({ name, token: newToken() }));
  if (missing.length) {
    const ins = await supabase.from('leave_links').upsert(missing, { onConflict: 'name', ignoreDuplicates: true })
      .select('name,token,last_viewed_at,view_count');
    if (ins.error) throw ins.error;
    data.push(...ins.data);
  }
  return Object.fromEntries(data.map((l) => [l.name, l]));
}

// { rows, total }: total = teachers in the CUTI index at the last sync, so the page can show "x of y read".
// Each row carries its personal link token and when the teacher last opened it.
router.get('/api/admin/leave', requirePanel, async (_req, res) => {
  const [rows, run] = await Promise.all([
    supabase.from('leave_summary').select('*').order('position'),
    supabase.from('sync_runs').select('summary').not('summary->leave_total', 'is', null)
      .order('ran_at', { ascending: false }).limit(1),
  ]);
  if (rows.error) return fail(res, rows.error);
  try {
    const links = await ensureLinks(rows.data.map((r) => r.name));
    res.json({
      rows: rows.data.map((r) => ({
        ...r,
        link_token: links[r.name]?.token ?? null,
        link_viewed_at: links[r.name]?.last_viewed_at ?? null,
        link_views: links[r.name]?.view_count ?? 0,
      })),
      total: run.data?.[0]?.summary?.leave_total ?? null,
    });
  } catch (error) {
    fail(res, error);
  }
});

// "Tukar pautan": a new secret for one teacher; the old link stops working at once.
router.post('/api/admin/leave/link', requireAdmin, async (req, res) => {
  const name = String(req.body?.name || '').slice(0, 120);
  const { data, error } = await supabase.from('leave_links').update({ token: newToken(), last_viewed_at: null, view_count: 0 })
    .eq('name', name).select('name').maybeSingle();
  if (error) return fail(res, error);
  if (!data) return res.status(404).json({ error: 'Guru tidak dijumpai' });
  await audit(req, 'leave.link_reset', { target: name });
  res.json({ ok: true });
});

// Public: one teacher's own statement, by personal link. Nothing else is reachable with a token.
router.get('/api/cuti/:token', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!/^[A-Za-z0-9_-]{32}$/.test(req.params.token)) return res.status(404).json({ error: 'not found' });
  const { data: link, error } = await supabase.from('leave_links').select('name,view_count').eq('token', req.params.token).maybeSingle();
  if (error) return fail(res, error);
  if (!link) return res.status(404).json({ error: 'not found' });
  const { data: row, error: e2 } = await supabase.from('leave_summary')
    .select('name,crk_entitled,crk_used,types,sheet_url,year,synced_at').eq('name', link.name).maybeSingle();
  if (e2) return fail(res, e2);
  if (!row) return res.status(404).json({ error: 'not found' });
  await supabase.from('leave_links').update({ last_viewed_at: new Date().toISOString(), view_count: link.view_count + 1 })
    .eq('name', link.name);
  res.json(row);
});

export default router;
