'use client';

// VIEW Penyata Cuti (login only): one row per teacher from their PENYATA CUTI sheet.
import { useActionState, useState } from 'react';
import { resetLeaveLink } from '@/app/admin/actions';
import { fmtDate, fmtDateTime, num } from '../ui/format';

const isSick = (t) => /SAKIT/.test(t.type);
const SORTS = { nama: 'Nama', baki: 'Baki CRK (sedikit dahulu)', guna: 'Paling banyak cuti' };

// Personal link for one teacher: copy a ready WhatsApp message; admins can also replace the link.
function LinkCell({ r, canReset }) {
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState(resetLeaveLink, undefined);
  if (!r.link_token) return '—';
  const copy = async () => {
    const url = `${location.origin}/cuti/${r.link_token}`;
    await navigator.clipboard.writeText(`Salam ${r.name}. Penyata cuti anda (pautan peribadi, jangan kongsi):\n${url}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <span className="link-cell">
      <button type="button" className="btn small" onClick={copy}>{copied ? 'Disalin ✓' : 'Salin pautan'}</button>
      <small className="muted">{r.link_viewed_at ? `Dibuka ${fmtDate(r.link_viewed_at)}` : 'Belum dibuka'}</small>
      {canReset && (
        <form action={action}>
          <input type="hidden" name="name" value={r.name} />
          <button className="linkish" disabled={pending} onClick={(e) => {
            if (!confirm(`Tukar pautan ${r.name}? Pautan lama tidak akan berfungsi lagi.`)) e.preventDefault();
          }}>{state?.ok ? 'Ditukar ✓' : 'Tukar pautan'}</button>
        </form>
      )}
      {state?.error && <small className="row-msg error">{state.error}</small>}
    </span>
  );
}

export default function LeaveTable({ rows, total, canReset = false }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('nama');
  const needle = q.trim().toLowerCase();
  const enriched = rows.map((r) => {
    const sick = r.types.filter(isSick).reduce((a, t) => a + t.used, 0);
    const other = r.types.filter((t) => !isSick(t) && !/REHAT KHAS/.test(t.type)).reduce((a, t) => a + t.used, 0);
    const baki = r.crk_entitled != null ? r.crk_entitled - r.crk_used : null;
    return { ...r, sick, other, baki, total: r.crk_used + sick + other };
  });
  const shown = enriched
    .filter((r) => !needle || r.name.toLowerCase().includes(needle))
    .sort((a, b) => (sort === 'baki' ? (a.baki ?? 99) - (b.baki ?? 99)
      : sort === 'guna' ? b.total - a.total : (a.position ?? 0) - (b.position ?? 0)));
  const synced = rows.reduce((m, r) => (r.synced_at > m ? r.synced_at : m), '');

  return (
    <>
      <div className="table-tools">
        <label className="search"><span aria-hidden="true">⌕</span>
          <input type="search" placeholder="Cari nama guru…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari nama guru" />
        </label>
        <label className="sort">Susun
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <p className="muted lab-meta">{rows.length} guru · dikemas kini {fmtDateTime(synced)} (sekali sehari, atau Sync sekarang)</p>
      <p className="note">📲 <strong>Pautan guru:</strong> setiap guru boleh melihat penyata <em>sendiri</em> tanpa log masuk. Tekan
        <strong> Salin pautan</strong> dan hantar terus kepada guru itu (WhatsApp peribadi, bukan kumpulan).</p>
      {total > rows.length && (
        <p className="note">Sedang dibaca: <strong>{rows.length} daripada {total} guru</strong>. Penyata dibaca sedikit demi sedikit
          (kira-kira 3 minit setiap jam), jadi senarai akan lengkap dalam beberapa jam. Tekan Sync sekarang untuk mempercepatkan.</p>
      )}
      <div className="table-scroll">
        <table className="sheet-table leave">
          <thead>
            <tr><th className="c">Bil</th><th>Nama guru</th><th className="c">Layak CRK</th><th className="c">CRK diguna</th>
              <th>Baki CRK</th><th className="c">Cuti sakit</th><th className="c">Lain-lain</th><th>Penyata</th><th>Pautan guru</th></tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const pct = r.crk_entitled ? Math.min(100, (r.crk_used / r.crk_entitled) * 100) : 0;
              const tone = r.baki == null ? 'neutral' : r.baki <= 0 ? 'critical' : r.baki <= 2 ? 'warning' : 'good';
              return (
                <tr key={r.name}>
                  <td className="c muted">{r.position}</td>
                  <td>{r.name}</td>
                  <td className="c">{r.crk_entitled ?? '—'}</td>
                  <td className="c">{num.format(r.crk_used)}</td>
                  <td>
                    <span className="baki">
                      <span className={`chip ${tone}`}>{r.baki == null ? '—' : `${num.format(r.baki)} hari`}</span>
                      <span className="progress-track" aria-hidden="true"><span className="progress-bar" style={{ width: `${pct}%` }} /></span>
                    </span>
                  </td>
                  <td className="c">{num.format(r.sick)}</td>
                  <td className="c" title={r.types.filter((t) => !isSick(t) && !/REHAT KHAS/.test(t.type) && t.used).map((t) => `${t.type}: ${t.used}`).join('\n')}>{num.format(r.other)}</td>
                  <td>{r.sheet_url ? <a href={r.sheet_url} target="_blank" rel="noopener noreferrer">Buka ↗</a> : '—'}</td>
                  <td><LinkCell r={r} canReset={canReset} /></td>
                </tr>
              );
            })}
            {!shown.length && <tr><td colSpan={9} className="muted c">Tiada data.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
