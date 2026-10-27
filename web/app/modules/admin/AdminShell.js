'use client';

// Panel Admin frame: a sidebar (collapsible on computers, a slide-out menu on phones) with every section,
// who is logged in, the theme switch and Log keluar always at the bottom.
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/admin/actions';
import ThemeToggle from '../ui/ThemeToggle';
import { BRAND } from '../ui/brand';
import Icon from './icons';

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

const ROLE = { admin: 'Admin', pentadbir: 'Pentadbir · lihat sahaja' };
const initials = (s) => (s || '?').replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function AdminShell({ admin, badges, children }) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false); // phone menu

  useEffect(() => { try { setCollapsed(localStorage.getItem('sidebar') === 'collapsed'); } catch {} }, []);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sidebar', next ? 'collapsed' : 'open'); } catch {}
  };

  const sections = SECTIONS.filter((s) => !s.adminOnly || admin.role === 'admin');
  const current = sections.find((s) => (s.href === '/admin' ? path === '/admin' : path.startsWith(s.href))) ?? sections[0];

  return (
    <div className={`shell${collapsed ? ' collapsed' : ''}${open ? ' open' : ''}`}>
      <aside className="sidebar" aria-label="Menu Panel Admin">
        <div className="side-head">
          <a href="/admin" className="side-brand" title="Panel Admin">
            <img src={BRAND.crest} alt="" width="30" height="38" />
            <span className="side-text"><strong>Panel Admin</strong><small>{BRAND.school}</small></span>
          </a>
          <button type="button" className="side-icon-btn desktop-only" onClick={toggle}
            aria-label={collapsed ? 'Besarkan menu' : 'Kecilkan menu'} title={collapsed ? 'Besarkan menu' : 'Kecilkan menu'}>
            <Icon name={collapsed ? 'expand' : 'collapse'} />
          </button>
          <button type="button" className="side-icon-btn phone-only" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <Icon name="close" />
          </button>
        </div>

        <nav className="side-nav">
          {sections.map((s) => {
            const n = s.badge ? badges?.[s.badge] : 0;
            return (
              <a key={s.href} href={s.href} className="side-link" aria-current={s === current ? 'page' : undefined} title={s.label}>
                <Icon name={s.icon} />
                <span className="side-text">{s.label}</span>
                {n > 0 && <span className={`side-badge ${s.badge}`} aria-label={`${n} perkara`}>{n}</span>}
              </a>
            );
          })}
        </nav>

        <div className="side-foot">
          <div className="side-user" title={`${admin.name || ''} ${admin.email || ''}`}>
            <span className="avatar" aria-hidden="true">{initials(admin.name || admin.email)}</span>
            <span className="side-text">
              <strong>{admin.name || admin.email}</strong>
              <small>{ROLE[admin.role] ?? admin.role}</small>
            </span>
          </div>
          <div className="side-theme"><ThemeToggle /></div>
          <a href="/" className="side-link" title="Lihat dashboard awam">
            <Icon name="external" /><span className="side-text">Lihat dashboard</span>
          </a>
          <form action={logout}>
            <button type="submit" className="side-link logout" title="Log keluar">
              <Icon name="logout" /><span className="side-text">Log keluar</span>
            </button>
          </form>
        </div>
      </aside>

      <button type="button" className="scrim" aria-label="Tutup menu" tabIndex={-1} onClick={() => setOpen(false)} />

      <div className="shell-main">
        <header className="phone-bar">
          <button type="button" className="menu-btn" onClick={() => setOpen(true)} aria-label="Buka menu" aria-expanded={open}>
            <Icon name="menu" size={22} /> Menu
          </button>
          <strong>{current.label}</strong>
          <img src={BRAND.crest} alt="" width="24" height="30" />
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
