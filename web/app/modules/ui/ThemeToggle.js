'use client';

// Light / Auto / Dark. Saved in this browser only; "Auto" follows the device setting.
// The inline script in layout.js applies the saved choice before the first paint (no flash).
import { useEffect, useState } from 'react';

const OPTIONS = [
  { value: 'light', icon: '☀', label: 'Terang' },
  { value: 'auto', icon: 'A', label: 'Auto (ikut peranti)' },
  { value: 'dark', icon: '☾', label: 'Gelap' },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState(null); // unknown until mounted, so server and client HTML match

  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch {}
    setTheme(saved === 'light' || saved === 'dark' ? saved : 'auto');
  }, []);

  const choose = (value) => {
    setTheme(value);
    try {
      if (value === 'auto') localStorage.removeItem('theme');
      else localStorage.setItem('theme', value);
    } catch {}
    if (value === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', value);
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Tema">
      {OPTIONS.map((o) => (
        <button key={o.value} type="button" aria-pressed={theme === o.value} title={o.label}
          aria-label={o.label} onClick={() => choose(o.value)}>
          <span aria-hidden="true">{o.icon}</span>
        </button>
      ))}
    </div>
  );
}
