'use client';

// MODULE Tugasan, full list: the SEMAKAN TINJAUAN KUTIPAN DATA sheet as a filterable table.
import { useState } from 'react';
import { deadlineStatus, fmtDate, num } from '../ui/format';

const FILTERS = ['SEMUA', 'BUKA', 'TUTUP', 'SELESAI'];

export default function TaskTable({ tasks, trackers }) {
  const [filter, setFilter] = useState('SEMUA');
  const [q, setQ] = useState('');
  const byKey = Object.fromEntries(trackers.map((t) => [t.key, t]));
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === 'SEMUA' ? tasks.length : tasks.filter((t) => t.status === f).length]));
  const needle = q.trim().toLowerCase();
  const rows = tasks
    .filter((t) => filter === 'SEMUA' || t.status === filter)
    .filter((t) => !needle || t.title.toLowerCase().includes(needle));

  return (
    <div className="task-table">
      <div className="table-tools">
        <div className="filter-chips" role="group" aria-label="Tapis status">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'SEMUA' ? 'Semua' : f} <span>{counts[f]}</span>
            </button>
          ))}
        </div>
        <label className="search"><span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Cari tugasan…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari tugasan" />
        </label>
      </div>
      <div className="table-scroll">
        <table className="sheet-table">
          <thead>
            <tr><th className="c">Bil</th><th>Tugasan</th><th>Tarikh akhir</th><th>Baki masa</th><th>Status</th><th>Kemajuan</th></tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const s = t.status === 'BUKA' ? deadlineStatus(t.deadline) : null;
              const tr = byKey[t.tracker_key];
              const tone = t.status === 'SELESAI' ? 'good' : t.status === 'BUKA' ? 'warning' : 'neutral';
              return (
                <tr key={t.id}>
                  <td className="c muted">{i + 1}</td>
                  <td>{t.url ? <a href={t.url} target="_blank" rel="noopener noreferrer">{t.title}</a> : t.title}</td>
                  <td className="nowrap">{fmtDate(t.deadline) || '—'}</td>
                  <td>{s ? <span className={`chip ${s.tone}`}>{s.icon} {s.text}</span> : <span className="muted">—</span>}</td>
                  <td><span className={`chip ${tone}`}>{t.status || '—'}</span></td>
                  <td className="nowrap">{tr ? `${num.format(tr.done)}/${num.format(tr.total)}` : <span className="muted">—</span>}</td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={6} className="muted c">Tiada tugasan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
