// Ringkasan: the Panel Admin home. Big tiles with the few numbers that matter, each opening its section.
import { apiFetch } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { getOverview, summarise } from '@/lib/admin-data';
import { fmtDateTime } from '../../modules/ui/format';
import Icon from '../../modules/admin/icons';
import { describeAction } from '../../modules/admin/AuditLog';

function greeting() {
  const h = Number(new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kuala_Lumpur' }));
  return h < 12 ? 'Selamat pagi' : h < 15 ? 'Selamat tengah hari' : h < 19 ? 'Selamat petang' : 'Selamat malam';
}

function Tile({ href, icon, label, value, note, tone = '' }) {
  return (
    <a href={href} className={`tile ${tone}`}>
      <span className="tile-icon"><Icon name={icon} size={22} /></span>
      <span className="tile-label">{label}</span>
      <strong className="tile-value">{value}</strong>
      {note && <span className="tile-note">{note}</span>}
    </a>
  );
}

export default async function Ringkasan() {
  const admin = await requireAdmin();
  const [overview, links, announcements, audit] = await Promise.all([
    getOverview(admin.token),
    apiFetch('api/admin/links', { token: admin.token }).catch(() => []),
    apiFetch('api/admin/announcements', { token: admin.token }).catch(() => []),
    apiFetch('api/admin/audit', { token: admin.token }).catch(() => []),
  ]);
  const s = summarise(overview);
  const now = Date.now();
  const liveAnns = announcements.filter((a) => a.is_active && (!a.expires_at || Date.parse(a.expires_at) > now));
  const open = overview.trackers.filter((t) => t.pending.length);

  return (
    <>
      <header className="page-head welcome">
        <div>
          <p className="kicker">{greeting()},</p>
          <h1>{admin.name || admin.email}</h1>
          <p className="muted">Ini ringkasan hari ini. Tekan mana-mana kotak untuk melihat butirannya.</p>
        </div>
      </header>

      <div className="tiles">
        <Tile href="/admin/sync" icon="sync" label="Sistem" tone={s.syncFresh ? 'good' : 'critical'}
          value={s.lastSync ? (s.syncFresh ? '✓ Aktif' : '⚠ Lewat') : '⚠ Belum sync'}
          note={s.lastSync ? `Sync terakhir ${fmtDateTime(s.lastSync)}` : 'Pasang Apps Script'} />
        <Tile href="/admin/penghantaran" icon="send" label="Belum hantar" tone={s.pending ? 'warning' : 'good'}
          value={s.pending} note={open.length ? `dalam ${open.length} borang` : 'Semua sudah hantar'} />
        <Tile href="/admin/sync" icon="history" label="Masalah data" tone={s.problems ? 'critical' : 'good'}
          value={s.problems} note={s.problems ? 'Perlu dibetulkan dalam Google Sheets' : 'Tiada masalah'} />
        <Tile href="/admin/pautan" icon="link" label="Pautan aktif"
          value={links.filter((l) => l.is_active).length} note={`${links.length} semuanya`} />
        <Tile href="/admin/pengumuman" icon="megaphone" label="Pengumuman dipaparkan"
          value={liveAnns.length} note={liveAnns[0]?.title ?? 'Tiada pengumuman'} />
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Belum hantar</h2>
          {open.length ? (
            <ul className="mini-list">
              {open.map((t) => (
                <li key={t.key}><a href="/admin/penghantaran">{t.title}</a><span className="chip warning">{t.pending.length} orang</span></li>
              ))}
            </ul>
          ) : <p className="muted">Semua borang sudah lengkap.</p>}
        </section>
        <section className="panel">
          <h2>Aktiviti terkini</h2>
          {Array.isArray(audit) && audit.length ? (
            <ul className="mini-list">
              {audit.slice(0, 6).map((e) => (
                <li key={e.id}>
                  <span><strong>{e.actor_name || e.actor_email || 'Sistem'}</strong> · {describeAction(e)}</span>
                  <small className="muted">{fmtDateTime(e.at)}</small>
                </li>
              ))}
            </ul>
          ) : <p className="muted">Belum ada aktiviti.</p>}
          <a href="/admin/audit" className="more">Lihat Log Audit →</a>
        </section>
      </div>
    </>
  );
}
