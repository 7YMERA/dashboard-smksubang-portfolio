// MODULE Pengumuman
import { fmtDate } from '../ui/format';

export default function Announcements({ items }) {
  if (!items.length) return null;
  return (
    <section className="announcements" aria-label="Pengumuman">
      {items.map((a) => (
        <article key={a.id} className="announcement">
          <strong>📢 {a.title}</strong>
          {a.body && <p>{a.body}</p>}
          <small className="muted">
            {fmtDate(a.published_at)}{a.expires_at && <> · sehingga {fmtDate(a.expires_at)}</>}
          </small>
        </article>
      ))}
    </section>
  );
}
