# 💻 Panduan Pengembang (Development Guide)
### Pondok Pesantren Al-Hamid (Sekolah-Info)

Buku panduan ini ditujukan bagi pengembang perangkat lunak dan AI Agent yang berkontribusi dalam pengembangan dan pemeliharaan repositori **Sekolah-Info**.

---

## 🛠️ 1. Persiapan Lingkungan Kerja (Prerequisites)

Pastikan lingkungan lokal Anda telah memiliki perangkat lunak pendukung berikut:
- **Node.js**: Versi `20.x LTS` atau lebih tinggi ([Node.js](https://nodejs.org/))
- **PostgreSQL**: Versi `14.x` - `16.x` ([PostgreSQL](https://www.postgresql.org/))
- **Flutter SDK**: Versi `>=3.0.0` (Wajib jika mengembangkan `mymustahiq` & `mobile_absensi`)
- **.NET 8 SDK / Visual Studio**: (Wajib jika mengembangkan `desktop-scanner`)
- **Git**: Versi terbaru

---

## 🚀 2. Panduan Menjalankan Lingkungan Lokal

### A. Setup Dependensi Awal
```bash
# 1. Install root dependencies (Backend)
npm install

# 2. Install dependencies modul keuangan
cd keuangan && npm install && cd ..

# 3. Install dependencies frontend web
cd frontend && npm install && cd ..
```

### B. Konfigurasi Database Lokal
1. Buat database baru di PostgreSQL lokal Anda bernama `sekolah_info`.
2. Salin `.env.example` menjadi `.env` di root:
   ```bash
   cp .env.example .env
   ```
3. Sesuaikan `PGUSER`, `PGPASSWORD`, dan `PGDATABASE` pada file `.env`.
4. Jalankan migrasi master:
   ```bash
   npm run keuangan:build
   npm run migrate
   ```

### C. Menjalankan Server Pengembangan

#### Opsi 1: Menjalankan Seluruhnya Sekaligus (Direkomendasikan)
```bash
npm run dev:all
```
Perintah ini mengeksekusi tiga proses konkuren secara otomatis:
1. `npm run keuangan:watch` — TypeScript compiler otomatis memantau perubahan file di folder `keuangan/`.
2. `npm run backend` — Express server berjalan di `http://localhost:3000` via `nodemon` & `tsx`.
3. `npm run frontend` — Vite React dev server berjalan di `http://localhost:3001`.

#### Opsi 2: Menjalankan Secara Parsial
- **Backend Saja**: `npm run backend`
- **Frontend Saja**: `npm run frontend`
- **Kompilasi Modul Keuangan**: `npm run keuangan:build`

---

## 🎨 3. Standar Desain Frontend: Option A (Apple Liquid Glass)

Setiap halaman atau komponen baru yang dibuat pada direktori `frontend/` **WAJIB** tunduk pada spesifikasi visual [MASTER_UI_UX_REDESIGN_GUIDELINES.md](./MASTER_UI_UX_REDESIGN_GUIDELINES.md):

### A. Aturan Sakral Header Halaman (`.tactile-page-header`)
- **DILARANG** menggunakan ikon orb/lensa di samping judul.
- Judul halaman adalah teks murni: `h2.page-title` (25px, font-weight 700) dan `p.page-subtitle` (13.5px, Slate 500).
- Ikon hanya diizinkan pada: tombol aksi (+ Tambah Data), segmented control tabs, baris tabel, dan status pill badge.

### B. Karakteristik Visual Liquid Glass
```scss
// Panel Kaca Translucent
background: rgba(255, 255, 255, 0.65);
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);

// Specular Edge Highlight (Kilau Tepi Atas Kaca)
border: 1px solid rgba(255, 255, 255, 0.70);
border-top: 1.5px solid rgba(255, 255, 255, 0.95);

// Soft Optical Depth
box-shadow: 
  0 20px 40px -12px rgba(15, 23, 42, 0.08),
  0 1px 3px rgba(15, 23, 42, 0.04),
  inset 0 1px 1px rgba(255, 255, 255, 0.85);
```

### C. Larangan "AI Slop"
- Jangan pernah menambahkan metrik buatan, kartu data fiktif (*dummy KPI card*), atau efek neon berlebihan yang tidak mewakili kebutuhan riil operasional pesantren.

---

## 🛡️ 4. Kebijakan Keamanan API (Zero-Breakage Policy)

Aplikasi mobile Flutter (`mymustahiq` & `mobile_absensi`) dan desktop scanner aktif menggunakan API backend di lingkungan production. Karena itu:
1. **URL Endpoint Tidak Boleh Diubah**: Contoh `/api/santri`, `/api/guru`, `/api/absensi-sholat/scan`.
2. **Format Response JSON Harus Selaras**:
   - Berikan selalu format standar `{ success: true, data: ..., message: ... }`.
   - Jangan menghapus properti JSON yang telah dikonsumsi klien mobile.
3. **Pemberian Hak Akses (RBAC)**:
   - Pasang selalu middleware otentikasi pada route sensitif:
     ```typescript
     import { requireAuth, requireRole } from '../middleware/authMiddleware';
     router.post('/api/santri', requireAuth, requireRole(['admin', 'staff']), createSantriHandler);
     ```

---

## 🗃️ 5. Konvensi Migrasi Database

Saat menambahkan tabel atau kolom baru:
1. Buat berkas migrasi baru di direktori `migrations/` dengan pola penamaan deskriptif:
   `migrations/add_[nama_fitur]_table.js`
2. Tulis migrasi dengan prinsip **Idempotensi**:
   ```javascript
   exports.up = async function() {
     const db = require('../db');
     await db.query(`
       CREATE TABLE IF NOT EXISTS nama_tabel (
         id SERIAL PRIMARY KEY,
         nama VARCHAR(150) NOT NULL,
         created_at TIMESTAMPTZ DEFAULT NOW()
       );
       ALTER TABLE nama_tabel ADD COLUMN IF NOT EXISTS deskripsi TEXT;
     `);
   };
   ```
3. Daftarkan file migrasi baru ke dalam array `migrations` pada [`migrate-all.ts`](file:///d:/source/sekolah-info/migrate-all.ts).
4. Uji migrasi dengan menjalankan `npm run migrate`.

---

## 📱 6. Pengembangan Aplikasi Mobile Flutter

### A. Alhamid One (`mymustahiq/`)
- Navigasi ke direktori `mymustahiq/`.
- Jalankan `flutter pub get`.
- Untuk menghubungkan dengan backend lokal pada perangkat fisik Android:
  - Buka file konfigurasi API (`lib/services/api_service.dart`).
  - Ganti `baseUrl` dengan IP lokal komputer Anda (contoh: `http://192.168.1.15:3000/api`).
- Jalankan via terminal:
  ```bash
  flutter run
  ```

### B. Mobile Absensi Biometrik (`mobile_absensi/`)
- Navigasi ke direktori `mobile_absensi/`.
- Pastikan berkas model TFLite `assets/models/mobile_face_net.tflite` tersedia.
- Hubungkan HP Android fisik via kabel USB dengan mode USB Debugging aktif.
- Jalankan:
  ```bash
  flutter run
  ```

---

## 🖨️ 7. Pengembangan Desktop OMR Scanner

- Buka solusi atau file proyek `desktop-scanner/AlHamidScanner.csproj` menggunakan Visual Studio 2022 atau VS Code.
- Pastikan target framework `.NET 8.0-windows` atau `.NET Framework 4.8` terpasang.
- Bangun aplikasi:
  ```bash
  cd desktop-scanner
  dotnet build
  ```
- Untuk menguji integrasi scan, jalankan shortcut `Jalankan_Scanner_OMR.bat` di root project.

---

## 🧪 8. Verifikasi Kualitas & Kompilasi (Pre-Commit Checklist)

Sebelum melakukan commit atau push perubahan:
1. **Verifikasi Build Frontend**:
   ```bash
   cd frontend && npm run build
   ```
   *Pastikan menghasilkan output 0 errors.*
2. **Verifikasi Typecheck Modul Keuangan**:
   ```bash
   npm run keuangan:typecheck
   ```
3. **Verifikasi Jalannya Server**:
   ```bash
   npm run backend
   ```
   *Pastikan inisialisasi database sukses dan port 3000 mendengarkan request.*

---

*Selamat berkarya! Disiplin arsitektur dan konsistensi kode adalah kunci stabilitas jangka panjang sistem Sekolah-Info.* 🚀✨
