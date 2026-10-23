# 🕌 Sistem Informasi Pesantren Al-Hamid (Sekolah-Info)
### Ekosistem Manajemen Administrasi Terpadu, Akademik, Keuangan, Mobile App & Biometrik
> **Pondok Pesantren Al-Hamid Cintamulya**  
> *Sistem operasional terintegrasi lintas platform (Web, Mobile Flutter, Desktop Scanner, dan Backend Microservices).*

---

## 🌟 Ikhtisar Ekosistem

**Sekolah-Info** adalah ekosistem perangkat lunak terintegrasi yang dirancang khusus untuk memenuhi seluruh siklus operasional, tata kelola santri, administrasi akademik, pembukuan keuangan syariah, presensi biometrik cerdas, hingga komunikasi wali santri dan dewan asatidz di **Pondok Pesantren Al-Hamid Cintamulya**.

Sistem ini beroperasi secara aktif di lingkungan **production** dengan menghubungkan berbagai klien dan sub-sistem:

```
                                  ┌─────────────────────────────────────────┐
                                  │   ☁️ VPS Production (Ubuntu 24.04 LTS)   │
                                  │    Nginx Reverse Proxy + SSL Let's Encrypt
                                  └────────────────────┬────────────────────┘
                                                       │
                      ┌────────────────────────────────┴──────────────────────────────┐
                      │                                                               │
        ┌─────────────▼─────────────┐                                   ┌─────────────▼─────────────┐
        │   🚀 Node.js + TS Backend │ ◄── [REST API / JSON / JWT] ────► │  💰 Modul Keuangan (TS)   │
        │   Express / Port 3000     │                                   │  Kas, SPP, Tagihan, Kwitansi
        │   Face-API & Node-Cron    │                                   └─────────────┬─────────────┘
        └─────────────┬─────────────┘                                                 │
                      │                                                               │
      ┌───────────────┼──────────────────────────────┬────────────────────────────────┤
      │               │                              │                                │
┌─────▼──────┐ ┌──────▼──────┐                ┌──────▼──────┐                  ┌──────▼──────┐
│  🌐 Web    │ │  📱 Alhamid │                │  🤳 Mobile  │                  │  🖨️ Desktop  │
│  Frontend  │ │     One     │                │   Absensi   │                  │   Scanner   │
│ (React 19, │ │  (Flutter)  │                │  Biometrik  │                  │  (WPF C#    │
│ TypeScript,│ │ Asatidz,    │                │ Face & Live │                  │   .NET OMR  │
│ Liquid     │ │ Wali, Chat, │                │ Detection   │                  │  Lembar     │
│ Glass)     │ │ Akademik    │                │ (Sholat)    │                  │  Ujian)     │
└────────────┘ └─────────────┘                └─────────────┘                  └─────────────┘
      │               │                              │                                │
      └───────────────┴──────────────┬───────────────┴────────────────────────────────┘
                                     │
                       ┌─────────────▼─────────────┐
                       │   🐘 PostgreSQL Database  │
                       │   Master Schema + Seeders │
                       │   & Auto Migrations       │
                       └───────────────────────────┘
```

---

## 📦 Komponen & Sub-Proyek

| Sub-Sistem / Direktori | Platform & Teknologi | Peran & Deskripsi Utama |
|---|---|---|
| **Core Backend** (`/`, `src/`) | Node.js 20 LTS, Express, TypeScript, `tsx`, `pg`, `@vladmandic/face-api`, `firebase-admin` | REST API utama, manajemen session & JWT, pengenalan wajah biometrik, background scheduler, ekspor/impor Excel, dan push notification. |
| **Web Frontend** (`frontend/`) | React 19, TypeScript, Vite 8, React Router v7, Sass, Lucide React, MediaPipe | Antarmuka web modern dengan standar desain **Option A: Apple macOS Sequoia & VisionOS Liquid Glass** (40+ halaman operasional). |
| **Modul Keuangan** (`keuangan/`) | Node.js, Express, TypeScript sub-service | Pengelolaan SPP bulanan, daftar ulang, insidental/event, pencatatan buku kas masuk/keluar, cetak kwitansi berseri, dan audit log keuangan. |
| **Alhamid One** (`mymustahiq/`) | Flutter SDK (Android / iOS), Dart, Provider | Aplikasi mobile resmi santri, asatidz, dan wali santri. Mencakup buku induk, setoran hafalan, jadwal, input nilai kelas, chat internal, dan notifikasi. |
| **Mobile Absensi** (`mobile_absensi/`) | Flutter, TensorFlow Lite, Camera, Audio/Haptic | Kiosk dan mobile presensi sholat berjamaah dengan *Face Recognition* biometrik, *Liveness Detection* (anti-spoofing), dan sinkronisasi otomatis. |
| **Desktop OMR Scanner** (`desktop-scanner/`) | C# .NET WPF, Windows Forms, Image Processing | Aplikasi desktop scanner kecepatan tinggi untuk membaca lembar jawaban komputer (LJK/OMR) ujian madrasah dan sinkronisasi langsung ke database. |

