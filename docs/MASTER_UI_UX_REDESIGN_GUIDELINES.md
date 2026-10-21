# MASTER UI/UX REDESIGN & TYPESCRIPT MIGRATION GUIDELINES
## Pondok Pesantren Al-Hamid (Sekolah-Info)
### Standar Arsitektur, Desain Kaca Apple (Option A), Keamanan API, dan Protokol AI Agent

---

## 1. Latar Belakang & Konteks Ekosistem

Aplikasi **Sekolah-Info** merupakan sistem informasi inti (core operational system) Pondok Pesantren Al-Hamid yang telah berjalan matang (*mature*) di lingkungan production. Ekosistem ini tidak berdiri sendiri, melainkan terhubung langsung dengan beberapa komponen kritis:

1. **Aplikasi Mobile Flutter (`mobile_absensi/`)**:
   - Digunakan oleh santri, wali santri, dan dewan asatidz untuk absensi kehadiran, monitoring hafalan, dan perizinan.
   - Mengonsumsi endpoint REST API yang sama dari backend web (`server.js`, `/api/...`).
2. **Desktop Scanner (`desktop-scanner/`)**:
   - Integrasi perangkat keras pemindai kartu santri (barcode/RFID) untuk absensi gerbang dan makan.
3. **Sistem Keuangan & Akademik Pesantren**:
   - Transaksi kas, SPP santri, penilaian ujian, pencetakan rapor, dan buku induk.

### Maksud & Tujuan Rombak Tampilan (UI/UX Redesign)
User menginginkan perubahan total tampilan antarmuka web menjadi sangat modern, berkelas tinggi, dan memukau melalui konsep **Option A: Apple macOS Sequoia & VisionOS Liquid Glass (Modern Tactile UI)**. Namun, karena sistem telah beroperasi secara aktif di production, **seluruh perubahan tampilan HARUS dilakukan dengan sangat hati-hati, terukur, dan tidak boleh mengganggu logika data, API, maupun stabilitas aplikasi mobile**.

---

## 2. Prinsip Sakral: Zero-Breakage Policy (Keamanan API & Produksi)

Setiap pengembang maupun AI Agent **WAJIB** tunduk pada prinsip keamanan berikut:

### A. Kebijakan "Pure Frontend Scope"
- **DILARANG KERAS** memodifikasi logika backend, routing, middleware auth, maupun struktur database pada:
  - `server.js`
  - `src/routes/`
  - `src/controllers/`
  - `src/database/` & `sql/`
- **DILARANG MENGAKSES LIVE VPS / LIVE DATABASE PRODUCTION**:
  - Seluruh informasi mengenai skema database (`sql/init.sql`, `sql/keuangan_schema.sql`, dsb.), relasi tabel, model data, dan kontrak API sudah tersedia 100% secara lokal di dalam repositori ini.
  - Pemeriksaan payload dan query dapat dilakukan langsung dengan membaca file backend lokal, sehingga **TIDAK ADA RISIKO** menyentuh atau merusak database production.

### B. Proteksi Kontrak API (API Contract Immutability)
1. **URL Route & HTTP Method Tetap Sama**:
   - Jangan pernah mengubah URL endpoint (contoh: `/api/guru`, `/api/kelas`, `/api/santri`) atau metode HTTP-nya (`GET`, `POST`, `PUT`, `DELETE`).
2. **Format Response JSON Tidak Boleh Berubah**:
   - Backend mengembalikan struktur baku: `{ success: boolean, data: ..., message: string }` atau paginasi `{ data: [...], total: ... }`. Frontend baru harus mengonsumsi data sesuai struktur ini tanpa meminta perubahan backend.
3. **Payload Form & Query Parameter Tetap Valid**:
   - Parameter pencarian, paginasi (`page`, `limit`), filter status, dan multipart upload foto/TTD harus dikirimkan persis sesuai ekspektasi controller backend.

---

## 3. Master Design System: Option A (Apple macOS Sequoia & VisionOS Liquid Glass)

