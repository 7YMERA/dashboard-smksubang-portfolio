import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch } from './api';

export const COOKIE = 'smks_admin';

export const sessionCookieOptions = (expiresAt) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  expires: new Date(expiresAt),
});

export async function setSessionCookie(token, expiresAt) {
  (await cookies()).set(COOKIE, token, sessionCookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

/** The logged-in admin ({ role, email, name, token }) or null. Verified by the API once per request. */
export const getAdmin = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    return { ...(await apiFetch('api/admin/me', { token })), token };
  } catch {
    return null;
  }
});

/** For admin pages and actions: the admin, or a redirect to the login page. */
export async function requireAdmin({ write = false } = {}) {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  if (write && admin.role !== 'admin') throw new Error('Akaun pentadbir hanya boleh melihat. Hubungi admin untuk membuat perubahan.');
  return admin;
}
