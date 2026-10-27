// A teacher's own Penyata Cuti, opened from the personal link the Guru Data sends them (no login).
// The link is the key: it shows this one teacher and nothing else, and is never indexed or shared onwards.
import { apiFetch } from '@/lib/api';
import { BRAND } from '../../modules/ui/brand';
import { fmtDateTime, num } from '../../modules/ui/format';
import ThemeToggle from '../../modules/ui/ThemeToggle';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Penyata Cuti Saya · SMK Subang',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const isCrk = (t) => /REHAT KHAS/.test(t.type);
const nice = (s) => s.toLowerCase().replace(/(^|\s|\()\S/g, (c) => c.toUpperCase());

export default async function MyLeave({ params }) {
  const { token } = await params;
  const row = await apiFetch(`api/cuti/${encodeURIComponent(token)}`).catch(() => null);

  return (
    <div className="my-leave-page">
      <header className="my-leave-top">
        <span className="brand"><img src={BRAND.crest} alt="" width="22" height="28" />{BRAND.school}</span>
        <ThemeToggle />
      </header>
      <main className="narrow my-leave">
        {!row ? (
          <div className="locked">
            <h1>Pautan tidak sah</h1>
            <p>Pautan ini salah atau sudah ditukar. Minta pautan baharu daripada Guru Data dan Maklumat.</p>
          </div>
        ) : <Statement row={row} />}
      </main>
    </div>
  );
}

function Statement({ row }) {
  const crk = row.types.find(isCrk);
  const entitled = row.crk_entitled ?? crk?.entitled ?? null;
  const baki = entitled != null ? entitled - row.crk_used : null;
  const tone = baki == null ? '' : baki <= 0 ? 'critical' : baki <= 2 ? 'warning' : 'good';
  const others = row.types.filter((t) => !isCrk(t));
  return (
    <>
      <p className="kicker">Penyata Cuti {row.year ?? ''}</p>
      <h1>{row.name}</h1>

      <div className={`my-crk tile ${tone}`}>
        <span className="tile-label">Baki Cuti Rehat Khas (CRK)</span>
        <strong className="tile-value">{baki == null ? '—' : `${num.format(baki)} hari`}</strong>
        <span className="tile-note">Layak {entitled ?? '—'} · Sudah diguna {num.format(row.crk_used)}</span>
      </div>

      <h2>Cuti lain</h2>
      {others.length ? (
        <ul className="my-types">
          {others.map((t) => (
            <li key={t.type}>
              <span>{nice(t.type)}</span>
              <strong>{num.format(t.used)} hari{t.entitled != null ? <small className="muted"> / {t.entitled}</small> : null}</strong>
            </li>
          ))}
        </ul>
      ) : <p className="muted">Tiada cuti lain direkodkan.</p>}

      {row.sheet_url && <p><a className="btn" href={row.sheet_url} target="_blank" rel="noopener noreferrer">Buka penyata penuh ↗</a></p>}
      <p className="muted small">Dikemas kini {fmtDateTime(row.synced_at)}. Jika ada yang tidak betul, hubungi Guru Data dan Maklumat.</p>
      <p className="note small">🔒 Pautan ini khas untuk anda. Simpan (bookmark) untuk semakan akan datang, dan jangan kongsi dengan orang lain.</p>
    </>
  );
}
