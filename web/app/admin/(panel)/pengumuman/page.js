import { apiFetch } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import PageHead, { ReadOnlyNote } from '../../../modules/admin/PageHead';
import { AnnouncementManager } from '../../../modules/admin/RowForms';

export default async function Pengumuman() {
  const admin = await requireAdmin();
  const announcements = await apiFetch('api/admin/announcements', { token: admin.token });
  return (
    <>
      <PageHead title="Pengumuman">Notis di bahagian atas dashboard. Ia hilang sendiri selepas tarikh tamat.</PageHead>
      <ReadOnlyNote admin={admin} />
      <AnnouncementManager announcements={announcements} readOnly={admin.role !== 'admin'} />
    </>
  );
}
