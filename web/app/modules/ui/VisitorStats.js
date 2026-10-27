'use client';

// Vercel Web Analytics: counts visitors and page views (no cookies, no names).
// Query strings are dropped so things like login error messages never reach Vercel, and the secret part of a
// teacher's personal Penyata Cuti link (/cuti/<token>) and of a set-password link (/admin/tetapkan/<token>) is
// replaced before anything is sent.
import { Analytics } from '@vercel/analytics/next';

const strip = (event) => {
  const url = new URL(event.url);
  const view = url.searchParams.get('v'); // keep which dashboard tab was viewed
  url.search = view ? `?v=${view}` : '';
  if (url.pathname.startsWith('/cuti/')) url.pathname = '/cuti/[pautan]';
  if (url.pathname.startsWith('/admin/tetapkan/')) url.pathname = '/admin/tetapkan/[pautan]';
  return { ...event, url: url.toString() };
};

export default function VisitorStats() {
  return <Analytics beforeSend={strip} />;
}
