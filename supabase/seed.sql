-- Starter data for a NEW database: the link layout of the school's original link page, with placeholder URLs.
-- The real links (Google Forms, Sheets, Drive) are NOT kept in this repo: they live in the database and
-- are managed in Panel Admin → Pautan. Replace these placeholders there after the first install.
insert into public.links (title, url, category, description, sort_order, tracker_key) values
  ('Semakan Tinjauan Kutipan Data', 'https://example.com/ganti-pautan-sheet', 'Data', null, 1, null),
  ('GF - SKS Kekuatan Guru 2026', 'https://example.com/ganti-pautan-borang', 'Borang', null, 2, 'sks_kekuatan_guru_2026'),
  ('GF Sekolah - Rekod Pengisian Skor KBAT PdP 2026', 'https://example.com/ganti-pautan-borang',
   'Borang Pencerap', 'Diisi oleh Pencerap sahaja', 3, 'kbat_pdp_2026'),
  ('Penghantaran Skor Pencerapan PdPc (Pencerapan 1)', 'https://example.com/ganti-pautan-borang',
   'Borang Pencerap', 'Diisi oleh Pencerap sahaja', 4, 'pencerapan_1_2026'),
  ('Download Borang Standard 4 (Versi 28.10.2024)', 'https://example.com/ganti-pautan-muat-turun',
   'Muat Turun', 'Sila enable macros', 5, null),
  ('Jadual Penggunaan Makmal Komputer 2026', 'https://example.com/ganti-pautan-sheet', 'Jadual', null, 6, null),
  ('Penyata Cuti Guru 2026', 'https://example.com/ganti-pautan-sheet', 'Guru', 'Sila guna email MOE', 7, null)
on conflict do nothing;

insert into public.announcements (title, body) values
  ('Selamat datang', 'Dashboard Pengurusan Data dan Maklumat SMK Subang 2026.');
