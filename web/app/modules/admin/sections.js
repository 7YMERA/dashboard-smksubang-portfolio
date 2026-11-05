// Every Panel Admin section, in menu order. `adminOnly` sections are hidden from pentadbir;
// `badge` names the count (from the panel layout) shown next to the label.
export const SECTIONS = [
  { href: '/admin', label: 'Ringkasan', icon: 'home' },
  { href: '/admin/penghantaran', label: 'Penghantaran', icon: 'send', badge: 'pending' },
  { href: '/admin/sync', label: 'Status Sync', icon: 'sync', badge: 'problems' },
  { href: '/admin/analisis', label: 'Analisis dalaman', icon: 'chart' },
  { href: '/admin/pautan', label: 'Pautan', icon: 'link' },
  { href: '/admin/pengumuman', label: 'Pengumuman', icon: 'megaphone' },
  { href: '/admin/akaun', label: 'Akaun', icon: 'users', adminOnly: true },
  { href: '/admin/audit', label: 'Log Audit', icon: 'history' },
];

export const ROLE = { admin: 'Admin', pentadbir: 'Pentadbir · lihat sahaja' };

export const sectionsFor = (role) => SECTIONS.filter((s) => !s.adminOnly || role === 'admin');

export const currentSection = (sections, path) =>
  sections.find((s) => (s.href === '/admin' ? path === '/admin' : path?.startsWith(s.href))) ?? null;
