'use client';

// Panel Admin frame: the same top bar as the public page (name button → menu with every section,
// theme and Log keluar) and a row of section tabs under it, like the view tabs on the public page.
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import TopBar from '../ui/TopBar';
import { currentSection, sectionsFor } from './sections';

export default function AdminShell({ admin, badges, children }) {
  const path = usePathname();
  const bar = useRef(null);
  const sections = sectionsFor(admin.role);
  const current = currentSection(sections, path) ?? sections[0];

  // On phones not every tab fits: keep the active one in view.
  useEffect(() => {
    bar.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [path]);

  return (
    <>
      <TopBar admin={admin} badges={badges} title="Panel Admin" home="/admin" />
      <nav className="view-tabs admin-tabs" aria-label="Bahagian Panel Admin">
        <div className="view-tabs-inner" ref={bar}>
          {sections.map((s) => {
            const n = s.badge ? badges?.[s.badge] : 0;
            return (
              <a key={s.href} href={s.href} aria-current={s === current ? 'page' : undefined} className={s === current ? 'active' : undefined}>
                {s.label}
                {n > 0 && <span className={`count-badge ${s.badge}`} aria-label={`${n} perkara`}>{n}</span>}
              </a>
            );
          })}
        </div>
      </nav>
      <main className="admin-main">{children}</main>
    </>
  );
}
