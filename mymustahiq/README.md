# 📱 Alhamid One — Aplikasi Mobile Resmi Ponpes Al-Hamid
### Portal Terpadu Dewan Asatidz, Wali Santri & Administrasi Kepesantrenan

**Alhamid One** adalah aplikasi mobile multi-platform berbasis **Flutter** yang menghubungkan seluruh ekosistem Pondok Pesantren Al-Hamid Cintamulya langsung ke genggaman dewan asatidz dan wali santri.

---

## 🌟 Fitur Utama & Modul Fungsional

### 1. 🎓 Portal Dewan Asatidz (Guru & Pembina)
- **Tab Kelasku**: Manajemen kelas binaan, presensi mengajar harian, dan input nilai santri langsung dari smartphone tanpa perlu membuka laptop.
- **Setoran Hafalan Al-Qur'an & Nadzom**: Input dan verifikasi setoran hafalan santri (*Surat, Ayat, Bait Nadzom Imrithi & Alfiyah*) lengkap dengan status predikat *mutqin*.
- **Manajemen Ujian & Tim Soal**: Pemantauan jadwal pengawas ujian, penyusunan silabus pembelajaran, dan verifikasi kartu ujian santri via pemindai barcode/kamera HP.
- **Laporan Akademik & Jurnal Mengajar**: Pembuatan laporan presensi dan catatan kedisiplinan (pelanggaran & prestasi) santri secara seketika.

### 2. 👨‍👩‍👧‍👦 Portal Wali Santri & Informasi Anak
- **Santri Explorer & Detail**: Pemantauan biodata anak, penempatan kelas & asrama, riwayat kesehatan, dan buku induk santri digital.
- **Monitoring Kehadiran Sholat**: Laporan riwayat absensi sholat 5 waktu berjamaah santri yang tercatat dari gerbang kiosk biometrik.
- **Rapor & Nilai Real-Time**: Akses hasil evaluasi ujian semester dan perkembangan capaian akademik santri.
- **Info Keuangan & Tagihan**: Rekapitulasi status pembayaran SPP bulanan, daftar ulang, serta transparansi rincian tagihan pesantren.

### 3. 💬 Komunikasi & Notifikasi Terpadu
- **Ruang Obrolan Internal (Chat Rooms)**: Saluran komunikasi aman antara wali santri dengan wali kelas atau pembina asrama santri.
- **Push Notification Firebase FCM**: Pengingat otomatis saat tagihan terbit, pengumuman penting pesantren, dan notifikasi kehadiran sholat anak.
- **Kalender Akademik & Agenda Pesantren**: Jadwal libur ma'had, tanggal ujian semester, haflah akhir sanah, dan pengajian umum.

---

## 🛠️ Tech Stack & Pustaka

- **Framework**: Flutter SDK (Dart `>=3.0.0`)
- **State Management**: Provider / Scoped State
- **Networking**: `http` REST API client terhubung ke `/api/mymustahiq/*`
- **Otentikasi**: Token Bearer JWT dengan enkripsi sandi lokal
- **Notifikasi**: `firebase_core` & `firebase_messaging` (FCM)
- **Dokumen & Media**: `flutter_pdfview`, `image_picker`, `camera`
- **Barcode & QR Scanner**: `qr_code_scanner` / `mobile_scanner`

---

## 📁 Struktur Direktori

```
mymustahiq/
├── lib/
│   ├── models/                # Model data JSON (Santri, Guru, Nilai, Tagihan, Chat)
│   ├── screens/               # 40+ Layar antarmuka fungsional
│   │   ├── dashboard_screen.dart          # Dasbor ringkasan aktivitas
│   │   ├── santri_explorer_screen.dart    # Daftar pencarian santri
│   │   ├── santri_detail_screen.dart      # Kartu lengkap biodata & akademik
│   │   ├── setoran_hafalan_screen.dart    # Modul muhafadzoh Qur'an/Nadzom
│   │   ├── kelasku_rapor_input_screen.dart# Input nilai & evaluasi kelas
│   │   ├── chat_rooms_screen.dart         # Daftar saluran chat
│   │   ├── chat_detail_screen.dart        # Ruang obrolan langsung
│   │   ├── scan_kartu_ujian_screen.dart   # Scanner barcode kartu santri
│   │   ├── buku_induk_screen.dart         # Buku induk digital
│   │   ├── notifications_screen.dart      # Pusat notifikasi masuk
│   │   ├── tab_home.dart                  # Tab navigasi beranda
│   │   ├── tab_akademik.dart              # Tab kurikulum & nilai
│   │   ├── tab_kelasku.dart               # Tab operasional guru
│   │   ├── tab_keuangan.dart              # Tab tagihan & SPP
│   │   └── tab_akun.dart                  # Profil pengguna & logout
│   ├── services/              # Penghubung REST API backend & local cache
│   ├── widgets/               # Komponen UI kartu, tombol kaca, badge
│   └── main.dart              # Titik masuk aplikasi Flutter
├── assets/                    # Gambar logo, ilustrasi, font pesantren
├── pubspec.yaml               # Dependensi paket Flutter
└── README.md                  # Dokumentasi aplikasi
```

---

## 🚀 Panduan Menjalankan Aplikasi (Development)

### 1. Sinkronisasi Pustaka
```bash
cd mymustahiq
flutter pub get
```

### 2. Konfigurasi Alamat Server API
Buka file `lib/services/api_service.dart`:
- **Untuk Pengujian Lokal di Komputer (Emulator)**:
  `http://10.0.2.2:3000/api` (Android Emulator) atau `http://localhost:3000/api` (iOS Sim)
- **Untuk Pengujian di HP Fisik**:
  Gunakan IP LAN komputer Anda, contoh: `http://192.168.1.15:3000/api`
- **Untuk Server Produksi VPS**:
  `https://pesantren-alhamid.com/api`

### 3. Menjalankan Aplikasi
Hubungkan perangkat Android Anda dengan mode USB Debugging aktif:
```bash
flutter run
```

---

## 📦 Membangun Berkas Rilis APK (Production)

Untuk menghasilkan berkas `.apk` siap pasang di smartphone asatidz dan wali santri:
```bash
# Bangun APK rilis (arsitektur ARM64 / ARMv7 teroptimasi)
flutter build apk --release --split-per-abi

# Atau bangun single fat APK:
flutter build apk --release
```
*Hasil berkas APK tersimpan di:*  
`build/app/outputs/flutter-apk/app-release.apk`

---

*Alhamid One: Menghubungkan Hati, Mewujudkan Pesantren Digital yang Unggul dan Terpercaya.* 🕌📱
