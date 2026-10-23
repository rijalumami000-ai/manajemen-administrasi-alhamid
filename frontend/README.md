# 🌐 Frontend Web Application — Pondok Pesantren Al-Hamid
### React 19, TypeScript, Vite 8 & Option A Apple Liquid Glass UI/UX

Aplikasi web modern berbasis Single Page Application (SPA) untuk operasional terpadu akademik, kepesantrenan, dan keuangan **Pondok Pesantren Al-Hamid Cintamulya**.

---

## 🎨 Konsep Desain: Option A (Apple Liquid Glass)

Frontend mengadopsi estetika antarmuka fisik-taktil generasi baru terinspirasi oleh **Apple macOS Sequoia & VisionOS Liquid Glass**:
- **Translucency & Frosted Glass**: Panel transparan dengan `backdrop-filter: blur(20px)` hingga `blur(32px)`.
- **Specular Edge Highlights**: Kilau pencahayaan tepi atas kaca fisik (`border-top: 1.5px solid rgba(255, 255, 255, 0.95)`).
- **Tactile Page Header**: Judul halaman teks murni (`h2.page-title` & `p.page-subtitle`) tanpa ikon orb/lensa samping judul.
- **Aurora Mesh Gradient Background**: Nuansa warna latar Slate/Aurora yang nyaman di mata.
- **Zero AI Slop**: Desain bersih, presisi, tanpa elemen fiktif atau widget artifisial.

Panduan lengkap: [`docs/MASTER_UI_UX_REDESIGN_GUIDELINES.md`](file:///d:/source/sekolah-info/docs/MASTER_UI_UX_REDESIGN_GUIDELINES.md).

---

## 🛠️ Tech Stack & Library Utama

- **Framework**: React 19 (`react`, `react-dom` ^19.2.5)
- **Language**: TypeScript 5+
- **Bundler & Dev Server**: Vite 8 (`vite` ^8.0.10)
- **Routing**: React Router DOM v7 (`react-router-dom` ^7.14.2)
- **Styling**: Sass / SCSS Modular (`sass` ^1.99.0)
- **Icons**: Lucide React (`lucide-react` ^1.17.0)
- **HTTP Client**: Axios (`axios` ^1.15.2)
- **Biometrik & Kamera**: `@vladmandic/face-api`, `@mediapipe/face_mesh`, `react-webcam`
- **PDF & Cetak**: `jspdf`, `jspdf-autotable`
- **QR Code & OCR**: `qrcode.react`, `html5-qrcode`, `tesseract.js`
- **Spreadsheet**: `xlsx`

---

## 📁 Struktur Direktori

```
frontend/
├── src/
│   ├── components/            # Komponen React terstruktur
│   │   ├── common/            # Komponen taktil reusable (Button, Modal, Table, Toast, CustomSelect)
│   │   ├── layout/            # Layout utama (Sidebar, Header, Layout container)
│   │   └── features/          # Komponen spesifik fitur/domain
│   ├── context/               # React Context (AuthContext)
│   ├── hooks/                 # Custom React hooks (useFetch, useModal, usePagination)
│   ├── pages/                 # 40+ Halaman fungsional akademik, ujian, dan keuangan
│   │   ├── Santri.tsx         # Data master santri & riwayat kelas
│   │   ├── Guru.tsx           # Asatidz, jabatan & mapel diampu
│   │   ├── Alumni.tsx         # Data alumni & pelacakan profesi
│   │   ├── Kelas.tsx          # Manajemen kelas berjenjang
│   │   ├── Kamar.tsx          # Asrama & penempatan kamar santri
│   │   ├── ManajemenNilai.tsx # Input nilai harian, ujian & rekap
│   │   ├── RaporPrint.tsx     # Cetak rapor resmi standar pesantren
│   │   ├── InformasiUjian.tsx # Kelengkapan administrasi ujian
│   │   ├── KartuUjianSemester.tsx # Kartu ujian ber-barcode & QR
│   │   ├── LembarUjian.tsx    # Desain LJK kompatibel OMR Scanner
│   │   ├── ScanNilai.tsx      # Pemindaian lembar jawaban via webcam
│   │   ├── MonitoringSetoranHafalan.tsx # Setoran Qur'an & Nadzom
│   │   ├── RekapMuhafadzohMini.tsx # Rekap capaian muhafadzoh
│   │   ├── BukuInduk.tsx      # Buku induk santri digital
│   │   ├── StrukturKepesantrenan.tsx # Struktur kelembagaan
│   │   ├── JadwalPelajaran.tsx# Roster jadwal mengajar mingguan
│   │   ├── Romadhon.tsx       # Manajemen kegiatan Ramadhan
│   │   ├── KeuanganDashboard.tsx # Arus kas & ringkasan tagihan
│   │   ├── TagihanSantri.tsx  # Billing SPP & iuran santri
│   │   ├── LaporanSPP.tsx     # Rekapitulasi pembayaran SPP
│   │   ├── BukuKas.tsx        # Buku kas masuk & kas keluar
│   │   ├── CetakKwitansi.tsx  # Kwitansi resmi ber-QR verification
│   │   └── Users.tsx          # Manajemen hak akses pengguna
│   ├── services/              # Modul klien REST API terpisah per entitas
│   ├── styles/                # Arsitektur SCSS Option A Liquid Glass
│   ├── types/                 # Interface TypeScript per fitur (Zero any policy)
│   ├── utils/                 # Helper format tanggal, mata uang, validasi
│   ├── App.tsx                # Konfigurasi router, code splitting, dan auth guards
│   └── main.tsx               # Titik masuk utama React
├── vite.config.ts             # Konfigurasi Vite, proxy API, dan visualizer
└── package.json               # Dependensi proyek
```

---

## ⚡ Cara Menjalankan Frontend

### 1. Mode Pengembangan (Development)
```bash
# Pastikan berada di folder frontend
cd frontend

# Jalankan Vite dev server di port 3001
npm run dev
```
Akses antarmuka web di: [http://localhost:3001](http://localhost:3001)  
*Vite telah dikonfigurasi untuk mem-proxy request `/api/*` secara otomatis ke backend di `http://localhost:3000`.*

### 2. Membangun untuk Produksi (Production Build)
```bash
npm run build
```
*Build akan menghasilkan berkas statis teroptimasi di `frontend/dist/`. Selalu pastikan hasil kompilasi **0 error** sebelum melakukan commit/push.*

### 3. Menganalisis Ukuran Bundle
```bash
npm run build:analyze
```
*Akan membuka visualizer visual untuk memeriksa ukuran pustaka dan modul yang ter-bundle.*

---

## 🔒 Otentikasi & Route Guards

Otentikasi dikelola secara reaktif via `AuthContext`. Halaman operasional dilindungi oleh komponen `<ProtectedRoute>`:
- Jika pengguna belum login, sistem akan otomatis mengarahkan ke halaman `/login`.
- Token otentikasi disimpan di memori dan cookie `httpOnly` dikelola backend untuk mencegah serangan XSS.
- Halaman verifikasi publik seperti `/pub/laporan-ujian-khusus` dan `/verify/:no_peserta` dapat diakses tanpa otentikasi.

---

*Frontend Al-Hamid: Memadukan keanggunan desain modern kelas dunia dengan efisiensi tata kelola pesantren.* 🍏✨
