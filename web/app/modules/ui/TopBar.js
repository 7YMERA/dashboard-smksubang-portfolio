import AccountMenu from './AccountMenu';
import ThemeToggle from './ThemeToggle';
import { BRAND } from './brand';

// Sticky app bar of every page. Logged in: the name button with its menu (AccountMenu);
// otherwise the theme switch and "Log masuk". `title` replaces the subtitle (e.g. "Panel Admin").
export default function TopBar({ admin = null, badges, login = true, title = 'Data dan Maklumat', home = '/' }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <a href={home} className="brand"><img src={BRAND.crest} alt="" width="22" height="28" />{BRAND.school} <span className="brand-sub">· {title}</span></a>
        {admin ? <AccountMenu admin={admin} badges={badges} /> : (
          <>
            <ThemeToggle />
            {login && <a href="/admin" className="login-btn">Log masuk</a>}
          </>
        )}
      </div>
    </div>
  );
}
