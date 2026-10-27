import { requireAdmin } from '@/lib/session';
import { getOverview } from '@/lib/admin-data';
import PageHead from '../../../modules/admin/PageHead';
import Analytics from '../../../modules/analytics/Analytics';

export default async function AnalisisDalaman() {
  const admin = await requireAdmin();
  const overview = await getOverview(admin.token);
  const charts = overview.breakdowns.filter((b) => b.visibility === 'admin');
  return (
    <>
      <PageHead title="Analisis dalaman">Carta yang tidak dipaparkan kepada umum, contohnya purata mengikut mata pelajaran.</PageHead>
      {charts.length ? <Analytics breakdowns={charts} /> : <p className="muted">Belum ada data.</p>}
    </>
  );
}
