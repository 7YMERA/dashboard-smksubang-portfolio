// Home-screen install ("Tambah ke Skrin Utama"): name and crest icons. Served at /manifest.webmanifest.
export default function manifest() {
  return {
    name: 'Data & Maklumat SMK Subang',
    short_name: 'SMK Subang',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#002b55',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
