import { requireAdmin } from '@/lib/session';
import { getOverview } from '@/lib/admin-data';
import PageHead from '../../../modules/admin/PageHead';
import SyncStatus from '../../../modules/admin/SyncStatus';

export default async function Sync() {
  const admin = await requireAdmin();
  const overview = await getOverview(admin.token);
  return (
    <>
      <PageHead title="Status Sync">Data dibaca dari Google Sheets setiap jam. Di bawah: bila kali terakhir, dan kesilapan dalam sheet yang perlu dibetulkan.</PageHead>
      <SyncStatus runs={overview.syncRuns} request={overview.syncRequest} />
    </>
  );
}
