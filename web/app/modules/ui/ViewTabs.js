'use client';

// The view switcher ("slider") under the top bar. Every view has its own URL; <Link> swaps the view
// without reloading the page, and the clicked tab pulses until the new view arrives.
import { useEffect, useRef } from 'react';
import Link, { useLinkStatus } from 'next/link';
import { VIEWS } from './views';

function Label({ v, loggedIn }) {
  const { pending } = useLinkStatus();
  return (
    <span className={pending ? 'tab-label pending' : 'tab-label'}>
      <span aria-hidden="true">{v.icon}</span> {v.label}{v.locked && !loggedIn && <span className="lock" title="Perlu log masuk"> 🔒</span>}
    </span>
  );
}

export default function ViewTabs({ active, loggedIn }) {
  const bar = useRef(null);
  // On phones not every tab fits: keep the active one in view.
  useEffect(() => {
    bar.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [active]);
  return (
    <nav className="view-tabs" aria-label="Pilih dashboard">
      <div className="view-tabs-inner" ref={bar}>
        {VIEWS.map((v) => (
          <Link key={v.id} href={v.id === 'semakan' ? '/' : `/?v=${v.id}`}
            aria-current={active === v.id ? 'page' : undefined} className={active === v.id ? 'active' : undefined}>
            <Label v={v} loggedIn={loggedIn} />
          </Link>
        ))}
      </div>
    </nav>
  );
}
