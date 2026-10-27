import { supabase } from './supabase.js';

// Log Audit: one row per change made through Panel Admin (see migration 20261028000000_audit_log.sql).
// Logging must never break the action itself, so failures are only printed.
export async function audit(req, action, { target = null, details = null, actor = req.who } = {}) {
  if (!supabase) return;
  const { error } = await supabase.from('audit_log').insert({
    actor_id: actor?.userId ?? null,
    actor_email: actor?.email ?? null,
    actor_name: actor?.name ?? null,
    actor_role: actor?.role ?? null,
    action,
    target,
    details,
    // The web server forwards the visitor's address; direct callers get their own.
    ip: (req.get('x-smks-client-ip') || req.ip || '').slice(0, 64) || null,
  });
  if (error) console.error('audit log failed', action, error.message);
}

// Only the fields that really changed, for the "Butiran" column.
export function changes(before, after) {
  if (!before) return after;
  const out = {};
  for (const [k, v] of Object.entries(after)) {
    if (JSON.stringify(before[k] ?? null) !== JSON.stringify(v ?? null)) out[k] = { dari: before[k] ?? null, kepada: v ?? null };
  }
  return out;
}