Konsep visual yang diadopsi adalah estetika kaca cair generasi baru dari Apple macOS Sequoia dan VisionOS, dipadukan dengan sensasi fisik-taktil (*New Skeuomorphism / Tactile Glass*).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AURORA MESH GRADIENT BACKGROUND                       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🍏 FLOATING GLASS HEADER DOCK                                         │  │
│  │ [Judul Halaman] [Segmented Control Pills: Guru 21 | Mapel 43] [+ Btn] │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🔍 INSET FROSTED FILTER BAR                                           │  │
│  │ [ 🔎 Inset Search Pill ]  [ CustomSelect Dropdown ▼ ]  [ Status ▼ ]   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 💎 VISIONOS LIQUID GLASS TABLE CONTAINER                              │  │
│  │  - Sticky Frosted Header with Specular Highlights                     │  │
│  │  - 3D Spherical Lens Avatars                                          │  │
│  │  - Frosted Status Pills (Aktif / Cuti / Pensiun)                      │  │
│  │  - Frosted Capsule Action Buttons (Edit, Foto, TTD, Hapus)            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Karakteristik Visual Utama

#### 1. Translucency & Refraction (Efek Kaca Cair)
- Menggunakan `backdrop-filter: blur(20px)` hingga `blur(32px)`.
- Background material semi-transparan: `rgba(255, 255, 255, 0.55)` hingga `rgba(255, 255, 255, 0.75)`.

#### 2. Specular Edge Highlight (Kilauan Cahaya Kaca)
Setiap panel kaca memiliki pencahayaan tepi atas yang tajam menirukan pantulan cahaya fisik:
```scss
border: 1px solid rgba(255, 255, 255, 0.70);
border-top: 1.5px solid rgba(255, 255, 255, 0.95);
```

#### 3. Optical Depth & Layered Shadows (Kedalaman Optik)
Kombinasi bayangan ambient halus dan bayangan kontak tajam:
```scss
box-shadow: 
  0 20px 40px -12px rgba(15, 23, 42, 0.08),
  0 1px 3px rgba(15, 23, 42, 0.04),
  inset 0 1px 1px rgba(255, 255, 255, 0.85);
```

#### 4. Palet Warna Terkurasi (Harmonious & Professional)
- **Kanvas / Background**: Aurora mesh gradient lembut (`#f8fafc` ke `#e2e8f0` dengan glowing ambient orbs `#dbeafe`, `#ede9fe`, `#fce7f3`).
- **Teks Utama**: Deep Charcoal / Slate 900 (`#0f172a`, `#1e293b`) — memiliki kontras rasio tajam di atas kaca.
- **Teks Sekunder**: Slate 500 (`#64748b`).
- **Aksen Utama**: Apple System Blue (`#2563eb` - `#1d4ed8`).
- **Status Semantic**:
  - *Aktif / Sukses*: Emerald (`#059669`, surface `rgba(16, 185, 129, 0.12)`, border `rgba(110, 231, 183, 0.6)`).
  - *Cuti / Peringatan*: Amber (`#d97706`, surface `rgba(245, 158, 11, 0.12)`, border `rgba(252, 211, 77, 0.6)`).
  - *Pensiun / Bahaya*: Rose (`#e11d48`, surface `rgba(244, 63, 94, 0.12)`, border `rgba(253, 164, 175, 0.6)`).
  - *Mata Pelajaran*: Sapphire Blue (`#2563eb`, surface `rgba(37, 99, 235, 0.12)`).
  - *Jabatan Struktural*: Amethyst Purple (`#7c3aed`, surface `rgba(124, 58, 237, 0.12)`).

#### 5. Aturan Anti "AI Slop"
- **Dilarang** menyematkan widget grafik, kartu metrik tiruan, atau angka palsu yang tidak ada dasarnya di database.
- **Dilarang** menggunakan warna neon berlebihan, efek border pelangi berputar, atau animasi alay yang mengganggu fokus kerja.
- **Dilarang** menghilangkan fitur eksisting (tombol Export Excel, Cetak PDF, Filter, Pagination, dsb.).

---

## 4. Anatomi Komponen Standar (Design Tokens & Specs)

### A. Floating Header Dock
- Wadah mengambang berbentuk kapsul rounded (`border-radius: 20px`).
- Menyatukan judul halaman, deskripsi modul, **Apple Segmented Control Tabs**, dan tombol aksi utama.

### B. Apple Segmented Control (Tab Navigasi)
- Inset container dengan rounded pill (`border-radius: 9999px`), background semi-transparan `rgba(0, 0, 0, 0.05)`.
- Tombol segmen aktif memiliki surface putih solid dengan specular shadow:
  ```scss
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  ```
- Dilengkapi **Pill Badge Counter** yang menampilkan jumlah total entitas aktual.

### C. Inset Search Bar & CustomSelect Dropdown
- Input pencarian menggunakan bentuk pill inset (`border-radius: 9999px`) dengan `background: rgba(255, 255, 255, 0.65)` dan `box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04)`.
- Dropdown menggunakan CustomSelect bergaya Apple: menu popup kaca melayang, hover halus per item, scrollbar minimalis.

