import { num } from './format';

// "133/150 dihantar" + bar. `onColor` = drawn on a coloured button (white bar on a translucent track).
export default function Progress({ tracker, onColor = false }) {
  if (!tracker || !tracker.total) return null;
  const pct = Math.round((tracker.done / tracker.total) * 100);
  return (
    <span className={onColor ? 'progress on-color' : 'progress'}>
      <span className="progress-text">
        {num.format(tracker.done)}/{num.format(tracker.total)} dihantar · {pct}%
      </span>
      <span className="progress-track" aria-hidden="true">
        <span className="progress-bar" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}
