import crypto from 'node:crypto';

// Admin sessions are short signed tokens (HS256 JWT) issued by the API after Supabase Auth has
// checked the password. The key is derived from ADMIN_TOKEN, so changing ADMIN_TOKEN logs everyone out.
const SESSION_DAYS = 7;

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const key = () => crypto.createHmac('sha256', process.env.ADMIN_TOKEN || '').update('admin-session-v1').digest();
const sign = (data) => b64url(crypto.createHmac('sha256', key()).update(data).digest());

export function createSession({ userId, email, role }) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + SESSION_DAYS * 24 * 3600;
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ sub: userId, email, role, iat: now, exp }));
  return { token: `${head}.${body}.${sign(`${head}.${body}`)}`, expiresAt: exp * 1000 };
}

/** Returns the payload of a valid, unexpired session token, or null. */
export function verifySession(token) {
  if (!process.env.ADMIN_TOKEN) return null;
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload.exp * 1000 > Date.now() ? payload : null;
  } catch {
    return null;
  }
}
