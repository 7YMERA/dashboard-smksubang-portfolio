'use client';

// The name button at the top right. Tap it and a menu opens with what this account can do
// (Panel Admin sections for its role, theme, Log keluar). On computers it drops down under the
// button; on phones it slides up from the bottom so every item is easy to tap.
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/admin/actions';
import Icon from '../admin/icons';
import { ROLE, currentSection, sectionsFor } from '../admin/sections';
import ThemeToggle from './ThemeToggle';

// Name without brackets or titles (Puan, Encik, Dr, Hj…), so "Puan Aisyah Rahman" shows as Aisyah / AR.
const TITLES = /^(puan|pn|encik|en|cik|tuan|dr|hj|hjh|haji|hajah|ustaz|ustazah|cikgu|datin|dato'?|datuk|prof)\.?$/i;
const words = (s) => (s || '').replace(/\(.*?\)/g, '').trim().split(/\s+/).filter((w) => w && !TITLES.test(w));
const initials = (s) => words(s).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
// "Nor Aisyah", "Siti Aminah", "Mohd Faiz": a first word like these is not enough on its own.
const PREFIX = /^(nor|nur|siti|muhammad|muhamad|mohamad|mohammad|mohd|muhd|ahmad|abdul|abd|wan|nik|che|tengku|syed|sharifah|megat|puteri)$/i;
const firstName = (s) => {
  const w = words(s);
  return (PREFIX.test(w[0] || '') && w[1] ? `${w[0]} ${w[1]}` : w[0]) || 'Akaun';
};

export default function AccountMenu({ admin, badges = {} }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const button = useRef(null);
  const panel = useRef(null);

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return undefined;
    panel.current?.querySelector('a, button')?.focus();
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onDown = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const name = admin.name || admin.email;
  const sections = sectionsFor(admin.role);
  const current = currentSection(sections, path);
  const alerts = (badges.pending || 0) + (badges.problems || 0);

  return (
    <div className={`account${open ? ' open' : ''}`} ref={wrap}>
      <button type="button" className="account-btn" ref={button} onClick={() => setOpen(!open)}
        aria-haspopup="true" aria-expanded={open} aria-controls="account-menu" title={name}>
        <span className="avatar" aria-hidden="true">{initials(name)}</span>
        <span className="account-name">{firstName(admin.name || (admin.email || '').split('@')[0])}</span>
        {alerts > 0 && <span className="account-dot" aria-label={`${alerts} perkara perlu perhatian`} />}
        <svg className="account-caret" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      <button type="button" className="account-scrim" aria-label="Tutup menu" tabIndex={-1} onClick={() => setOpen(false)} />

      <div className="account-menu" id="account-menu" ref={panel} hidden={!open}>
        <div className="account-who">
          <span className="avatar big" aria-hidden="true">{initials(name)}</span>
          <span className="account-who-text">
            <strong>{name}</strong>
            {admin.name && admin.email && <small>{admin.email}</small>}
            <span className="role-chip">{ROLE[admin.role] ?? admin.role}</span>
          </span>
        </div>

        <nav aria-label="Panel Admin">
          <p className="account-group">Panel Admin</p>
          {sections.map((s) => {
            const n = s.badge ? badges[s.badge] : 0;
            return (
              <a key={s.href} href={s.href} className="account-item" aria-current={s === current ? 'page' : undefined}>
                <Icon name={s.icon} />
                <span>{s.label}</span>
                {n > 0 && <span className={`count-badge ${s.badge}`} aria-label={`${n} perkara`}>{n}</span>}
              </a>
            );
          })}
        </nav>

        <div className="account-sep" />
        <a href="/" className="account-item" aria-current={path === '/' ? 'page' : undefined}>
          <Icon name="external" /><span>Lihat dashboard</span>
        </a>
        <div className="account-item account-theme">
          <span>Tema</span><ThemeToggle />
        </div>
        <form action={logout}>
          <button type="submit" className="account-item logout"><Icon name="logout" /><span>Log keluar</span></button>
        </form>
      </div>
    </div>
  );
}
