// Shared formatting for all modules (Malay, Malaysia time).
export const TZ = 'Asia/Kuala_Lumpur';
export const num = new Intl.NumberFormat('ms-MY', { maximumFractionDigits: 1 });

export const fmtDate = (iso) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso).toLocaleDateString('ms-MY', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('ms-MY', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

/** Whole days from today (Malaysia) to an ISO date: 0 = today, negative = overdue. */
export function daysUntil(isoDate) {
  if (!isoDate) return null;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  return Math.round((Date.parse(isoDate) - Date.parse(today)) / 86400000);
}

/** Status: good / warning / critical, always paired with an icon and a text label. */
export function deadlineStatus(isoDate) {
  const d = daysUntil(isoDate);
  if (d === null) return { tone: 'neutral', icon: '•', text: 'Tiada tarikh' };
  if (d < 0) return { tone: 'critical', icon: '⚠', text: `Lewat ${-d} hari` };
  if (d === 0) return { tone: 'warning', icon: '⏳', text: 'Hari ini' };
  if (d <= 3) return { tone: 'warning', icon: '⏳', text: `${d} hari lagi` };
  return { tone: 'good', icon: '✓', text: `${d} hari lagi` };
}
