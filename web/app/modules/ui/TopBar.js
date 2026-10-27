import { logout } from '@/app/admin/actions';
import ThemeToggle from './ThemeToggle';
import { BRAND } from './brand';

// Sticky app bar of the public pages. Logged in: "Panel Admin" + "Log keluar"; otherwise "Log masuk".
export default function TopBar({ links = [], login = true, loggedIn = false }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <a href="/" className="brand"><img src={BRAND.crest} alt="" width="22" height="28" />{BRAND.school} <span className="brand-sub">· Data dan Maklumat</span></a>
        <nav className="topnav" aria-label="Navigasi">
          {links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <ThemeToggle />
        {loggedIn ? (
          <form action={logout}><button type="submit" className="logout-btn">Log keluar</button></form>
        ) : login && <a href="/admin" className="login-btn">Log masuk</a>}
      </div>
    </div>
  );
}
