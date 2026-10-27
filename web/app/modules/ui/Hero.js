// The banner from the "SEMAKAN TINJAUAN KUTIPAN DATA" sheet, rebuilt as a live, responsive header:
// school blue with light waves, crest, title, and the people behind the dashboard.
import { BRAND } from './brand';

function Waves() {
  // Thin flowing lines like the banner's background; decorative only.
  const lines = Array.from({ length: 9 }, (_, i) => {
    const y = 40 + i * 26;
    return `M-50 ${y} C 300 ${y - 120 + i * 8}, 700 ${y + 140 - i * 6}, 1100 ${y - 30} S 1500 ${y + 90}, 1700 ${y - 40}`;
  });
  return (
    <svg className="hero-waves" viewBox="0 0 1600 360" preserveAspectRatio="none" aria-hidden="true">
      {lines.map((d, i) => <path key={i} d={d} style={{ opacity: 0.18 + (i % 3) * 0.12 }} />)}
    </svg>
  );
}

export default function Hero({ children, compact = false }) {
  return (
    <header className={compact ? 'hero compact' : 'hero'}>
      <Waves />
      <div className="hero-inner">
        <div className="hero-main">
          <div className="hero-school">
            <img src={BRAND.crest} alt={`Lencana ${BRAND.school}`} width="56" height="71" />
            <div>
              <strong>{BRAND.school}</strong>
              <span>{BRAND.motto}</span>
            </div>
          </div>
          <h1>
            <span className="hero-kicker">Pengurusan</span>
            <span className="hero-title">Data dan Maklumat</span>
          </h1>
          {!compact && <p className="hero-lead">Tugasan, borang dan analisis sekolah di satu tempat, dikemas kini setiap jam.</p>}
          {!compact && children}
        </div>
        {!compact && BRAND.people.length > 0 && (
          <ul className="hero-people" aria-label="Pengurusan">
            {BRAND.people.map((p) => (
              <li key={p.name}>
                <img src={p.photo} alt="" width="120" height="120" />
                <strong>{p.name}</strong>
                <span>{p.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}
