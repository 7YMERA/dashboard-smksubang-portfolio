// Akaun: admins manage Panel Admin accounts from the browser (no Supabase dashboard needed).
// Accounts are Supabase Auth users; the `admins` table gives each one a role.
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabase.js';
import { fail, requireAdmin } from '../auth.js';
import { audit, changes } from '../audit.js';

const router = Router();
const role = z.enum(['admin', 'pentadbir']);
const password = z.string().min(8, 'Kata laluan sekurang-kurangnya 8 aksara').max(72);
const name = z.string().trim().min(1, 'Nama wajib diisi').max(80);

async function emailsById() {
  const map = {};
  for (let page = 1; page < 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    data.users.forEach((u) => { map[u.id] = u; });
    if (data.users.length < 200) break;
  }
  return map;
}

// "Name <email>" for the audit log.
async function label(userId, name) {
  if (name === undefined) {
    const { data } = await supabase.from('admins').select('name').eq('user_id', userId).maybeSingle();
    name = data?.name;
  }
  const { data } = await supabase.auth.admin.getUserById(userId).catch(() => ({}));
  return [name, data?.user?.email && `<${data.user.email}>`].filter(Boolean).join(' ') || userId;
}

// Protect the person doing the change from locking themselves out.
function notSelf(req, res, userId, what) {
  if (req.who.userId && req.who.userId === userId) {
    res.status(400).json({ error: `Anda tidak boleh ${what} akaun anda sendiri.` });
    return false;
  }
  return true;
}

router.get('/api/admin/accounts', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('admins').select('user_id,role,name,created_at').order('created_at');
    if (error) throw error;
    const users = await emailsById();
    res.json(data.map((a) => ({
      ...a,
      email: users[a.user_id]?.email ?? '(akaun dipadam)',
      last_sign_in_at: users[a.user_id]?.last_sign_in_at ?? null,
      is_me: a.user_id === req.who.userId,
    })));
  } catch (error) {
    fail(res, error);
  }
});

const createSchema = z.object({ email: z.string().trim().toLowerCase().email('Emel tidak sah'), name, role, password });

router.post('/api/admin/accounts', requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { email, name: n, role: r, password: pw } = parsed.data;
  try {
    const users = Object.values(await emailsById());
    let user = users.find((u) => u.email?.toLowerCase() === email);
    if (user) {
      // Existing login (e.g. made earlier in Supabase): give it access and the new password.
      const { error } = await supabase.auth.admin.updateUserById(user.id, { password: pw });
      if (error) throw error;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({ email, password: pw, email_confirm: true });
      if (error) throw error;
      user = data.user;
    }
    const { error } = await supabase.from('admins').upsert({ user_id: user.id, role: r, name: n });
    if (error) throw error;
    await audit(req, 'account.create', { target: `${n} <${email}>`, details: { role: r } });
    res.status(201).json({ user_id: user.id, email, role: r, name: n });
  } catch (error) {
    fail(res, error);
  }
});

router.patch('/api/admin/accounts/:id', requireAdmin, async (req, res) => {
  const parsed = z.object({ role: role.optional(), name: name.optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  if (parsed.data.role && parsed.data.role !== 'admin' && !notSelf(req, res, req.params.id, 'menurunkan peranan')) return;
  const { data: before } = await supabase.from('admins').select('role,name').eq('user_id', req.params.id).maybeSingle();
  const { data, error } = await supabase.from('admins').update(parsed.data).eq('user_id', req.params.id).select().single();
  if (error) return fail(res, error);
  const diff = changes(before, parsed.data);
  if (Object.keys(diff).length) await audit(req, 'account.update', { target: await label(req.params.id, data.name), details: diff });
  res.json(data);
});

router.post('/api/admin/accounts/:id/password', requireAdmin, async (req, res) => {
  const parsed = z.object({ password }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { error } = await supabase.auth.admin.updateUserById(req.params.id, { password: parsed.data.password });
  if (error) return fail(res, error);
  await audit(req, 'account.password', { target: await label(req.params.id) }); // never the password itself
  res.json({ ok: true });
});

router.delete('/api/admin/accounts/:id', requireAdmin, async (req, res) => {
  if (!notSelf(req, res, req.params.id, 'membuang')) return;
  const target = await label(req.params.id);
  const { error } = await supabase.from('admins').delete().eq('user_id', req.params.id);
  if (error) return fail(res, error);
  // Remove the login too, so the email can be added again cleanly later.
  await supabase.auth.admin.deleteUser(req.params.id).catch(() => {});
  await audit(req, 'account.delete', { target });
  res.status(204).end();
});

export default router;
