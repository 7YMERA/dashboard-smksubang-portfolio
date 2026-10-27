import { num } from '../ui/format';

export default function StatCards({ metrics }) {
  if (!metrics.length) return null;
  return (
    <div className="cards">
      {metrics.map((m) => (
        <div className="card" key={m.key}>
          <span className="muted">{m.label}</span>
          <strong>{num.format(m.value)}<small>{m.unit ?? '/100'}</small></strong>
        </div>
      ))}
    </div>
  );
}
