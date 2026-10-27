import { num } from '../ui/format';

// Two (or more) series per category, e.g. Kendiri vs Pencerapan 1 per aspect.
// Scores are 0–100, so bars start at 0 and share that scale. Legend + value at every bar tip,
// so the series are never told apart by colour alone.
export default function GroupedBarChart({ title, source, series, items, updatedAt }) {
  const max = Math.max(100, ...items.flatMap((i) => i.values ?? []).filter((v) => v != null));
  return (
    <figure className="chart">
      <figcaption>
        <strong>{title}</strong>
        <small className="muted">
          {source}
          {updatedAt && <> · dikemas kini {new Date(updatedAt).toLocaleDateString('ms-MY')}</>}
        </small>
      </figcaption>
      <ul className="legend" aria-label="Petunjuk">
        {series.map((s, k) => <li key={s}><span className={`swatch s${k + 1}`} aria-hidden="true" />{s}</li>)}
      </ul>
      <ul className="grouped" role="table" aria-label={title}>
        {items.map((i) => (
          <li key={i.label} role="row" tabIndex={0}>
            <span role="cell" className="bar-label">{i.label}</span>
            <span role="cell" className="bar-stack">
              {series.map((s, k) => {
                const v = i.values?.[k];
                return (
                  <span key={s} className="bar-line">
                    <span className="bar-track" aria-hidden="true">
                      <span className={`bar s${k + 1}${v ? '' : ' zero'}`} style={{ width: v == null ? 0 : `${(v / max) * 100}%` }} />
                    </span>
                    <span className="bar-value">{v == null ? '—' : num.format(v)}</span>
                  </span>
                );
              })}
            </span>
            <span className="tip" role="tooltip">
              {i.label}: {series.map((s, k) => `${s} ${i.values?.[k] == null ? '—' : num.format(i.values[k])}`).join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
