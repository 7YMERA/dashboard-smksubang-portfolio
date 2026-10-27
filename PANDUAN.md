# Panduan Dashboard Data & Maklumat SMK Subang

📄 Versi PDF bergambar: `docs/Panduan-Dashboard-SMK-Subang-v<versi>.pdf` (minta pembantu teknikal jika perlu dicetak).

Panduan ringkas untuk menggunakan dashboard. Tidak perlu tahu apa-apa tentang kod.

- **Dashboard (untuk semua guru):** <https://<your-app>.vercel.app>
- **Panel Admin (untuk cikgu sahaja):** <https://<your-app>.vercel.app/admin>

---

## 1. Apa itu dashboard ini?

Ia menggantikan dua perkara yang cikgu guna sekarang:

1. **Halaman pautan lama** (butang-butang pautan), dan
2. **Sheet "SEMAKAN TINJAUAN KUTIPAN DATA"** (senarai tugasan, tarikh akhir dan status).

Kedua-duanya kini dalam **satu halaman yang kemas**, dan ia **mengemas kini sendiri setiap jam** daripada
Google Sheets cikgu. Cikgu **tidak perlu menaip apa-apa dua kali**: teruskan mengisi Google Sheets dan
Google Forms seperti biasa.

---

## 2. Pilihan dashboard

Di bawah kepala biru ada butang untuk bertukar paparan:
**📋 Semakan Tinjauan** (utama) · **🖥 Jadual Makmal** · **🗓 Penyata Cuti 🔒** · **📊 Analisis PdPc** · **🔗 Pautan**.
Isi setiap sheet dipaparkan terus; sheet asal tetap diisi seperti biasa (ada pautan *Buka sheet asal*).

- **Jadual Makmal:** pilih minggu (minggu ini dipaparkan dahulu). Orang awam nampak subjek dan kelas; nama guru selepas log masuk.
- **Penyata Cuti:** senarai semua guru hanya untuk Admin dan Pentadbir. Ringkasan CRK, cuti sakit dan lain-lain setiap guru; dikemas kini sekali sehari.
- **Penyata cuti untuk guru sendiri (tanpa log masuk):** setiap guru ada **pautan peribadi**. Dalam Penyata Cuti, lajur
  **Pautan guru** → tekan **Salin pautan** → tampal dalam WhatsApp **peribadi** guru itu (bukan kumpulan). Guru hanya
  nampak penyata dirinya sendiri.
  - *Dibuka 27 Okt* / *Belum dibuka* = sama ada guru sudah membuka pautannya.
  - Jika pautan tersebar kepada orang lain: tekan **Tukar pautan** (Admin sahaja), kemudian hantar pautan baharu. Pautan lama terus tidak berfungsi.

## 2b. Apa yang guru-guru nampak

Di bahagian atas ada **kepala halaman biru** seperti banner dalam sheet SEMAKAN: lencana sekolah, tajuk
*Pengurusan Data dan Maklumat*, serta gambar Pengetua dan Guru Data dan Maklumat. Untuk menukar gambar atau
nama (contohnya Pengetua baharu), minta pembantu teknikal mengemas kini fail `web/app/modules/ui/brand.js`
dan gambar dalam `web/public/brand/`.


Sesiapa sahaja yang ada pautan dashboard boleh melihat:

| Bahagian | Isinya |
|---|---|
| 📢 **Pengumuman** | Notis yang cikgu tulis di Panel Admin. |
| **Tugasan semasa** | Tugasan yang masih **BUKA**, dengan kiraan hari: ✓ *10 hari lagi*, ⏳ *2 hari lagi*, ⚠ *Lewat 3 hari*. Jika ada, ditunjukkan juga berapa orang sudah hantar (contoh *133/150 dihantar*). |
| **Sejarah tugasan** | Tugasan yang sudah TUTUP atau SELESAI (tekan untuk buka). |
| **Pautan** | Butang berwarna seperti mylink, dengan kotak carian. Butang borang menunjukkan bilangan yang sudah hantar. |
| **Analisis PdPc** | Purata markah dan carta pencerapan (nombor keseluruhan sahaja). |

Cara kiraan "dihantar": sel yang kosong atau bertulis *belum respons* dikira **belum hantar**. Guru yang
bertulis *CTG* / *CUTI* (bercuti) **tidak dikira** dalam jumlah.

🔒 **Nama guru tidak pernah dipaparkan di sini.** Orang awam hanya nampak jumlah, contohnya "133/150".

---

## 3. Siapa boleh buat apa

| | Guru / orang awam | **Pentadbir**<br>(Pengetua, PK) | **Admin**<br>(cikgu) |
|---|:-:|:-:|:-:|
| Lihat dashboard | ✅ | ✅ | ✅ |
| Masuk Panel Admin | ❌ | ✅ | ✅ |
| Lihat **nama** yang belum hantar | ❌ | ✅ | ✅ |
| Lihat masalah data & analisis dalaman | ❌ | ✅ | ✅ |
| Tambah / ubah pautan dan pengumuman | ❌ | ❌ | ✅ |

