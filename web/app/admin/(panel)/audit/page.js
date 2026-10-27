import { apiFetch } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import PageHead from '../../../modules/admin/PageHead';
import AuditLog, { AUDIT_TYPES } from '../../../modules/admin/AuditLog';

export default async function Audit({ searchParams }) {
  const admin = await requireAdmin();
  const { type } = await searchParams;
  const t = AUDIT_TYPES.includes(type) ? type : '';
  const entries = await apiFetch(`api/admin/audit${t ? `?type=${t}` : ''}`, { token: admin.token }).catch((e) => ({ error: e.message }));
  return (
    <>
      <PageHead title="Log Audit">Siapa log masuk dan apa yang diubah dalam Panel Admin. Baris merah = cubaan log masuk yang gagal.</PageHead>
      <AuditLog entries={entries} type={t} />
    </>
  );
}
