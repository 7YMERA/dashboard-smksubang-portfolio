// Admin overview: Penghantaran (pending names), admin-only charts, Status Sync.
import { Router } from 'express';
import { supabase } from '../supabase.js';
import { fail, requirePanel } from '../auth.js';

const router = Router();

router.get('/api/admin/overview', requirePanel, async (_req, res) => {
  const [trackers, pending, breakdowns, runs, control] = await Promise.all([
    supabase.from('trackers').select('*').order('title'),
    supabase.from('tracker_pending').select('tracker_key,name,detail').order('position').limit(5000),
    supabase.from('breakdowns').select('key,title,source,items,series,visibility,updated_at').order('sort_order'),
    supabase.from('sync_runs').select('ran_at,summary,warnings').order('ran_at', { ascending: false }).limit(10),
    supabase.from('sync_control').select('requested_at,requested_by').eq('id', 1).maybeSingle(),
  ]);
  const error = [trackers, pending, breakdowns, runs].find((r) => r.error)?.error;
  if (error) return fail(res, error);
  res.json({
    trackers: trackers.data.map((t) => ({ ...t, pending: pending.data.filter((p) => p.tracker_key === t.key) })),
    breakdowns: breakdowns.data,
    syncRuns: runs.data,
    syncRequest: control.data?.requested_at ? control.data : null,
  });
});

export default router;