**Pentadbir** boleh melihat semuanya tetapi **tidak boleh mengubah** apa-apa. Hanya **admin** boleh mengubah.

---

## 4. Kerja harian cikgu

### Masuk Panel Admin
1. Buka dashboard dan tekan butang hitam **Log masuk** di penjuru kanan atas
   (atau terus ke <https://<your-app>.vercel.app/admin>).
2. Masukkan emel dan kata laluan. Cikgu kekal log masuk selama 7 hari.
3. **Admin dan Pentadbir guna halaman log masuk yang sama.** Akaun yang menentukan akses: akaun pentadbir
   hanya boleh melihat.

### Mod gelap
Di bahagian atas kanan ada tiga butang: **☀** (terang), **A** (auto, ikut tetapan telefon/komputer) dan
**☾** (gelap). Pilihan disimpan pada peranti itu sahaja.

### Menu Panel Admin
- Semua bahagian ada dalam **menu di sebelah kiri**: Ringkasan, Penghantaran, Status Sync, Analisis dalaman, Pautan,
  Pengumuman, Akaun dan Log Audit. Tekan satu, dan hanya bahagian itu dipaparkan.
- Nombor kecil pada menu = perkara yang perlu perhatian (kuning: belum hantar, merah: masalah data).
- Butang **«** di atas menu mengecilkannya kepada ikon sahaja; tekan sekali lagi untuk besarkan.
- Di telefon: tekan **☰ Menu** di atas untuk membuka menu.
- **Log keluar** sentiasa di bahagian bawah menu (merah). Di dashboard awam, butang **Log keluar** ada di penjuru kanan atas.
- **Ringkasan** (halaman pertama selepas log masuk): kotak besar untuk status sistem, bilangan belum hantar, masalah
  data, pautan dan pengumuman. Tekan kotak untuk terus ke bahagian itu.

### Semak siapa belum hantar (Penghantaran)
1. Menu → **Penghantaran**.
2. Setiap kad menunjukkan satu borang, contohnya *SKS Kekuatan Guru 2026*, dengan senarai nama yang **belum hantar**.
3. Tekan **Salin senarai**, kemudian tampal (paste) dalam WhatsApp untuk peringatan. Senarai sudah bernombor.

### Tambah atau ubah pautan (butang)
1. Panel Admin → **Pautan**.
2. Pautan baharu: tekan butang biru **+ Tambah pautan**. Untuk mengubah: tekan **Ubah** pada pautan itu.
3. Isi borang (setiap kotak ada nama dan penerangan di atas/bawahnya):
   - **Tajuk butang** dan **Pautan (URL)**. Untuk Google Form, guna pautan **Hantar → 🔗 (forms.gle/…)**, bukan pautan edit. Jika tersilap, dashboard akan beritahu.
   - **Kategori** = kumpulan butang. Butang dalam kategori yang sama mempunyai warna yang sama.
   - **Kemajuan pada butang** = pilih borang untuk paparkan "x/y dihantar" pada butang.
   - Untuk menyembunyikan butang tanpa memadam, buang tanda ✔ pada **Paparkan di dashboard**.
4. Tekan **Simpan perubahan** (atau **Tambah pautan**). Borang tertutup dan keluar **Disimpan ✓**. Jika ada kesilapan,
   mesej merah menerangkan apa yang perlu dibetulkan, dan apa yang cikgu taip tidak hilang. **Batal** = tutup tanpa menyimpan.
5. Untuk memadam: **Ubah** → **Padam** (merah, di kanan) → OK.

### Tulis pengumuman
1. Menu → **Pengumuman** → butang biru **+ Tambah pengumuman** (atau **Ubah** pada pengumuman sedia ada).
2. Isi tajuk, butiran (pilihan) dan **Tamat pada** (pilihan). Selepas tarikh tamat, pengumuman hilang sendiri.
3. Setiap pengumuman bertanda **Dipaparkan**, **Tersembunyi** atau **Sudah tamat**.

### Tambah Pentadbir (contoh: Pengetua, PK)
Hanya **Admin** boleh buat ini. Tidak perlu masuk Supabase.
1. Log masuk → menu kiri → **Akaun**.
2. Dalam kotak **Tambah akaun**, isi:
   - **Nama**: contohnya *Puan Aminah (Pengetua)*
   - **Emel**: emel orang itu (sebaiknya emel MOE)
   - **Peranan**: *Pentadbir (lihat sahaja)*. Pilih *Admin* hanya untuk orang yang perlu mengubah pautan/pengumuman.
3. Tekan **Jana** untuk buat kata laluan sementara secara automatik.
4. Tekan **Tambah akaun**. Kotak biru akan keluar: *Akaun … sudah dibuat*.
5. Tekan **Salin maklumat log masuk**, kemudian tampal dalam WhatsApp kepada orang itu.
   Mesej sudah mengandungi pautan, emel dan kata laluan.
6. Orang itu tekan **Log masuk** di dashboard dan masukkan emel serta kata laluan tersebut.

**Urus akaun yang sedia ada** (dalam senarai di bahagian Akaun):
- **Tukar peranan**: pilih *Pentadbir* atau *Admin* pada kotak pilihan; ia disimpan terus.
- **Lupa kata laluan**: tekan **Kata laluan baharu** → *OK*. Kata laluan baharu dipaparkan; salin dan hantar.
  Kata laluan lama tidak berfungsi lagi.
- **Buang akses** (contoh: bertukar sekolah): tekan **Buang** → *OK*.
- Akaun cikgu sendiri ditanda **anda**. Ia tidak boleh dibuang atau diturunkan peranan, supaya cikgu tidak
  terkunci di luar sistem.

### Tambah tugasan baharu
Tiada perubahan: tambah baris dalam sheet **SEMAKAN TINJAUAN KUTIPAN DATA** seperti biasa (tajuk
berpautan, TARIKH AKHIR, STATUS). Ia akan muncul di dashboard dalam masa sejam.

### Log Audit (siapa buat apa)
Menu kiri → **Log Audit**. Admin dan Pentadbir boleh melihat.
- Setiap baris: **bila**, **siapa**, **apa** yang dibuat, dan **butiran** (contoh *URL: lama → baharu*).
- Tekan **Log masuk / Pautan / Pengumuman / Akaun / Sync & data** untuk menapis.
- Baris **merah** = cubaan log masuk yang gagal. Jika banyak baris merah daripada emel yang tidak dikenali, beritahu pembantu teknikal.
- Tiada sesiapa (termasuk Admin) boleh mengubah atau memadam rekod ini. Kata laluan tidak pernah direkod.

---

## 5. "Masalah data" (Status Sync)

Setiap jam, sistem membaca Google Sheets dan memeriksa kesilapan biasa. Dalam Panel Admin → **Status Sync**:

- **↻ Sync sekarang** = ambil data terkini sekarang (siap dalam kira-kira 5 minit). Pentadbir juga boleh tekan.
- ✓ **Aktif** (hijau) = sistem berjalan seperti biasa.
- ⚠ **Lewat** (merah) = sistem tidak berjalan lebih dari 2 jam. Beritahu pembantu teknikal.
- **Senarai masalah** = perkara yang perlu cikgu betulkan **dalam Google Sheets**. Contoh:
  - *ANALISIS PENCERAPAN 1 baris 8: (nama guru): 4.4.1 = 9,286.00* → sepatutnya **92.86**.
  - *Tugasan … Status masih BUKA tetapi tarikh akhir sudah lepas* → tukar STATUS kepada TUTUP/SELESAI, atau betulkan tarikh.

Betulkan sel dalam Google Sheets. Masalah itu akan hilang sendiri pada semakan seterusnya.

---

## 6. Elak kesilapan dari awal (Pengesahan Input)

Supaya kesilapan seperti *9,286.00* atau tahun yang salah tidak berlaku lagi, borang dan sheet boleh
diberi "penapis". Ini dibuat **sekali sahaja** oleh pembantu teknikal (lihat `google-apps-script/README.md`). Selepas itu:

- Soalan markah dalam Google Form hanya menerima nombor **0 hingga 100**.
- Soalan nama dan markah menjadi **wajib**.
- Dalam sheet SEMAKAN, **STATUS** menjadi pilihan (BUKA / TUTUP / SELESAI) dan **TARIKH AKHIR** hanya menerima tarikh sebenar.
- Sel markah dalam sheet pencerapan hanya menerima 0 hingga 100.

Jika sel lama sudah salah, ia akan ada **tanda merah kecil di penjuru** supaya mudah dijumpai.

---

## 7. Soalan lazim

**Saya ubah Google Sheet, kenapa dashboard belum berubah?**
Ia dikemas kini setiap jam. Waktu kemas kini terakhir ditulis di bahagian atas dashboard.

**Pengetua mahu akses.**
Cikgu boleh buat sendiri: Panel Admin → **Akaun** → *Tambah akaun* → peranan **Pentadbir** (lihat bahagian 4).

**Lupa kata laluan.**
Admin lain boleh tekan **Kata laluan baharu** dalam Panel Admin → Akaun. Jika cikgu sendiri (satu-satunya
admin) lupa, minta pembantu teknikal: Supabase → Authentication → Users → pilih akaun → tetapkan kata laluan.

**Adakah nama guru selamat?**
Ya. Nama hanya dipaparkan dalam Panel Admin (perlu log masuk). Dashboard awam hanya menunjukkan jumlah.
