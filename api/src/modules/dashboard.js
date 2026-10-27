// Public: everything the home page needs in one request. Only public tables / aggregates.
import { Router } from 'express';
import { supabase } from '../supabase.js';
import { fail } from '../auth.js';

const router = Router();

router.get('/api/dashboard', async (_req, res) => {
  const now = new Date().toISOString();
  const [metrics, links, announcements, breakdowns, trackers, tasks, lastSync] = await Promise.all([
    supabase.from('metrics').select('key,label,value,unit,updated_at').order('sort_order'),
    supabase.from('links').select('id,title,url,category,description,tracker_key').eq('is_active', true).order('sort_order'),
    supabase.from('announcements').select('id,title,body,published_at,expires_at')
      .eq('is_active', true).or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('published_at', { ascending: false }).limit(10),
    supabase.from('breakdowns').select('key,title,source,items,series,updated_at').eq('visibility', 'public').order('sort_order'),
    supabase.from('trackers').select('key,title,total,done,updated_at'),
    supabase.from('tasks').select('id,title,url,deadline,status,tracker_key').order('position'),
    supabase.from('sync_runs').select('ran_at').order('ran_at', { ascending: false }).limit(1),
  ]);
  const error = [metrics, links, announcements, breakdowns, trackers, tasks, lastSync].find((r) => r.error)?.error;
  if (error) return fail(res, error);
  res.set('Cache-Control', 'public, max-age=30');
  res.json({
    metrics: metrics.data,
    links: links.data,
    announcements: announcements.data,
    breakdowns: breakdowns.data,
    trackers: trackers.data,
    tasks: tasks.data,
    lastSyncAt: lastSync.data[0]?.ran_at ?? null,
  });
});

export default router;