---

## 💎 Fitur Unggulan Sistem

### 1. 🎓 Akademik, Kesiswaan & Kurikulum Terpadu
- **Master Data Santri & Asatidz**: Kelengkapan biodata, riwayat pendidikan, penempatan kelas berjenjang, kamar asrama, dan buku induk digital.
- **Manajemen Nilai & Rapor**: Penilaian harian, tugas, ujian semester, cetak rapor resmi standar pesantren lengkap dengan tanda tangan digital dan foto santri.
- **Jadwal & Silabus**: Penjadwalan mata pelajaran mingguan per kelas, alokasi jam mengajar guru, dan silabus capaian materi kurikulum diniyah.
- **Setoran Hafalan Al-Qur'an & Nadzom**: Pencatatan riwayat hafalan ayat/surat dan nadzom kitab kuning (*Alfiyah, Imrithi, Aqidatul Awam*) dengan rekapitulasi muhafadzoh.
- **Kedisiplinan & Prestasi**: Poin pelanggaran santri, takzir (sanksi), serta catatan prestasi akademik dan non-akademik.

### 2. 💰 Keuangan Syariah & Pembukuan Kas Pesantren
- **Multi-Kategori Iuran**: SPP bulanan (Makan & Madin), daftar ulang santri baru & lama, serta event insidental (haflah, seragam, kitab).
- **Billing & Kwitansi Resmi**: Otomatisasi generate tagihan bulanan santri dan cetak kwitansi pembayaran berseri dengan QR code verifikasi.
- **Jurnal Kas Masuk & Keluar**: Pencatatan arus kas riil pesantren dengan tracking kategori belanja dan laporan audit jejak transaksi.

### 3. 🤳 Biometrik & Otomasi Ujian Cerdas
- **Presensi Wajah Sholat Berjamaah**: Deteksi wajah multi-santri dengan verifikasi *liveness detection* (kedipan mata) lokal di perangkat Android.
- **Ujian Terkomputerisasi & Scanner OMR**: Cetak lembar jawaban ujian berstandar scanner dan aplikasi pemindai OMR otomatis untuk input nilai kilat.
- **Kartu Peserta Ujian**: Generate kartu ujian ber-barcode dan QR code verifikasi publik yang dapat dipindai oleh panitia ujian.

### 4. 🎨 Desain Visual Kaca Modern (Option A Liquid Glass)
- Antarmuka web mengadopsi estetika **macOS Sequoia & VisionOS**:
  - Translucent liquid glass surfaces (`backdrop-filter: blur(20px)`).
  - Specular edge highlights (`border-top: 1.5px solid rgba(255, 255, 255, 0.95)`).
  - Layered soft elevations, aurora mesh background gradients, dan tipografi elegan.
  - Zero "AI Slop" — tampilan profesional, bersih, dan fungsional.

---

## 🛠️ Prasyarat Lingkungan Pengembangan

