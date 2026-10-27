// MODULE Tugasan: open tasks with deadline countdown and progress; closed ones under "Sejarah".
import Progress from '../ui/Progress';
import { deadlineStatus, fmtDate } from '../ui/format';

const OPEN = 'BUKA';

function StatusChip({ status }) {
  const tone = status === 'SELESAI' ? 'good' : status === OPEN ? 'warning' : 'neutral';
  const icon = status === 'SELESAI' ? '✓' : status === OPEN ? '⏳' : '•';
  return <span className={`chip ${tone}`}>{icon} {status || '—'}</span>;
}

export default function TaskBoard({ tasks, trackers, showHistory = false }) {
  const byKey = Object.fromEntries(trackers.map((t) => [t.key, t]));
  const open = tasks.filter((t) => t.status === OPEN)
    .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
  const rest = tasks.filter((t) => t.status !== OPEN);

  return (
    <>
      {open.length ? (
        <div className="task-grid">
          {open.map((t) => {
            const s = deadlineStatus(t.deadline);
            return (
              <article key={t.id} className={`task-card tone-${s.tone}`}>
                <span className={`chip ${s.tone}`}>{s.icon} {s.text}</span>
                <h3>{t.url ? <a href={t.url} target="_blank" rel="noopener noreferrer">{t.title}</a> : t.title}</h3>
                <p className="muted">Tarikh akhir: {fmtDate(t.deadline) || '—'}</p>
                <Progress tracker={byKey[t.tracker_key]} />
              </article>
            );
          })}
        </div>
      ) : (
        <p className="muted">Tiada tugasan terbuka. ✓</p>
      )}

      {rest.length > 0 && showHistory && (
        <details className="history">
          <summary>Sejarah tugasan ({rest.length})</summary>
          <table>
            <thead><tr><th>Tugasan</th><th>Tarikh akhir</th><th>Status</th></tr></thead>
            <tbody>
              {rest.map((t) => (
                <tr key={t.id}>
                  <td>{t.url ? <a href={t.url} target="_blank" rel="noopener noreferrer">{t.title}</a> : t.title}</td>
                  <td>{fmtDate(t.deadline) || '—'}</td>
                  <td><StatusChip status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </>
  );
}
