'use client';

// Week switcher for Jadual Makmal: ← / dropdown / →. Choosing a week opens it straight away (no "Lihat" press),
// without reloading the page.
import Form from 'next/form';
import Link from 'next/link';

export default function WeekPicker({ weeks, week, currentWeek }) {
  const idx = weeks.findIndex((w) => w.week === week);
  const prev = weeks[idx - 1]; const next = weeks[idx + 1];
  const href = (w) => `/?v=jadual&w=${w}`;
  return (
    <div className="week-nav">
      {prev ? <Link className="btn" href={href(prev.week)} scroll={false} aria-label={`Minggu ${prev.week}`}>←<span className="wide-only"> Minggu {prev.week}</span></Link>
        : <span className="btn disabled" aria-hidden="true">←</span>}
      <Form action="/" scroll={false} className="week-pick">
        <input type="hidden" name="v" value="jadual" />
        <select name="w" defaultValue={week} key={week} aria-label="Pilih minggu" onChange={(e) => e.currentTarget.form.requestSubmit()}>
          {weeks.map((w) => <option key={w.week} value={w.week}>{w.label}{w.week === currentWeek ? ' (minggu ini)' : ''}</option>)}
        </select>
        <noscript><button className="btn">Lihat</button></noscript>
      </Form>
      {next ? <Link className="btn" href={href(next.week)} scroll={false} aria-label={`Minggu ${next.week}`}><span className="wide-only">Minggu {next.week} </span>→</Link>
        : <span className="btn disabled" aria-hidden="true">→</span>}
    </div>
  );
}
