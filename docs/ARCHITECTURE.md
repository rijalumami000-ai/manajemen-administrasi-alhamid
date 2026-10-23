# 🏗️ Arsitektur Sistem & Topologi Ekosistem
### Pondok Pesantren Al-Hamid (Sekolah-Info)

Dokumen ini menjelaskan arsitektur teknis menyeluruh, topologi jaringan, aliran data antar-komponen, model keamanan, serta strategi integrasi perangkat keras (hardware) dan biometrik pada ekosistem **Sekolah-Info**.

---

## 1. Diagram Topologi Ekosistem

Ekosistem mengadopsi arsitektur **Modular Monolith Backend** yang melayani multi-klien lintas platform (Web SPA, 2 Aplikasi Mobile Flutter, dan 1 Aplikasi Desktop Windows) melalui antarmuka REST API terpadu:

```
                                  ┌──────────────────────────────────────────────────────────┐
                                  │             PENGGUNA / PERANGKAT KLIEN                   │
                                  └────────────────────────────┬─────────────────────────────┘
                                                               │
     ┌────────────────────────────┬────────────────────────────┼─────────────────────────────┬───────────────────────────┐
     │                            │                            │                             │                           │
┌────▼─────────────────┐   ┌──────▼──────────────┐   ┌─────────▼──────────────┐   ┌──────────▼───────────────┐   ┌───────▼─────────────────┐
│  💻 Web Browser      │   │  📱 HP Guru / Wali  │   │  🤳 Tablet / HP Kiosk  │   │  🖨️ Komputer Panitia    │   │  🌐 Verifikasi Publik   │
│  React 19 + Vite     │   │  Alhamid One        │   │  Mobile Absensi        │   │  Desktop OMR Scanner     │   │  Scan QR Kartu Ujian/   │
│  Liquid Glass UI     │   │  (Flutter)          │   │  (Flutter Biometrik)   │   │  (WPF C# .NET)           │   │  Kwitansi / Rapor       │
└──────────┬───────────┘   └──────────┬──────────┘   └─────────┬──────────────┘   └──────────┬───────────────┘   └──────────┬──────────────┘
           │                          │                        │                             │                              │
           │ HTTPS / WSS              │ HTTPS (REST)           │ HTTPS (REST + Base64)       │ HTTPS / Local LAN (REST)     │ HTTPS (GET)
           │                          │                        │                             │                              │
           └──────────────────────────┼────────────────────────┴─────────────────────────────┴──────────────────────────────┘
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────────────────────┐
             │                ☁️ PRODUCTION SERVER (IDCloudHost)                │
             │                     Ubuntu 24.04 LTS                             │
             │                                                                  │
             │  ┌────────────────────────────────────────────────────────────┐  │
             │  │   🌐 Nginx Web Server / Reverse Proxy                      │  │
             │  │   - SSL/TLS Termination (Let's Encrypt Certbot)            │  │
             │  │   - Gzip & Brotli Static Asset Compression                 │  │
             │  │   - Rate Limiting & DDOS Mitigation (UFW Firewall)         │  │
             │  │   - Serve frontend/dist SPA Fallback                       │  │
             │  │   - Reverse Proxy /api/* ke Port 3000                      │  │
             │  └──────────────────────────────┬─────────────────────────────┘  │
             │                                 │                                │
             │                                 ▼ (Reverse Proxy HTTP 127.0.0.1:3000)
             │  ┌────────────────────────────────────────────────────────────┐  │
             │  │   🚀 Node.js Backend Application (Managed by PM2)          │  │
             │  │   server.ts / Express REST API                             │  │
             │  │                                                            │  │
             │  │  ┌───────────────────────┐   ┌──────────────────────────┐  │  │
             │  │  │ Core API Routes (30)  │   │ Submodul Keuangan (TS)   │  │  │
             │  │  │ Santri, Guru, Nilai,  │   │ SPP, Kas Masuk/Keluar,   │  │  │
             │  │  │ Ujian, Absensi, Chat  │   │ Tagihan, Kwitansi, Audit │  │  │
             │  │  └───────────┬───────────┘   └────────────┬─────────────┘  │  │
             │  │              │                            │                │  │
             │  │  ┌───────────▼────────────────────────────▼─────────────┐  │  │
             │  │  │ Security & Middlewares:                              │  │  │
             │  │  │ - JWT Token Verification & Refresh Cookie            │  │  │
             │  │  │ - Role-Based Access Control (RBAC)                   │  │  │
             │  │  │ - Compression & Security Headers                     │  │  │
             │  │  │ - Centralized Error Handler                          │  │  │
             │  │  └───────────┬──────────────────────────────────────────┘  │  │
             │  │              │                                             │  │
             │  │  ┌───────────▼──────────────────────────────────────────┐  │  │
             │  │  │ Background Services:                                 │  │  │
             │  │  │ - Node-Cron Notification Scheduler                   │  │  │
             │  │  │ - Face-API & TFJS Feature Matching Engine            │  │  │
             │  │  │ - Firebase Admin Push Notification Dispatcher        │  │  │
             │  │  └───────────┬──────────────────────────────────────────┘  │  │
             │  └──────────────┼─────────────────────────────────────────────┘  │
             │                 │                                                │
             │                 ▼ Connection Pool (pg.Pool / 5432)               │
             │  ┌────────────────────────────────────────────────────────────┐  │
             │  │   🐘 PostgreSQL Relational Database (16.x)                 │  │
             │  │   - 35+ Normalized Tables with Foreign Key Constraints      │  │
             │  │   - B-Tree Performance Indexes                             │  │
             │  │   - Auto Increment Sequences & UUIDs                       │  │
             │  │   - Automated Daily Dump Backups                           │  │
             │  └────────────────────────────────────────────────────────────┘  │
             └──────────────────────────────────────────────────────────────────┘
```

