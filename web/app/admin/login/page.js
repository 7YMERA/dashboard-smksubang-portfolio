import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/session';
import LoginForm from './LoginForm';
import TopBar from '../../modules/ui/TopBar';

export const metadata = { title: 'Log masuk · Panel Admin SMK Subang' };

export default async function LoginPage({ searchParams }) {
  if (await getAdmin()) redirect('/admin');
  const { error } = await searchParams;
  return (
    <>
    <TopBar login={false} />
    <main className="narrow login-page">
      <h1>Log masuk Panel Admin</h1>
      <p className="muted">Satu log masuk untuk semua. Akaun anda menentukan akses:</p>
      <ul className="role-list">
        <li><strong>Admin</strong>: urus pautan, pengumuman dan semua tetapan.</li>
        <li><strong>Pentadbir</strong> (Pengetua, PK): lihat semua maklumat termasuk senarai belum hantar, tanpa mengubah.</li>
      </ul>
      <p className="muted">Belum ada akaun? Minta admin dashboard untuk membuatnya.</p>
      {error && <p className="error" role="alert">{String(error).slice(0, 300)}</p>}
      <LoginForm />
      <p><a href="/">← Kembali ke dashboard</a></p>
    </main>
    </>
  );
}
