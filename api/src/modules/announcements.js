// Pengumuman: announcements with optional expiry.
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabase.js';
import { fail, requireAdmin, requirePanel } from '../auth.js';
import { audit, changes } from '../audit.js';

const router = Router();
const announcementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().max(2000).nullable().optional(),
  expires_at: z.string().datetime({ offset: true }).nullable().optional(),
  is_active: z.boolean().default(true),
});

router.get('/api/admin/announcements', requirePanel, async (_req, res) => {
  const { data, error } = await supabase.from('announcements').select('*').order('published_at', { ascending: false });
  if (error) return fail(res, error);
  res.json(data);
});

router.post('/api/admin/announcements', requireAdmin, async (req, res) => {
  const parsed = announcementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { data, error } = await supabase.from('announcements').insert(parsed.data).select().single();
  if (error) return fail(res, error);
  await audit(req, 'announcement.create', { target: data.title, details: { expires_at: data.expires_at } });
  res.status(201).json(data);
});

router.patch('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
  const parsed = announcementSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { data: before } = await supabase.from('announcements').select('*').eq('id', req.params.id).maybeSingle();
  const { data, error } = await supabase.from('announcements').update(parsed.data).eq('id', req.params.id).select().single();
  if (error) return fail(res, error);
  const diff = changes(before, parsed.data);
  if (Object.keys(diff).length) await audit(req, 'announcement.update', { target: data.title, details: diff });
  res.json(data);
});

router.delete('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('announcements').delete().eq('id', req.params.id).select('title');
  if (error) return fail(res, error);
  if (data?.[0]) await audit(req, 'announcement.delete', { target: data[0].title });
  res.status(204).end();
});

export default router;
