import { requireAdmin } from '@/lib/session';
import { getOverview, summarise } from '@/lib/admin-data';
import AdminShell from '../../modules/admin/AdminShell';

export const metadata = { title: 'Panel Admin · SMK Subang' };
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }) {
  const admin = await requireAdmin();
  // Badges in the sidebar; a failure here only hides them.
  const overview = await getOverview(admin.token).catch(() => null);
  const s = overview ? summarise(overview) : {};
  const { token, ...who } = admin; // the session token never goes to the browser
  return <AdminShell admin={who} badges={{ pending: s.pending, problems: s.problems }}>{children}</AdminShell>;
}
