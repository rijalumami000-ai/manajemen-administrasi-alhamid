# 📱 Aplikasi Mobile Presensi Cerdas (Face Recognition) - Ponpes Al-Hamid Cintamulya

Aplikasi mobile berbasis **Flutter** ini dirancang khusus untuk mengelola presensi sholat berjamaah santri secara **biometrik, cerdas, aman, dan berpenampilan premium**. Terintegrasi penuh secara real-time dengan server utama Manajemen Administrasi Pondok Pesantren Al-Hamid.

---

## 🌟 Fitur Unggulan Premium

1. **🔒 Keamanan Liveness Detection Lokal**
   * Deteksi kedipan mata (*blink detection*) secara real-time langsung di perangkat HP/Tablet untuk mencegah manipulasi menggunakan foto atau video santri.
2. **🔄 Dual-Camera Live Switcher**
   * Tombol transisi instan bergaya glassmorphic di pojok kamera untuk menukar penggunaan kamera depan (kiosk mandiri) dan kamera belakang (dioperasikan ustadz) secara mulus.
3. **📡 Indikator Konektivitas Server Real-Time**
   * Lampu indikator status server neon di layar scan kamera untuk menguji koneksi API secara otomatis setiap 5 detik.
4. **🎨 Estetika Antarmuka Premium & Glassmorphism**
   * Dilengkapi gerbang masuk kode akses rahasia (`alhamidku123`), efek bayangan pendar (*neon glowing shadows*), serta logo resmi Al-Hamid yang anggun.
5. **🎉 Umpan Balik Multi-Sensoris (Audio & Getar)**
   * Sound effect sukses/gagal yang jernih, teks pidato suara (*TTS*) nama santri, serta getaran haptic (*haptic feedback*) dinamis di setiap interaksi.
6. **📱 Skalabilitas Multi-Device (HP & Tablet)**
   * Tata letak responsif menggunakan batas grid elastis yang tampak sempurna dan proporsional baik pada smartphone ustadz maupun tablet operasional pesantren.

---

## 🚀 Cara Menjalankan (Pengembangan)

1. **Persiapan Awal**:
   * Pastikan Anda telah menginstal **Flutter SDK** versi `>=3.0.0`.
   * Aktifkan USB Debugging di HP Android Anda atau jalankan Emulator.

2. **Sinkronisasi Library**:
   ```bash
   flutter pub get
   ```

3. **Menjalankan Aplikasi**:
   ```bash
   flutter run
   ```

---

## 📁 Struktur Berkas Utama

* 📂 **`lib/screens/`**
  * 📄 `login_screen.dart` - Gerbang masuk dengan verifikasi kode akses `alhamidku123` dan logo glowing.
  * 📄 `home_screen.dart` - Dashboard menu utama dengan kartu panoramic Al-Hamid dan akses layanan cepat.
  * 📄 `scan_screen.dart` - Halaman scan biometrik, liveness detection, switch kamera, dan pop-up sukses raksasa.
  * 📄 `recap_screen.dart` - Log jurnal absensi santri hari ini yang disinkronkan secara real-time.
* 📂 **`lib/services/`**
  * 📄 `api_service.dart` - Penghubung REST API ke server backend.
  * 📄 `db_helper.dart` - Penyimpanan lokal cache database.
* 📂 **`assets/`**
  * 📂 `images/` - Aset logo resmi pesantren (`logo.png`).
  * 📂 `models/` - Model kecerdasan buatan TensorFlow Lite (`mobile_face_net.tflite`).

---

## ⚙️ Panduan Rilis Produksi & Instalasi HP Ustadz

Untuk langkah-langkah detail membangun berkas rilis APK, pengaturan server VPS, cara pemasangan langsung di HP ustadz, dan materi sosialisasi lapangan, silakan rujuk berkas panduan komprehensif kami:

👉 **[PANDUAN DEPLOYMENT PRODUKSI APLIKASI](file:///C:/Users/Ponpes%20Al-Hamid/.gemini/antigravity/brain/0ca997e2-1eb5-488e-86d8-748ef420dc0d/production_deployment_guide.md)**

---

*“Mewujudkan kemandirian teknologi dan digitalisasi terpadu Pondok Pesantren Al-Hamid Cintamulya menuju masa depan yang cerdas dan kompetitif.”* 🏆🕌