### D. VisionOS Liquid Glass Table
- Container tabel berbingkai kaca tebal (`border-radius: 20px`), background `rgba(255, 255, 255, 0.60)`, blur `24px`.
- **Baris Tabel**: Hover effect lembut yang menerangi baris (`background: rgba(255, 255, 255, 0.70)`).
- **Avatar 3D Spherical**: Foto profil atau inisial bulat dengan specular rim light 3D.
- **Status Pills**: Kapsul status kecil beraksen warna semantik (Emerald / Amber / Rose).
- **Frosted Capsule Action Buttons**: Tombol aksi (Edit, Foto, TTD, Hapus) berbentuk kapsul translusen yang responsif saat disentuh/di-hover.

### E. Master Cards Grid (Mata Pelajaran, Jabatan, Kelas, Fasilitas)
- Grid kartu cairan kaca (`border-radius: 20px`).
- **3D Lens Orb Icon**: Ikon tematik di dalam bola lensa bulat bergradasi kaca (Sapphire Book, Amethyst Briefcase, Emerald Chalkboard).
- **Arabic Script Tag**: Badge teks Arab/kategori translusen untuk memperkuat identitas pesantren.
- **Action Buttons**: Tombol Edit & Hapus diletakkan rapi di footer kartu.

### F. Modals & Dialog Konfirmasi
- **Tactile Glass Modal**:
  - Backdrop blur gelap lembut (`rgba(15, 23, 42, 0.35)` dengan `backdrop-filter: blur(16px)`).
  - Modal container kaca berbingkai specular highlight.
  - Form input inset dengan fokus ring Apple Blue.
  - Tombol modal taktil: `.tactile-modal-btn.primary` (gradien biru) dan `.tactile-modal-btn.secondary` (kaca translusen).
- **Apple Confirm Dialog (Hapus/Aksi Kritis)**:
  - Dialog konfirmasi pengganti confirm bawaan browser.
  - Halo merah lembut di belakang ikon peringatan, konfirmasi nama data yang akan dihapus, tombol batal dan hapus yang taktil.

### G. Loading & Error States
- **Apple Shimmer Skeletons**: Tabel kerangka berbentuk garis-garis kaca dengan shimmer wave linear, bukan spinner bulat murah.
- **In-Page Error Card**: Kartu peringatan kaca dengan tombol "Coba Lagi" taktil.

---

## 5. Strategi Migrasi Bertahap (Incremental TypeScript Migration)

Migrasi dari JavaScript (`.jsx`/`.js`) ke TypeScript (`.tsx`/`.ts`) harus dilakukan secara **inkremental dan terukur**:

```
Fase 1: Tinjau Kontrak API Backend  ───>  Fase 2: Buat types/*.ts (Interface)
                 │                                        │
                 ▼                                        ▼
Fase 4: Verifikasi Build & HMR      <───  Fase 3: Refactor ke .tsx & Styling SCSS
```

### Aturan Teknis Migrasi
1. **Koeksistensi Harmonis (`allowJs: true`)**:
   - `frontend/tsconfig.json` telah dikonfigurasi dengan `"allowJs": true`. File `.jsx` dan `.tsx` dapat berjalan berdampingan tanpa error.
   - **JANGAN** mengubah semua file sekaligus. Refactor dilakukan modul demi modul.
2. **Definisi Interface Presisi (`src/types/`)**:
   - Setiap entitas wajib memiliki interface TypeScript terpisah di `frontend/src/types/<feature>.ts` (contoh: `guru.ts`, `kelas.ts`, `santri.ts`, `nilai.ts`).
   - Interface harus mencakup tipe item data, filter state, form data, dan response paginasi.
   - Hindari penggunaan type `any`. Gunakan `unknown` atau union types jika tipe dinamis.
3. **Preservasi 100% Logika Bisnis**:
   - Seluruh state React (`useState`, `useEffect`, `useMemo`, `useCallback`), kalkulasi paginasi, debounce pencarian, dan pemanggilan service API harus dipertahankan secara utuh.
4. **Verifikasi Build Wajib**:
   - Setiap kali satu halaman/komponen selesai dimigrasi, jalankan:
     ```bash
     cd frontend
     npm run build
     ```
   - Build **WAJIB** menghasilkan exit code 0 (`✓ built in ...s`) tanpa peringatan TypeScript yang memblokir.

---

## 6. Peta Jalan & Katalog Halaman (Refactoring Roadmap)

