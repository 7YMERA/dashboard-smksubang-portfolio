import { apiFetch } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import PageHead from '../../../modules/admin/PageHead';
import Accounts from '../../../modules/admin/Accounts';

export default async function Akaun() {
  const admin = await requireAdmin();
  if (admin.role !== 'admin') {
    return <><PageHead title="Akaun" /><p className="note">Hanya admin boleh mengurus akaun.</p></>;
  }
  const accounts = await apiFetch('api/admin/accounts', { token: admin.token }).catch((e) => ({ error: e.message }));
  return (
    <>
      <PageHead title="Akaun">Siapa boleh masuk Panel Admin. <b>Pentadbir</b> boleh melihat semua tetapi tidak boleh mengubah. <b>Admin</b> boleh mengubah semua.</PageHead>
      {accounts?.error
        ? <p className="error">Senarai akaun tidak dapat dimuatkan ({accounts.error}). Cuba muat semula halaman.</p>
        : <Accounts accounts={accounts} />}
    </>
  );
}
