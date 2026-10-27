'use client';

// MODULE Penghantaran (admin): who hasn't submitted, per tracker, with a one-click copy for WhatsApp.
import { useState } from 'react';
import Progress from '../ui/Progress';
import { fmtDateTime } from '../ui/format';

function reminderText(t) {
  const lines = t.pending.map((p, i) => `${i + 1}. ${p.name}${p.detail ? ` (Pencerap: ${p.detail})` : ''}`);
  return `*${t.title}: belum hantar (${t.pending.length})*\n${lines.join('\n')}`;
}

function TrackerCard({ t }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(reminderText(t));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <article className="tracker-card">
      <header>
        <h3>{t.title}</h3>
        <small className="muted">{t.source} · {fmtDateTime(t.updated_at)}</small>
      </header>
      <Progress tracker={t} />
      {t.pending.length ? (
        <>
          <button type="button" className="btn" onClick={copy}>{copied ? 'Disalin ✓' : `Salin senarai (${t.pending.length})`}</button>
          <ol className="pending">
            {t.pending.map((p, i) => (
              <li key={`${p.name}-${i}`}>{p.name}{p.detail && <small className="muted"> · Pencerap: {p.detail}</small>}</li>
            ))}
          </ol>
        </>
      ) : (
        <p className="chip good">✓ Semua sudah hantar</p>
      )}
    </article>
  );
}

export default function PendingLists({ trackers }) {
  if (!trackers.length) return <p className="muted">Belum ada data. Jalankan syncDashboard dalam Apps Script.</p>;
  return <div className="tracker-grid">{trackers.map((t) => <TrackerCard key={t.key} t={t} />)}</div>;
}