| Modul | Halaman / Fitur | Status Migrasi | Keterangan |
|---|---|---|---|
| **Akademik** | Data Guru (`/guru`) | ✅ Selesai (TSX) | Option A Liquid Glass, Tabs Guru, Mapel, Jabatan |
| **Akademik** | Data Kelas (`/kelas`) | ✅ Selesai (TSX) | Liquid Glass, Tab Kelas & Wali Kelas |
| **Akademik** | Data Santri (`/santri`) | ⏳ Siap Dikerjakan | Tabel Santri, Filter Kamar/Kelas, Modal Santri |
| **Akademik** | Pelanggaran & Prestasi (`/pelanggaran-prestasi`) | ⏳ Antrean | Tab Pelanggaran, Prestasi, Kategori Poin |
| **Akademik** | Jadwal Pelajaran (`/jadwal-pelajaran`) | ⏳ Antrean | Matrix Jadwal Mingguan, Filter Kelas/Hari |
| **Akademik** | Silabus Pembelajaran (`/silabus`) | ⏳ Antrean | Dokumen Silabus, RPP, Upload Materi |
| **Ujian** | Manajemen Nilai (`/nilai`) | ⏳ Antrean | Input Nilai, Rekap Semester, Ranking |
| **Ujian** | Lembar Ujian (`/lembar-ujian`) | ⏳ Antrean | Generator Lembar Soal & Jawaban |
| **Ujian** | Kartu Ujian (`/kartu-ujian`) | ⏳ Antrean | Cetak Kartu Ujian Berfoto & Barcode |
| **Ujian** | Informasi Ujian (`/informasi-ujian`) | ⏳ Antrean | Jadwal Ujian, Pengawas, Tata Tertib |
| **Ujian** | Scan Nilai (`/scan-nilai`) | ⏳ Antrean | OCR / Barcode Scanner Lembar Nilai |
| **Keuangan** | Dashboard Keuangan | ⏳ Antrean | Ringkasan Arus Kas, Statistik Penerimaan |
| **Keuangan** | Tagihan Santri (`/tagihan-santri`) | ⏳ Antrean | Invoice SPP, Daftar Tagihan, Status Lunas |
| **Keuangan** | Buku Kas (`/buku-kas`) | ⏳ Antrean | Arus Kas Masuk & Keluar, Jurnal Umum |
| **Keuangan** | Cetak Kwitansi (`/cetak-kwitansi`) | ⏳ Antrean | Template Cetak Pembayaran Resmi |
| **Master** | Data Kamar (`/kamar`) | ⏳ Antrean | Asrama, Kapasitas Santri, Penempatan |
| **Master** | Data Alumni (`/alumni`) | ⏳ Antrean | Database Lulusan, Tracer Study |
| **Master** | Manajemen Users (`/users`) | ⏳ Antrean | Akun Pengguna, Role & Hak Akses |

---

## 7. Standard Operating Procedure (SOP) untuk AI Agent

Saat menerima tugas merombak halaman baru, ikuti urutan langkah berikut:

1. **Langkah 1: Audit & Discovery**:
   - Baca file halaman eksisting (misal `frontend/src/pages/Santri.jsx`) dan komponen pendukungnya.
   - Catat semua state, query parameter, service API yang dipanggil, modal yang terbuka, dan handler tombol.
2. **Langkah 2: Verifikasi Kontrak API**:
   - Periksa file service terkait di `frontend/src/services/` dan controller backend di `src/routes/`.
   - Pastikan tidak ada payload atau URL endpoint yang diubah.
3. **Langkah 3: Definisikan TypeScript Types**:
   - Buat file `frontend/src/types/<feature>.ts`.
   - Definisikan interface lengkap untuk entity, form data, modal props, dan filter state.
4. **Langkah 4: Desain Styling SCSS (Option A)**:
   - Buat atau perbarui file SCSS terkait (misal `Santri.scss`).
   - Terapkan token Liquid Glass: floating dock header, segmented controls, glass table container, 3D avatars, frosted pills.
5. **Langkah 5: Konversi Komponen & Halaman ke `.tsx`**:
   - Konversi file halaman dan modal ke `.tsx`.
   - Pasang TypeScript types pada state dan props.
   - Pastikan seluruh class name terhubung dengan benar dan tidak ada class clash (seperti kasus `display: none`).
6. **Langkah 6: Build Verification & Smoke Test**:
   - Jalankan `npm run build` di `frontend/` dan pastikan hasil build exit code 0.
   - Periksa tampilan di browser lokal untuk memastikan interaksi, modal, dan filter berfungsi 100%.
