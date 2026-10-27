'use client';

// MODULE Pautan: searchable, colour-coded link buttons (like the mylink page) with live progress.
import { useMemo, useState } from 'react';
import Progress from '../ui/Progress';

// Fixed order, assigned to categories in the order they first appear (all pass 4.5:1 with white text).
const COLORS = ['#c62828', '#6b3fc7', '#1b7a43', '#b4530a', '#1f63b5', '#0f7470', '#a3326e'];

export default function LinkHub({ links, trackers }) {
  const [q, setQ] = useState('');
  const byKey = useMemo(() => Object.fromEntries(trackers.map((t) => [t.key, t])), [trackers]);
  const colorOf = useMemo(() => {
    const cats = [...new Set(links.map((l) => l.category))];
    return Object.fromEntries(cats.map((c, i) => [c, COLORS[i % COLORS.length]]));
  }, [links]);

  const needle = q.trim().toLowerCase();
  const shown = needle
    ? links.filter((l) => `${l.title} ${l.category} ${l.description ?? ''}`.toLowerCase().includes(needle))
    : links;
  const groups = shown.reduce((acc, l) => ((acc[l.category] ||= []).push(l), acc), {});

  return (
    <div className="link-hub">
      <label className="search">
        <span aria-hidden="true">⌕</span>
        <input type="search" placeholder="Cari pautan…" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Cari pautan" />
      </label>
      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat} className="group">
          <h3>{cat}</h3>
          <div className="link-buttons">
            {items.map((l) => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="link-btn"
                 style={{ '--btn': colorOf[l.category] }}>
                <span className="link-title">{l.title}<span className="arrow" aria-hidden="true">↗</span></span>
                {l.description && <small>{l.description}</small>}
                <Progress tracker={byKey[l.tracker_key]} onColor />
              </a>
            ))}
          </div>
        </div>
      ))}
      {!shown.length && <p className="muted">Tiada pautan sepadan dengan “{q}”.</p>}
    </div>
  );
}
