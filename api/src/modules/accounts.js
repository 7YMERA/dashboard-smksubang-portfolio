// Akaun: admins manage Panel Admin accounts from the browser (no Supabase dashboard needed).
// Accounts are Supabase Auth users; the `admins` table gives each one a role. Nobody types or sees a password:
// a new account (or "Hantar pautan kata laluan") gets a one-time 10-minute link to set its own (setup-links.js).
import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabase.js';
import { fail, requireAdmin } from '../auth.js';
import { audit, changes } from '../audit.js';
import { createSetupLink, LINK_MINUTES } from '../setup-links.js';
import { emailReady, sendSetupEmail } from '../email.js';

const router = Router();
const role = z.enum(['admin', 'pentadbir']);
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

const createSchema = z.object({ email: z.string().trim().toLowerCase().email('Emel tidak sah'), name, role });

// Makes a setup link, emails it if email is set up, and returns what Panel Admin shows: whether it was emailed,
// and the link itself so the admin can copy it to WhatsApp (the usual way).
async function sendLink(userId, email, who, purpose) {
  const link = await createSetupLink(userId, purpose);
  const emailed = await sendSetupEmail({ to: email, name: who, url: link.url, purpose, minutes: LINK_MINUTES });
  return { emailed, email_ready: emailReady(), setup_url: link.url, expires_at: link.expiresAt, valid_minutes: LINK_MINUTES };
}

router.post('/api/admin/accounts', requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { email, name: n, role: r } = parsed.data;
  try {
    const users = Object.values(await emailsById());
    let user = users.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      // A random password nobody knows; the person sets their own through the link.
      const { data, error } = await supabase.auth.admin.createUser({
        email, password: crypto.randomBytes(24).toString('base64url'), email_confirm: true,
      });
      if (error) throw error;
      user = data.user;
    }
    const { error } = await supabase.from('admins').upsert({ user_id: user.id, role: r, name: n });
    if (error) throw error;
    const link = await sendLink(user.id, email, n, 'invite');
    await audit(req, 'account.create', { target: `${n} <${email}>`, details: { role: r, emel: link.emailed ? 'dihantar' : 'tidak dihantar' } });
    res.status(201).json({ user_id: user.id, email, role: r, name: n, ...link });
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

// "Hantar pautan kata laluan": a new 10-minute link to set a password (forgotten password, or the first link expired).
router.post('/api/admin/accounts/:id/setup-link', requireAdmin, async (req, res) => {
  try {
    const { data: user, error } = await supabase.auth.admin.getUserById(req.params.id);
    if (error || !user?.user) return res.status(404).json({ error: 'Akaun tidak dijumpai' });
    const { data: admin } = await supabase.from('admins').select('name').eq('user_id', req.params.id).maybeSingle();
    if (!admin) return res.status(404).json({ error: 'Akaun tidak dijumpai' });
    const link = await sendLink(req.params.id, user.user.email, admin.name, 'reset');
    await audit(req, 'account.setup_link', { target: await label(req.params.id, admin.name), details: { emel: link.emailed ? 'dihantar' : 'tidak dihantar' } });
    res.json(link);
  } catch (error) {
    fail(res, error);
  }
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
