'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { clearSessionCookie, getAdmin, requireAdmin, setSessionCookie } from '@/lib/session';

export async function login(_prev, formData) {
  try {
    const { token, expiresAt } = await apiFetch('api/auth/login', {
      method: 'POST',
      body: { email: String(formData.get('email') || ''), password: String(formData.get('password') || '') },
    });
    await setSessionCookie(token, expiresAt);
  } catch (err) {
    return { error: err.message, email: String(formData.get('email') || '') };
  }
  redirect('/admin');
}

export async function logout() {
  const admin = await getAdmin();
  if (admin) await apiFetch('api/auth/logout', { token: admin.token, method: 'POST' }).catch(() => {});
  await clearSessionCookie();
  redirect('/admin/login');
}

// Every edit action returns { ok } or { error } for the form row to show (no error pages).
async function write(path, method, body) {
  try {
    const { token } = await requireAdmin({ write: true });
    await apiFetch(path, { token, method, body });
  } catch (err) {
    if (err?.digest?.startsWith?.('NEXT_REDIRECT')) throw err; // session expired → login page
    return { error: err.message };
  }
  updateTag('dashboard');
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
  return { ok: true, at: Date.now() };
}

const text = (fd, k) => String(fd.get(k) ?? '').trim();

// React resets a form after every submit; on error we send the typed values back so nothing is lost.
const keep = (fd, result) => (result?.error ? { ...result, values: Object.fromEntries(fd) } : result);

// Checked here first so mistakes get a clear Malay message before anything is sent.
function checkLink(fd) {
  if (!text(fd, 'title')) return 'Tajuk wajib diisi.';
  const url = text(fd, 'url');
  if (!/^https?:\/\/\S+\.\S+/.test(url)) return 'URL mesti bermula dengan https:// (salin terus dari pelayar).';
  if (/^https?:\/\/docs\.google\.com\/forms\/d\/[^/]+\/edit/.test(url)) {
    return 'Ini pautan EDIT borang. Guna pautan Hantar → pautan (forms.gle/…) supaya guru boleh mengisi.';
  }
  if (fd.get('sort_order') !== '' && !Number.isInteger(Number(fd.get('sort_order')))) return 'Susunan mesti nombor bulat.';
  return null;
}

export async function saveLink(_prev, fd) {
  return keep(fd, await saveLinkInner(fd));
}

async function saveLinkInner(fd) {
  const problem = checkLink(fd);
  if (problem) return { error: problem };
  const id = text(fd, 'id');
  const link = {
    title: text(fd, 'title'),
    url: text(fd, 'url'),
    category: text(fd, 'category') || 'Umum',
    description: text(fd, 'description') || null,
    sort_order: Number(fd.get('sort_order')) || 0,
    is_active: fd.get('is_active') === 'on',
    tracker_key: text(fd, 'tracker_key') || null,
  };
  if (id) return write(`api/admin/links/${id}`, 'PATCH', link);
  return write('api/links', 'POST', { ...link, description: link.description ?? undefined });
}

export async function deleteLink(_prev, fd) {
  return write(`api/admin/links/${text(fd, 'id')}`, 'DELETE');
}

export async function saveAnnouncement(_prev, fd) {
  return keep(fd, await saveAnnouncementInner(fd));
}

async function saveAnnouncementInner(fd) {
  if (!text(fd, 'title')) return { error: 'Tajuk wajib diisi.' };
  const expires = text(fd, 'expires_at');
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
  if (expires && expires < today) return { error: 'Tarikh tamat sudah lepas, jadi pengumuman ini tidak akan dipaparkan.' };
  const body = {
    title: text(fd, 'title'),
    body: text(fd, 'body') || null,
    // <input type="date"> gives YYYY-MM-DD; expire at the end of that day, Malaysia time.
    expires_at: expires ? new Date(`${expires}T23:59:59+08:00`).toISOString() : null,
    is_active: fd.get('is_active') === 'on',
  };
  const id = text(fd, 'id');
  if (id) return write(`api/admin/announcements/${id}`, 'PATCH', body);
  return write('api/admin/announcements', 'POST', body);
}

export async function deleteAnnouncement(_prev, fd) {
  return write(`api/admin/announcements/${text(fd, 'id')}`, 'DELETE');
}

// ---- Akaun (admin only; the API refuses everyone else) ----

export async function addAccount(_prev, fd) {
  const body = { name: text(fd, 'name'), email: text(fd, 'email'), role: text(fd, 'role'), password: String(fd.get('password') || '') };
  if (!body.name) return keep(fd, { error: 'Nama wajib diisi.' });
  if (!/^\S+@\S+\.\S+$/.test(body.email)) return keep(fd, { error: 'Emel tidak sah.' });
  if (body.password.length < 8) return keep(fd, { error: 'Kata laluan sekurang-kurangnya 8 aksara. Tekan "Jana" untuk buat satu.' });
  const result = await write('api/admin/accounts', 'POST', body);
  return result.ok ? { ...result, created: { name: body.name, email: body.email, role: body.role, password: body.password } } : keep(fd, result);
}

export async function changeRole(_prev, fd) {
  return write(`api/admin/accounts/${text(fd, 'id')}`, 'PATCH', { role: text(fd, 'role') });
}

export async function setPassword(_prev, fd) {
  const password = String(fd.get('password') || '');
  if (password.length < 8) return { error: 'Kata laluan sekurang-kurangnya 8 aksara.' };
  const result = await write(`api/admin/accounts/${text(fd, 'id')}/password`, 'POST', { password });
  return result.ok ? { ...result, password } : result;
}

export async function removeAccount(_prev, fd) {
  return write(`api/admin/accounts/${text(fd, 'id')}`, 'DELETE');
}

// Penyata Cuti: give one teacher a new personal link (the old one stops working).
export async function resetLeaveLink(_prev, fd) {
  return write('api/admin/leave/link', 'POST', { name: text(fd, 'name') });
}

// "Sync sekarang": allowed for pentadbir too (it changes no data, it only asks for fresh numbers).
export async function requestSync() {
  try {
    const { token } = await requireAdmin();
    await apiFetch('api/admin/sync-request', { token, method: 'POST' });
  } catch (err) {
    if (err?.digest?.startsWith?.('NEXT_REDIRECT')) throw err;
    return { error: err.message };
  }
  revalidatePath('/admin', 'layout');
  return { ok: true };
}