---

## 2. Rincian Lapisan Arsitektur (Architectural Layers)

### A. Klien Pengguna (Presentation Layer)
1. **Web Single Page Application (`frontend/`)**:
   - Dibangun dengan **React 19**, **TypeScript**, dan **Vite 8**.
   - Gaya visual mengadopsi **Option A: Apple macOS Sequoia & VisionOS Liquid Glass** dengan SCSS modular.
   - Pemuatan halaman memanfaatkan *code splitting* dinamis (`React.lazy` & `Suspense`) untuk menjaga ukuran payload awal tetap kecil (<300 KB).
   - Menyediakan 40+ antarmuka operasional mulai dari dasbor pimpinan, manajemen kurikulum, input nilai guru, hingga kasir pembayaran keuangan.
2. **Alhamid One Mobile App (`mymustahiq/`)**:
   - Dibangun dengan **Flutter SDK** untuk platform Android dan iOS.
   - Bertindak sebagai portal terintegrasi bagi dewan asatidz (input nilai, absensi, jurnal mengajar, perizinan) dan wali santri (monitoring perkembangan anak, hafalan Qur'an, info tagihan, dan ruang obrolan internal).
3. **Mobile Absensi Biometrik (`mobile_absensi/`)**:
   - Kiosk mandiri dan aplikasi presensi cepat santri saat Sholat 5 Waktu berjamaah.
   - Menggunakan model kecerdasan buatan terkompresi *TensorFlow Lite* (*MobileFaceNet*) yang berjalan 100% *on-device* untuk deteksi wajah instan (<0.5 detik) tanpa lag jaringan.
   - Dilengkapi modul *Liveness Detection* (analisis kedipan mata) untuk mencegah pemalsuan presensi menggunakan foto statis.
4. **Desktop OMR Scanner (`desktop-scanner/`)**:
   - Aplikasi Windows Presentation Foundation (WPF) berbasis C# .NET.
   - Terhubung langsung dengan mesin pemindai dokumen berkecepatan tinggi (ADF scanner) untuk membaca lembar jawaban komputer (LJK) pilihan ganda ujian semester secara otomatis, mengonversi bulatan pensil menjadi data nilai numerik, dan menyimpannya langsung ke database pusat.

---

### B. Lapisan Server & API (Application Layer)
Backend diimplementasikan menggunakan arsitektur modular yang kuat:
1. **Shim Entrypoint (`server.js` & `server.ts`)**:
   - Menjalankan runtime TypeScript secara langsung via modul `tsx/cjs`.
   - Melakukan validasi variabel lingkungan wajib (`JWT_SECRET`, kredensial database) sebelum server diizinkan melayani request.
2. **Router Berbasis Domain (`src/routes/`)**:
   - Terdiri dari 30 file router yang memetakan URL RESTful secara bersih dan terisolasi.
   - Memastikan tidak ada tabrakan rute dan mempermudah pelacakan error.
3. **Submodul Keuangan Independen (`keuangan/`)**:
   - Komponen finansial dipisahkan ke dalam subdirektori tersendiri dengan konfigurasi TypeScript (`tsconfig.json`) terpisah.
   - Memiliki layer service dan router sendiri untuk menangani transaksi penerimaan (SPP, daftar ulang, event), pengeluaran (buku kas), dan audit log.
4. **Service Layer Terpisah (`src/services/`)**:
   - Logika bisnis tidak dicampur ke dalam handler rute.
   - Contoh: `alumniService.ts`, `nilaiService.ts`, `absensiSholatService.ts`, `faceRecognitionService.ts`, `santriExcelService.ts`, dan `scheduler.ts`.
5. **Background Scheduler (`node-cron`)**:
   - Menjalankan cron job di latar belakang untuk mengirimkan notifikasi pengingat sholat, rekapitulasi kehadiran harian, dan pemeliharaan token sesi yang kedaluwarsa.

---

### C. Lapisan Penyimpanan Data (Persistence Layer)
- **Database Engine**: **PostgreSQL 16.x**.
- **Koneksi Database (`db.ts`)**: Menggunakan `pg.Pool` dengan manajemen connection pooling otomatis untuk efisiensi memori dan penanganan lonjakan koneksi konkuren.
- **Strategi Migrasi**:
  - Seluruh migrasi database dikoordinasikan secara terpusat melalui `migrate-all.ts` yang bersifat *idempotent* (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
  - Menjamin keamanan skema saat eksekusi berulang di VPS production tanpa risiko kehilangan data eksisting.
- **Indeks Kinerja (`sql/performance_indexes.sql`)**:
  - Kolom-kolom yang sering menjadi filter pencarian (`santri_id`, `kelas_id`, `tahun_ajaran_id`, `tanggal`, `nisn`, `nomor_induk`) dilengkapi indeks B-Tree untuk mempercepat eksekusi query hingga 10x lipat.

---

## 3. Model Keamanan & Aliran Otentikasi

Sistem mengadopsi standar keamanan berlapis sesuai *industry best practices*:

```
[ Pengguna ] ─── (1) POST /api/auth/login { username, password } ───► [ Backend Express ]
                                                                             │
                                                                             ▼
                                                                 (2) Validasi Rate Limit
                                                                     (Max 10 coba / 15 mnt)
                                                                             │
                                                                             ▼
                                                                 (3) Cari User di PostgreSQL
                                                                             │
                                                                             ▼
                                                                 (4) Bcrypt.compare(hash)
                                                                             │
                                                                     ┌───────┴───────┐
                                                                     ▼               ▼
                                                                  [Sukses]        [Gagal]
                                                                     │               │
                                                                     │          HTTP 401 Error
                                                                     ▼
                                                     (5) Terbitkan Token:
                                                         - Access Token (JWT, 1 jam)
                                                         - Refresh Token (7 hari, httpOnly Cookie)
                                                                     │
[ Pengguna ] ◄─── (6) Return Response JSON { user, token } ──────────┘
```

### Mekanisme Pengamanan:
1. **Password Hashing**: Menggunakan algoritma **Bcrypt** dengan cost factor 10.
2. **Dual-Token System**:
   - **Access Token**: Disimpan di memori klien dengan masa kedaluwarsa singkat (1 jam).
   - **Refresh Token**: Disimpan dalam cookie berstatus `httpOnly`, `Secure`, dan `SameSite` untuk mencegah serangan Cross-Site Scripting (XSS).
3. **Role-Based Access Control (RBAC)**:
   - Dijalankan via middleware `authorize(['admin', 'guru', 'bendahara'])` pada setiap endpoint sensitif.
4. **Rate Limiting Login**:
   - Membatasi percobaan login maksimal 10 kali per 15 menit per alamat IP guna mencegah serangan brute-force.
5. **Security HTTP Headers**:
   - `X-Frame-Options: SAMEORIGIN` (mencegah Clickjacking).
   - `X-Content-Type-Options: nosniff` (mencegah MIME confusion attack).
   - `X-XSS-Protection: 1; mode=block`.
   - `Permissions-Policy: camera=(self)` (hanya mengizinkan akses kamera untuk domain internal).

---

## 4. Aliran Data Presensi Biometrik Wajah

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ Kamera HP / Tablet     │ ───► │ MediaPipe Face Mesh /   │ ───► │ Ekstraksi 128/512       │
│ Input Video Stream     │      │ Liveness Blink Detector │      │ Float32 Embedding       │
└────────────────────────┘      └─────────────────────────┘      └────────────┬────────────┘
                                                                              │
                                                                              ▼
                                                                 ┌─────────────────────────┐
                                                                 │ Cocokkan dengan         │
                                                                 │ Cache Wajah Santri      │
                                                                 │ (Euclidean Distance)    │
                                                                 └────────────┬────────────┘
                                                                              │
                                       ┌──────────────────────────────────────┴──────────────────────────────────────┐
                                       ▼ (Jarak < Ambang Batas 0.45)                                                 ▼ (Tidak Dikenal)
                         ┌───────────────────────────┐                                                 ┌───────────────────────────┐
                         │ Presensi Berhasil Dikenali│                                                 │ Bunyikan Audio Peringatan │
                         │ - Putar Audio Nama Santri │                                                 │ "Wajah Tidak Terdaftar"   │
                         │ - Kirim Log ke Server     │                                                 └───────────────────────────┘
                         └─────────────┬─────────────┘
                                       │
                                       ▼ POST /api/absensi-sholat/scan
                         ┌───────────────────────────┐
                         │ Simpan ke PostgreSQL      │
                         │ - Catat Jam & Menit Hadir │
                         │ - Update Status Santri    │
                         └───────────────────────────┘
```

---

## 5. Aliran Integrasi OMR Scanner Ujian

```
[ Lembar Jawaban Ujian ] ──► [ Hardware Scanner ] ──► [ Desktop Scanner WPF App ]
                                                                │
                                                                ▼
                                                     Deteksi Barcode Kartu Ujian
                                                     (No Peserta & Kode Mapel)
                                                                │
                                                                ▼
                                                     Grid Scanning Bulatan Pensil
                                                     (Thresholding & Pixel Density)
                                                                │
                                                                ▼
                                                     Kalkulasi Skor Jawaban Benar
                                                                │
                                                                ▼
                                                     POST /api/nilai/batch-omr
                                                                │
                                                                ▼
                                                     [ Database PostgreSQL ]
                                                     (Tersimpan langsung di Nilai Santri)
```

---

## 6. Arsitektur Jaringan & Skalabilitas VPS

- **Reverse Proxy**: Nginx bertindak sebagai gerbang terdepan yang menangani seluruh lalu lintas port 80 (HTTP) dan 443 (HTTPS), mengarahkan request aplikasi ke server Node.js lokal di port 3000.
- **Process Management**: Menggunakan **PM2** dalam mode `fork` atau `cluster` untuk menjaga aplikasi tetap hidup (*zero-downtime restart*) saat terjadi uncaught exception atau reboot server.
- **Static Asset Serving**: Aset build frontend (`frontend/dist`) dan folder upload publik (`public/uploads`) disajikan langsung dengan header caching agresif (`Cache-Control: max-age=31536000`) untuk memangkas beban CPU server backend.

---

*Arsitektur ini dirancang untuk memastikan kestabilan jangka panjang, skalabilitas hingga ribuan santri, dan keandalan operasional pesantren 24/7.* 🛡️🚀
