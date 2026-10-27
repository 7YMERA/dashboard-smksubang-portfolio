import { requireAdmin } from '@/lib/session';
import { getOverview } from '@/lib/admin-data';
import PageHead from '../../../modules/admin/PageHead';
import PendingLists from '../../../modules/admin/PendingLists';

export default async function Penghantaran() {
  const admin = await requireAdmin();
  const overview = await getOverview(admin.token);
  return (
    <>
      <PageHead title="Penghantaran">Siapa belum hantar setiap borang (dari Google Sheets). Tekan <b>Salin senarai</b> untuk peringatan WhatsApp. Nama hanya dipaparkan di sini.</PageHead>
      <PendingLists trackers={overview.trackers} />
    </>
  );
}