Sebelum menjalankan sistem secara lokal, pastikan perangkat Anda telah terpasang:
- **Node.js**: Versi `20.x LTS` atau yang lebih baru ([Unduh Node.js](https://nodejs.org/))
- **PostgreSQL**: Versi `14.x` hingga `16.x` ([Unduh PostgreSQL](https://www.postgresql.org/))
- **Flutter SDK**: Versi `>=3.0.0` (Khusus untuk `mymustahiq` & `mobile_absensi`)
- **.NET SDK / Desktop Runtime**: .NET 8 / Framework runtime (Khusus untuk `desktop-scanner`)
- **Git**: Versi terbaru

---

## ⚡ Panduan Instalasi & Menjalankan Lokal

### 1. Kloning Repositori & Pemasangan Dependensi
```bash
# Kloning repositori
git clone https://github.com/rijalumami000-ai/manajemen-administrasi-alhamid.git
cd sekolah-info

# Install dependensi backend root
npm install

# Install dependensi modul keuangan
cd keuangan && npm install && cd ..

# Install dependensi frontend web
cd frontend && npm install && cd ..
```

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env` di direktori root:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi kredensial database dan rahasia JWT Anda:
```env
NODE_ENV=development
PORT=3000

PGHOST=localhost
PGUSER=postgres
PGPASSWORD=password_postgres_anda
PGDATABASE=sekolah_info
PGPORT=5432

JWT_SECRET=buat_kunci_rahasia_acak_minimal_32_karakter_disini
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

### 3. Inisialisasi Database & Migrasi
Pastikan service database PostgreSQL aktif dan database `sekolah_info` sudah dibuat:
```bash
# Jalankan kompilasi modul keuangan terlebih dahulu
npm run keuangan:build

# Jalankan seluruh migrasi database terpadu (idempotent & aman)
npm run migrate
```

### 4. Menjalankan Server Pengembangan

#### Opsi A: Jalankan Seluruh Servis Bersamaan (Direkomendasikan)
```bash
npm run dev:all
```
*Perintah ini akan menjalankan TypeScript watch pada modul keuangan, backend Express (port 3000), dan frontend Vite (port 3001) secara paralel.*

#### Opsi B: Jalankan Secara Terpisah
- **Terminal 1 (Backend)**:
  ```bash
  npm run backend
  ```
- **Terminal 2 (Frontend Web)**:
  ```bash
  npm run frontend
  ```
- **Akses Antarmuka Web**: Buka browser di [http://localhost:3001](http://localhost:3001)  
- **Akses Backend API**: [http://localhost:3000/api](http://localhost:3000/api)

---

## 📱 Menjalankan Aplikasi Mobile Flutter

### 1. Alhamid One (`mymustahiq/`)
```bash
cd mymustahiq
flutter pub get
flutter run
```

### 2. Mobile Absensi Biometrik (`mobile_absensi/`)
```bash
cd mobile_absensi
flutter pub get
flutter run
```
*Pastikan konfigurasi URL backend di `lib/services/api_service.dart` mengarah ke alamat IP lokal komputer server Anda (contoh: `http://192.168.1.100:3000`).*

---

## 🖨️ Menjalankan Desktop OMR Scanner

Untuk memindai lembar jawaban ujian di Windows:
- Buka dan jalankan pintasan: `Jalankan_Scanner_OMR.bat`
- Atau bangun proyek melalui visual studio / .NET CLI:
  ```bash
  cd desktop-scanner
  dotnet build
  dotnet run
  ```

---

## 📚 Struktur Direktori Repositori

```
sekolah-info/
├── AGENTS.md                  # Direktif & aturan baku AI Agent
├── GEMINI.md                  # Master direktif Google Gemini / Antigravity
├── server.ts                  # Backend server utama (Express + TypeScript)
├── server.js                  # Shim entrypoint Node.js / PM2 runtime
├── db.ts                      # Konfigurasi pool koneksi PostgreSQL
├── migrate-all.ts             # Master migration runner otomatis
├── setup-vps.sh               # Skrip otomatisasi instalasi VPS Ubuntu
│
├── src/                       # Source code backend utama
│   ├── database/              # Init database & migrasi dasar
│   ├── middleware/            # Auth JWT, RBAC, dan validasi
│   ├── routes/                # 30 file router REST API
│   ├── services/              # Logika bisnis terpisah (Alumni, Nilai, Biometrik, Scheduler)
│   ├── types/                 # Definisi interface TypeScript backend
│   └── utils/                 # Error handler, logger, helper kalkulasi
│
├── frontend/                  # Aplikasi Web Single Page Application (SPA)
│   ├── src/
│   │   ├── components/        # Komponen reusable (Liquid Glass, Modal, Table, Toast)
│   │   ├── context/           # React Context (AuthContext)
│   │   ├── pages/             # 40+ Halaman fitur akademik, ujian, dan keuangan
│   │   ├── services/          # Klien API terpisah per domain
│   │   ├── styles/            # Arsitektur SCSS Option A Liquid Glass
│   │   └── types/             # Interface TypeScript per fitur
│   ├── vite.config.ts         # Konfigurasi build Vite & proxy API
│   └── package.json           # Dependensi React 19 & Vite 8
│
├── keuangan/                  # Modul Finansial Pesantren (TypeScript)
│   ├── src/
│   │   ├── routes/            # Tagihan, Kas Keluar, Laporan SPP, Audit, Setup
│   │   ├── services/          # Service layer kalkulasi keuangan
│   │   └── types/             # Interface schema keuangan
│   └── package.json           # Dependensi kompilasi submodule keuangan
│
├── mobile_absensi/            # Flutter: Presensi Sholat Wajah & Liveness Detection
├── mymustahiq/                # Flutter: Alhamid One (Aplikasi Terpadu Pesantren)
├── desktop-scanner/           # C# WPF: OMR Scanner Lembar Jawaban Komputer
├── migrations/                # 17 File migrasi database inkremental
├── sql/                       # DDL skema database relasional (PostgreSQL)
└── docs/                      # Dokumentasi komprehensif proyek
    ├── README.md              # Hub navigasi dokumentasi
    ├── INDEX.md               # Indeks pencarian cepat topik & panduan
    ├── ROADMAP.md             # Rencana strategis & milestone pengembangan
    ├── ARCHITECTURE.md        # Arsitektur sistem & topologi ekosistem
    ├── API_DOCUMENTATION.md   # Kontrak lengkap REST API endpoint
    ├── DEVELOPMENT_GUIDE.md   # Panduan lengkap developer
    ├── DEPLOYMENT_GUIDE.md    # Panduan deployment produksi VPS & Nginx
    └── MASTER_UI_UX_REDESIGN_GUIDELINES.md # Panduan standar desain kaca Apple
```

---

## 🔒 Keamanan & Hak Akses (RBAC)

Sistem menerapkan pengamanan berlapis berbasis peran (*Role-Based Access Control*):
- **Admin**: Akses penuh ke seluruh menu, konfigurasi sistem, user management, dan audit log.
- **Guru / Asatidz**: Akses modul kelas, absensi santri, input nilai mata pelajaran yang diampu, serta pencatatan hafalan Al-Qur'an/Nadzom.
- **Bendahara / Keuangan**: Akses khusus kas keluar, input pembayaran SPP/daftar ulang, penerbitan kwitansi, dan laporan keuangan.
- **Staff / Kesiswaan**: Akses buku induk santri, perizinan, kamar santri, serta pencatatan pelanggaran & prestasi.
- **Orangtua / Santri**: Akses portal mobile terpadu (Alhamid One) untuk melihat nilai, absensi, tagihan, dan pengumuman.

---

## 🚀 Skrip & Perintah Penting

| Perintah | Deskripsi |
|---|---|
| `npm run dev:all` | Menjalankan seluruh lingkungan pengembang secara bersamaan |
| `npm run backend` | Menjalankan backend server menggunakan `nodemon` & `tsx` |
| `npm run frontend` | Menjalankan Vite dev server untuk frontend web |
| `npm run keuangan:build` | Mengompilasi TypeScript submodule keuangan ke direktori `dist/` |
| `npm run keuangan:watch` | Menjalankan kompilasi TypeScript otomatis modul keuangan |
| `npm run migrate` | Menjalankan seluruh script migrasi database PostgreSQL |
| `npm start` | Menjalankan server backend untuk mode produksi melalui PM2/Node |

---

## 📖 Indeks Dokumentasi Lanjutan

Untuk membaca panduan teknis yang lebih mendalam, silakan kunjungi:
- 🗺️ **[Roadmap Pengembangan Proyek](file:///d:/source/sekolah-info/docs/ROADMAP.md)**
- 🏗️ **[Arsitektur & Topologi Sistem](file:///d:/source/sekolah-info/docs/ARCHITECTURE.md)**
- 🔌 **[Dokumentasi Lengkap REST API](file:///d:/source/sekolah-info/docs/API_DOCUMENTATION.md)**
- 💻 **[Panduan Pengembang (Development Guide)](file:///d:/source/sekolah-info/docs/DEVELOPMENT_GUIDE.md)**
- ☁️ **[Panduan Deployment VPS Produksi](file:///d:/source/sekolah-info/docs/DEPLOYMENT_GUIDE.md)**
- 🎨 **[Master Standar Desain Option A Liquid Glass](file:///d:/source/sekolah-info/docs/MASTER_UI_UX_REDESIGN_GUIDELINES.md)**
- 🗂️ **[Indeks Navigasi Seluruh Dokumen](file:///d:/source/sekolah-info/docs/INDEX.md)**

---

## 📄 Lisensi & Hak Cipta
Hak Cipta © 2026 **Pondok Pesantren Al-Hamid Cintamulya**. Seluruh hak cipta dilindungi undang-undang. Sistem ini dikembangkan untuk kepentingan operasional internal pesantren.
