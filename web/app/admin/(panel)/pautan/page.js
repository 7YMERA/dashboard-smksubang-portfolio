import { apiFetch } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { getOverview } from '@/lib/admin-data';
import PageHead, { ReadOnlyNote } from '../../../modules/admin/PageHead';
import { LinkManager } from '../../../modules/admin/RowForms';

export default async function Pautan() {
  const admin = await requireAdmin();
  const [links, overview] = await Promise.all([apiFetch('api/admin/links', { token: admin.token }), getOverview(admin.token)]);
  return (
    <>
      <PageHead title="Pautan">Butang di dashboard. Dikumpul mengikut kategori; nombor susunan kecil dipaparkan dahulu.</PageHead>
      <ReadOnlyNote admin={admin} />
      <LinkManager links={links} trackers={overview.trackers} readOnly={admin.role !== 'admin'} />
    </>
  );
}
