import crypto from 'node:crypto';
import { supabase } from './supabase.js';

// One-time "Tetapkan kata laluan" links (table account_setup_links). The secret goes out by email (or is copied
// by an admin to WhatsApp); only its SHA-256 hash is stored. A link works once, for LINK_MINUTES.
export const LINK_MINUTES = 24 * 60;

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

// The public address of the site, for links in emails. SITE_URL wins; on Vercel the production domain is known.
export function siteUrl() {
  const url = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return (url || 'http://localhost:3000').replace(/\/$/, '');
}

/** A new link for this account. Older unused links for it stop working. Returns { url, expiresAt }. */
export async function createSetupLink(userId, purpose) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + LINK_MINUTES * 60 * 1000).toISOString();
  const old = await supabase.from('account_setup_links').update({ used_at: new Date().toISOString() })
    .eq('user_id', userId).is('used_at', null);
  if (old.error) throw old.error;
  const { error } = await supabase.from('account_setup_links').insert({ token_hash: hash(token), user_id: userId, purpose, expires_at: expiresAt });
  if (error) throw error;
  return { url: `${siteUrl()}/admin/tetapkan/${token}`, expiresAt };
}

/** The unused, unexpired link for this token, or null. */
export async function findSetupLink(token) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(String(token))) return null;
  const { data, error } = await supabase.from('account_setup_links').select('token_hash,user_id,purpose,expires_at')
    .eq('token_hash', hash(token)).is('used_at', null).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (error) throw error;
  return data;
}

/** Marks the link used; false if someone else used it first. */
export async function useSetupLink(link) {
  const { data, error } = await supabase.from('account_setup_links').update({ used_at: new Date().toISOString() })
    .eq('token_hash', link.token_hash).is('used_at', null).select('token_hash');
  if (error) throw error;
  return data.length === 1;
}
