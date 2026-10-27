// MODULE Status Sync (admin): when the Apps Script last ran, and the data problems it found.
import { fmtDateTime } from '../ui/format';
import SyncNow from './SyncNow';

const HOUR = 3600 * 1000;

export default function SyncStatus({ runs, request }) {
  if (!runs.length) {
    return (
      <div className="sync">
        <p className="chip critical">⚠ Belum pernah sync. Pasang Apps Script (google-apps-script/README.md).</p>
        <SyncNow request={request} />
      </div>
    );
  }
  const last = runs[0];
  const age = Date.now() - Date.parse(last.ran_at);
  const fresh = age < 2 * HOUR;
  return (
    <div className="sync">
      <p>
        <span className={`chip ${fresh ? 'good' : 'critical'}`}>{fresh ? '✓ Aktif' : '⚠ Lewat'}</span>{' '}
        Sync terakhir: <strong>{fmtDateTime(last.ran_at)}</strong>
        {!fresh && ' (sepatutnya setiap jam: semak trigger Apps Script)'}
      </p>
      <SyncNow request={request} />
      <p className="muted">
        {Object.entries(last.summary || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}
      </p>
      {last.warnings?.length ? (
        <>
          <h3>⚠ {last.warnings.length} masalah data untuk dibetulkan di Google Sheets</h3>
          <ul className="warnings">
            {last.warnings.map((w, i) => <li key={i}><strong>{w.source}</strong>: {w.message}</li>)}
          </ul>
        </>
      ) : (
        <p className="chip good">✓ Tiada masalah data</p>
      )}
      <details>
        <summary>Sejarah sync ({runs.length})</summary>
        <ul className="muted">
          {runs.map((r) => <li key={r.ran_at}>{fmtDateTime(r.ran_at)}: {r.warnings?.length || 0} amaran</li>)}
        </ul>
      </details>
    </div>
  );
}
