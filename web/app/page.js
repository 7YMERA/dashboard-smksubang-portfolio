import { apiFetch, getDashboard } from '@/lib/api';
import { getAdmin } from '@/lib/session';
import Announcements from './modules/announcements/Announcements';
import TaskBoard from './modules/tasks/TaskBoard';
import TaskTable from './modules/tasks/TaskTable';
import LinkHub from './modules/links/LinkHub';
import StatCards from './modules/analytics/StatCards';
import Analytics from './modules/analytics/Analytics';
import LabView from './modules/lab/LabView';
import LeaveTable from './modules/leave/LeaveTable';
import TopBar from './modules/ui/TopBar';
import Hero from './modules/ui/Hero';
import ViewTabs, { VIEWS } from './modules/ui/ViewTabs';
import { SOURCES } from './modules/ui/sources';
import { daysUntil, fmtDate, fmtDateTime } from './modules/ui/format';
import { CURRENT } from './modules/ui/version';

// Render per request (data cached 60s): the API binding isn't available at build time.
export const dynamic = 'force-dynamic';

function SectionHead({ id, title, count, source }) {
  return (
    <div className="section-head">
      <h2 id={id}>{title}{count != null && <span className="count">{count}</span>}</h2>
      {source && <a className="source-link" href={source} target="_blank" rel="noopener noreferrer">Buka sheet asal ↗</a>}
    </div>
  );
}

export default async function Home({ searchParams }) {
  const sp = await searchParams;
  const view = VIEWS.some((v) => v.id === sp.v) ? sp.v : 'semakan';
  const [dash, admin] = await Promise.all([getDashboard(), getAdmin()]);
  const { metrics, links, announcements, breakdowns, trackers, tasks, lastSyncAt, error } = dash;
  const open = tasks.filter((t) => t.status === 'BUKA');
  const overdue = open.filter((t) => t.deadline && daysUntil(t.deadline) < 0);

  // Only the active view's extra data is fetched.
  let lab = null; let leave = null;
  if (view === 'jadual') {
    const w = /^\d+$/.test(sp.w || '') ? `?week=${sp.w}` : '';
    lab = await apiFetch(`api/lab${w}`, { token: admin?.token }).catch((e) => ({ error: e.message }));
  }
  if (view === 'cuti' && admin) leave = await apiFetch('api/admin/leave', { token: admin.token }).catch((e) => ({ error: e.message }));

  return (
    <>
      <TopBar loggedIn={Boolean(admin)} links={admin ? [{ href: '/admin', label: 'Panel Admin' }] : []} />
      <Hero compact={view !== 'semakan'}>
        <div className="hero-stats">
          <div className="hero-stat"><strong>{open.length}</strong><span>tugasan terbuka</span></div>
          <div className={`hero-stat${overdue.length ? ' alert' : ''}`}>
            <strong>{overdue.length}</strong><span>{overdue.length ? '⚠ lewat tarikh' : 'lewat tarikh'}</span>
          </div>
          {lastSyncAt && <div className="hero-stat wide"><strong>{fmtDateTime(lastSyncAt)}</strong><span>kemas kini terakhir</span></div>}
        </div>
      </Hero>
      <ViewTabs active={view} loggedIn={Boolean(admin)} />

      <main>
        {error && <p className="error">Data tidak dapat dimuatkan ({error}).</p>}

        {view === 'semakan' && (
          <>
            <Announcements items={announcements} />
            <section>
              <SectionHead id="tugasan" title="Tugasan terbuka" count={open.length} source={SOURCES.semakan} />
              <TaskBoard tasks={tasks.filter((t) => t.status === 'BUKA')} trackers={trackers} />
            </section>
            <section>
              <SectionHead id="semua" title="Semakan Tinjauan Kutipan Data" count={tasks.length} />
              <TaskTable tasks={tasks} trackers={trackers} />
            </section>
          </>
        )}

        {view === 'jadual' && (
          <section>
            <SectionHead id="jadual" title="Jadual Penggunaan Makmal Komputer" />
            {lab?.error ? <p className="error">Jadual tidak dapat dimuatkan ({lab.error}).</p>
              : <LabView data={lab} sourceUrl={SOURCES.jadual} loggedIn={Boolean(admin)} />}
          </section>
        )}

        {view === 'cuti' && (
          <section>
            <SectionHead id="cuti" title="Penyata Cuti Guru" source={admin ? SOURCES.cuti : null} />
            {!admin ? (
              <div className="locked">
                <p>🔒 Senarai cuti semua guru hanya untuk <strong>Admin</strong> dan <strong>Pentadbir</strong>.</p>
                <p><strong>Guru:</strong> semak penyata cuti anda sendiri melalui <strong>pautan peribadi</strong> yang dihantar
                  oleh Guru Data dan Maklumat (tidak perlu log masuk).</p>
                <a className="btn primary" href="/admin/login">Log masuk</a>
              </div>
            ) : leave?.error ? <p className="error">Data cuti tidak dapat dimuatkan ({leave.error}).</p>
              : leave?.rows?.length ? <LeaveTable rows={leave.rows} total={leave.total} canReset={admin.role === 'admin'} />
              : <p className="note">Belum ada data cuti. Ia dibaca sekali sehari, atau tekan Sync sekarang dalam Panel Admin.</p>}
          </section>
        )}

        {view === 'analisis' && (
          <section>
            <SectionHead id="analisis" title="Analisis PdPc 2026" />
            {metrics.length || breakdowns.length
              ? <><StatCards metrics={metrics} /><Analytics breakdowns={breakdowns} /></>
              : <p className="note">Belum ada data analisis.</p>}
          </section>
        )}

        {view === 'pautan' && (
          <section>
            <SectionHead id="pautan" title="Pautan" count={links.length} />
            <LinkHub links={links} trackers={trackers} />
          </section>
        )}

        <footer className="site-foot">
          <span>SMK Subang · Pengurusan Data dan Maklumat · Versi {CURRENT.version} ({fmtDate(CURRENT.date)})</span>
          <a href="/admin">Panel Admin →</a>
        </footer>
      </main>
    </>
  );
}
