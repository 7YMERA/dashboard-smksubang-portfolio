// "Tetapkan kata laluan": opened from the one-time link an admin sends (Telegram) when adding an account or
// when someone forgot their password. The person chooses their own password and goes straight into Panel Admin.
import { apiFetch } from '@/lib/api';
import TopBar from '../../../modules/ui/TopBar';
import SetupForm from './SetupForm';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Tetapkan kata laluan · Panel Admin SMK Subang',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const ROLE = { admin: 'Admin', pentadbir: 'Pentadbir' };

export default async function SetPassword({ params }) {
  const { token } = await params;
  const info = await apiFetch(`api/auth/setup/${encodeURIComponent(token)}`).catch((e) => ({ error: e.message }));
  return (
    <>
      <TopBar login={false} />
      <main className="narrow login-page">
        {info.error ? (
          <div className="locked">
            <h1>Pautan tidak boleh digunakan</h1>
            <p>{info.error}</p>
            <p>Minta admin dashboard menekan <strong>Pautan kata laluan baharu</strong> untuk anda dalam Panel Admin → Akaun.</p>
            <a className="btn" href="/admin/login">Ke halaman log masuk</a>
          </div>
        ) : (
          <>
            <h1>Tetapkan kata laluan</h1>
            <p className="muted">Akaun <strong>{info.name || info.email}</strong> ({ROLE[info.role] ?? info.role}) · {info.email}</p>
            <p className="muted">Pilih kata laluan sekurang-kurangnya 8 aksara. Anda akan terus masuk ke Panel Admin. Pautan ini boleh digunakan sekali sahaja.</p>
            <SetupForm token={token} email={info.email} />
          </>
        )}
      </main>
    </>
  );
}
