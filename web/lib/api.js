// On Vercel, API_URL is injected by the service binding to `smksubang-api` (see /vercel.json);
// locally it falls back to the standalone API. Bindings resolve at runtime only, not during builds.
import { headers } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:4000';

const EMPTY = { metrics: [], links: [], announcements: [], breakdowns: [] };

function apiUrl(path) {
  const base = API_URL.endsWith('/') ? API_URL : `${API_URL}/`;
  return new URL(path, base);
}

// The visitor's address as Vercel saw it (first entry of x-forwarded-for).
async function clientIp() {
  try {
    return ((await headers()).get('x-forwarded-for') || '').split(',')[0].trim();
  } catch {
    return ''; // outside a request (e.g. during build)
  }
}

/** Server-side call to the API. Throws with the API's error message on failure. */
export async function apiFetch(path, { token, method = 'GET', body } = {}) {
  const res = await fetch(apiUrl(path), {
    method,
    cache: 'no-store',
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      'x-smks-client-ip': await clientIp(), // for the Log Audit
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Validation errors arrive as a list of zod issues: turn them into one readable line.
    const msg = typeof data.error === 'string' ? data.error
      : Array.isArray(data.error) ? data.error.map((i) => `${(i.path || []).join('.') || 'input'}: ${i.message}`).join('; ')
      : `API ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return data;
}

// Public page data; the response is cached for 60s so the page stays fast but fresh.
export async function getDashboard() {
  try {
    const res = await fetch(apiUrl('api/dashboard'), { next: { revalidate: 60, tags: ['dashboard'] } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return { ...EMPTY, ...(await res.json()), error: null };
  } catch (err) {
    return { ...EMPTY, error: err.message };
  }
}
