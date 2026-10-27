import '@fontsource-variable/manrope';
import '@fontsource/dm-serif-display';
import './globals.css';
import VisitorStats from './modules/ui/VisitorStats';

// Absolute base for share images: the production domain on Vercel, localhost otherwise.
const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(site),
  title: 'Data & Maklumat SMK Subang',
  description: 'Tugasan, pautan dan analisis SMK Subang di satu tempat.',
  icons: { icon: '/brand/logo.png', apple: '/brand/logo.png' },
  openGraph: { title: 'Pengurusan Data dan Maklumat · SMK Subang' },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#002b55' },
    { media: '(prefers-color-scheme: dark)', color: '#001a33' },
  ],
};

// Apply the saved theme before the first paint. No saved choice = follow the device (CSS media query).
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}<VisitorStats /></body>
    </html>
  );
}
