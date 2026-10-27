// The view switcher ("slider") under the top bar. Server-rendered links, so every view has its own URL.
export const VIEWS = [
  { id: 'semakan', icon: '📋', label: 'Semakan Tinjauan' },
  { id: 'jadual', icon: '🖥', label: 'Jadual Makmal' },
  { id: 'cuti', icon: '🗓', label: 'Penyata Cuti', locked: true },
  { id: 'analisis', icon: '📊', label: 'Analisis PdPc' },
  { id: 'pautan', icon: '🔗', label: 'Pautan' },
];

export default function ViewTabs({ active, loggedIn }) {
  return (
    <nav className="view-tabs" aria-label="Pilih dashboard">
      <div className="view-tabs-inner">
        {VIEWS.map((v) => (
          <a key={v.id} href={v.id === 'semakan' ? '/' : `/?v=${v.id}`} aria-current={active === v.id ? 'page' : undefined}
            className={active === v.id ? 'active' : undefined}>
            <span aria-hidden="true">{v.icon}</span> {v.label}{v.locked && !loggedIn && <span className="lock" title="Perlu log masuk"> 🔒</span>}
          </a>
        ))}
      </div>
    </nav>
  );
}
