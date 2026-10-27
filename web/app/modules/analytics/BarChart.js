import { num as fmt } from '../ui/format';

// Single-series horizontal bar chart: the title names the series, so no legend.
// Each row is label | bar | value, so the chart doubles as its own table view.
export default function BarChart({ title, source, items, updatedAt }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <figure className="chart">
      <figcaption>
        <strong>{title}</strong>
        <small className="muted">
          Jumlah {fmt.format(total)}
          {source && <> · {source}</>}
          {updatedAt && <> · dikemas kini {new Date(updatedAt).toLocaleDateString('ms-MY')}</>}
        </small>
      </figcaption>
      <ul className="bars" role="table" aria-label={title}>
        {items.map((i) => (
          <li key={i.label} role="row" tabIndex={0}>
            <span role="cell" className="bar-label">{i.label}</span>
            <span role="cell" className="bar-track" aria-hidden="true">
              <span className={i.value ? 'bar' : 'bar zero'} style={{ width: `${(i.value / max) * 100}%` }} />
            </span>
            <span role="cell" className="bar-value">{fmt.format(i.value)}</span>
            <span className="tip" role="tooltip">
              {i.label}: <b>{fmt.format(i.value)}</b>
              {total > 0 && <> ({Math.round((i.value / total) * 100)}%)</>}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
