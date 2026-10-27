import crypto from 'node:crypto';
import { supabase } from './supabase.js';
import { verifySession } from './session.js';

// Two kinds of caller:
//  - the Apps Script / scripts, with `Authorization: Bearer <ADMIN_TOKEN>` → role 'system'
//  - people logged in at /admin, with `Authorization: Bearer <session token>` → their role in `admins`
// The admins row is re-checked on every request, so removing someone takes effect immediately.
export async function identify(req) {
  const bearer = (req.get('authorization') || '').replace(/^Bearer /, '');
  if (!bearer) return null;
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken && bearer.length === adminToken.length
      && crypto.timingSafeEqual(Buffer.from(bearer), Buffer.from(adminToken))) {
    return { role: 'system' };
  }
  const session = verifySession(bearer);
  if (!session || !supabase) return null;
  const { data } = await supabase.from('admins').select('role,name').eq('user_id', session.sub).maybeSingle();
  return data ? { role: data.role, name: data.name, email: session.email, userId: session.sub } : null;
}

// Roles: 'admin' manages everything; 'pentadbir' (Pengetua, PK) can see the admin panel but not edit.
// requireRole('admin') allows admin + system; requireRole('pentadbir') also allows pentadbir.
export function requireRole(minRole) {
  const allowed = minRole === 'pentadbir' ? ['pentadbir', 'admin', 'system'] : ['admin', 'system'];
  return async (req, res, next) => {
    const who = await identify(req);
    if (!who) return res.status(401).json({ error: 'unauthorized' });
    if (!allowed.includes(who.role)) return res.status(403).json({ error: 'forbidden' });
    req.who = who;
    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requirePanel = requireRole('pentadbir');

export const fail = (res, error) => res.status(500).json({ error: error.message });
