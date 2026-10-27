// Admin login: Supabase Auth checks the password, the API issues a 7-day session (session.js).
import { Router } from 'express';
import { z } from 'zod';
import { supabase, authClient } from '../supabase.js';
import { createSession } from '../session.js';
import { requirePanel } from '../auth.js';
import { audit } from '../audit.js';

const router = Router();
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });

// Last step of a login: only people in `admins` get a session.
async function finishLogin(req, res, user, method) {
  const { data: admin } = await supabase.from('admins').select('role,name').eq('user_id', user.id).maybeSingle();
  if (!admin) {
    await audit(req, 'login_failed', { actor: { email: user.email }, details: { method, sebab: 'tiada akses' } });
    return res.status(403).json({ error: `Akaun ${user.email} tiada akses ke Panel Admin. Minta admin menambah emel ini di bahagian Akaun.` });
  }
  const session = createSession({ userId: user.id, email: user.email, role: admin.role });
  await audit(req, 'login', { actor: { userId: user.id, email: user.email, ...admin }, details: { method } });
  res.json({ ...session, user: { email: user.email, role: admin.role, name: admin.name } });
}

router.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Emel atau kata laluan tidak sah' });
  if (!process.env.ADMIN_TOKEN) return res.status(503).json({ error: 'ADMIN_TOKEN is not set' });

  const { data, error } = await authClient().auth.signInWithPassword(parsed.data);
  if (error || !data?.user) {
    // Tell the real reason apart: wrong password vs. too many tries vs. a server/config problem.
    const code = error?.code || '';
    const failed = (sebab) => audit(req, 'login_failed', { actor: { email: parsed.data.email }, details: { method: 'password', sebab } });
    if (error?.status === 429 || /rate/i.test(code + error?.message)) {
      await failed('terlalu banyak cubaan');
      return res.status(429).json({ error: 'Terlalu banyak cubaan. Tunggu 5 minit, kemudian cuba lagi.' });
    }
    if (code === 'email_not_confirmed') {
      await failed('emel belum disahkan');
      return res.status(401).json({ error: 'Emel belum disahkan. Dalam Supabase → Authentication → Users, sahkan akaun ini.' });
    }
    if (!error || code === 'invalid_credentials' || /invalid login credentials/i.test(error.message)) {
      await failed('kata laluan salah');
      return res.status(401).json({ error: 'Emel atau kata laluan salah' });
    }
    console.error('login failed', error);
    return res.status(502).json({ error: `Log masuk gagal (ralat sistem): ${error.message}` });
  }
  // We issue our own session, so end the Supabase one straight away.
  await supabase.auth.admin.signOut(data.session.access_token).catch(() => {});
  return finishLogin(req, res, data.user, 'password');
});

router.post('/api/auth/logout', requirePanel, async (req, res) => {
  await audit(req, 'logout');
  res.json({ ok: true });
});

router.get('/api/admin/me', requirePanel, (req, res) => res.json(req.who));

// Log Audit, newest first. ?type=login|link|announcement|account|sync, ?before=<id> for the next page.
const AUDIT_TYPES = { login: ['login', 'login_failed', 'logout'], link: ['link.'], announcement: ['announcement.'], account: ['account.'], sync: ['sync.', 'metric.', 'data.'] };

router.get('/api/admin/audit', requirePanel, async (req, res) => {
  let q = supabase.from('audit_log').select('*').order('id', { ascending: false }).limit(100);
  const prefixes = AUDIT_TYPES[req.query.type];
  if (prefixes) q = q.or(prefixes.map((p) => (p.endsWith('.') ? `action.like.${p}*` : `action.eq.${p}`)).join(','));
  if (/^\d+$/.test(req.query.before || '')) q = q.lt('id', Number(req.query.before));
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
