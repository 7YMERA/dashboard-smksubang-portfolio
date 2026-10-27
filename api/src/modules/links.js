// Pautan: the link buttons. Public list comes from /api/dashboard; these are the edit routes.
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabase.js';
import { fail, requireAdmin, requirePanel } from '../auth.js';
import { audit, changes } from '../audit.js';

const router = Router();

export const linkSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  category: z.string().min(1).default('Umum'),
  description: z.string().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  tracker_key: z.string().regex(/^[a-z0-9_]+$/).nullable().optional(),
});
const linkPatch = linkSchema.partial().extend({ description: z.string().nullable().optional() });

router.post('/api/links', requireAdmin, async (req, res) => {
  const parsed = linkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { data, error } = await supabase.from('links').insert(parsed.data).select().single();
  if (error) return fail(res, error);
  await audit(req, 'link.create', { target: data.title, details: { url: data.url, category: data.category } });
  res.status(201).json(data);
});

router.get('/api/admin/links', requirePanel, async (_req, res) => {
  const { data, error } = await supabase.from('links').select('*').order('sort_order');
  if (error) return fail(res, error);
  res.json(data);
});

router.patch('/api/admin/links/:id', requireAdmin, async (req, res) => {
  const parsed = linkPatch.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { data: before } = await supabase.from('links').select('*').eq('id', req.params.id).maybeSingle();
  const { data, error } = await supabase.from('links').update(parsed.data).eq('id', req.params.id).select().single();
  if (error) return fail(res, error);
  const diff = changes(before, parsed.data);
  if (Object.keys(diff).length) await audit(req, 'link.update', { target: data.title, details: diff });
  res.json(data);
});

router.delete('/api/admin/links/:id', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('links').delete().eq('id', req.params.id).select('title,url');
  if (error) return fail(res, error);
  if (data?.[0]) await audit(req, 'link.delete', { target: data[0].title, details: { url: data[0].url } });
  res.status(204).end();
});

export default router;
