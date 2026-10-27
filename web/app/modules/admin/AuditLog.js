// MODULE Log Audit (admin + pentadbir): who did what in Panel Admin, newest first.
// Entries cannot be edited or deleted (see supabase/migrations/20261028000000_audit_log.sql).
import { fmtDateTime } from '../ui/format';

export const AUDIT_TYPES = ['login', 'link', 'announcement', 'account', 'sync'];
const FILTERS = [['', 'Semua'], ['login', 'Log masuk'], ['link', 'Pautan'], ['announcement', 'Pengumuman'], ['account', 'Akaun'], ['sync', 'Sync & data']];

const ACTION = {
  login: 'Log masuk', login_failed: 'Log masuk gagal', logout: 'Log keluar',
  'link.create': 'Tambah pautan', 'link.update': 'Ubah pautan', 'link.delete': 'Padam pautan',
  'announcement.create': 'Tambah pengumuman', 'announcement.update': 'Ubah pengumuman', 'announcement.delete': 'Padam pengumuman',
  'account.create': 'Tambah akaun', 'account.update': 'Ubah akaun', 'account.password': 'Kata laluan baharu', 'account.setup_link': 'Pautan kata laluan baharu', 'account.password_set': 'Kata laluan ditetapkan sendiri', 'account.delete': 'Buang akaun',
  'sync.request': 'Sync sekarang', 'leave.link_reset': 'Tukar pautan penyata cuti', 'metric.update': 'Ubah angka', 'data.import': 'Import data',
};

const FIELD = { title: 'tajuk', url: 'URL', category: 'kategori', description: 'keterangan', sort_order: 'susunan', is_active: 'aktif',
  tracker_key: 'kemajuan', body: 'butiran', expires_at: 'tamat', role: 'peranan', name: 'nama', method: 'cara', sebab: 'sebab', emel: 'emel' };

const show = (v) => (v === null || v === undefined || v === '' ? '(kosong)' : v === true ? 'ya' : v === false ? 'tidak' : String(v));

function describe(details) {
  if (!details) return '';
  return Object.entries(details).map(([k, v]) => {
    const label = FIELD[k] ?? k;
    if (v && typeof v === 'object' && 'kepada' in v) return `${label}: ${show(v.dari)} → ${show(v.kepada)}`;
    return `${label}: ${show(v)}`;
  }).join(' · ');
}

/** Short sentence for the Ringkasan feed, e.g. "Ubah pautan: Borang A". */
export const describeAction = (e) => `${ACTION[e.action] ?? e.action}${e.target ? `: ${e.target}` : ''}`;

const who = (e) => e.actor_name || e.actor_email || (e.actor_role === 'system' ? 'Apps Script' : 'tidak diketahui');

export default function AuditLog({ entries, type = '' }) {
  return (
    <>
      <nav className="audit-filter" aria-label="Tapis log">
        {FILTERS.map(([key, label]) => (
          <a key={key} href={`/admin/audit${key ? `?type=${key}` : ''}`} aria-current={key === type ? 'true' : undefined}>{label}</a>
        ))}
      </nav>
      {entries?.error ? <p className="error">Log tidak dapat dimuatkan ({entries.error}). Sudahkah migrasi audit_log dijalankan?</p>
        : !entries?.length ? <p className="muted">Belum ada rekod.</p>
        : (
          <div className="audit-wrap">
            <table className="audit">
              <thead><tr><th>Masa</th><th>Siapa</th><th>Tindakan</th><th>Butiran</th></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className={e.action === 'login_failed' ? 'fail' : undefined}>
                    <td>{fmtDateTime(e.at)}</td>
                    <td>{who(e)}{e.actor_name && e.actor_email ? <div className="detail">{e.actor_email}</div> : null}</td>
                    <td>{ACTION[e.action] ?? e.action}{e.target ? <div><strong>{e.target}</strong></div> : null}</td>
                    <td className="detail">{describe(e.details)}{e.ip ? <div>IP {e.ip}</div> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <p className="muted">100 rekod terkini ditunjukkan. Rekod tidak boleh diubah atau dipadam, dan disimpan sekurang-kurangnya setahun.</p>
    </>
  );
}
