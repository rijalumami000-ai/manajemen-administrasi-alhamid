# Dokumentasi Fitur: Mobile Input Console (Madrasah Diniyah)

Fitur ini dirancang khusus untuk meningkatkan efisiensi input nilai massal menggunakan perangkat mobile (HP). Sistem ini menggantikan input tabel tradisional dengan antarmuka berbasis konsol yang adaptif dan responsif.

## 1. Arsitektur Utama
Fitur ini terletak pada file:
- **Logic**: `frontend/src/pages/ManajemenNilai.jsx`
- **Styling**: `frontend/src/pages/ManajemenNilai.scss`

### Komponen Struktur
- **Mobile Dashboard**: Landing page khusus mobile dengan 3 kartu akses cepat.
- **Sticky Header**: Bagian atas yang tetap diam (fixed) saat di-scroll, berisi status bar, selektor kelas, dan info santri yang sedang dinilai.
- **Scrollable Body**: Area input yang dinamis sesuai jenis kriteria penilaian (Keypad/Pills).
- **Status Bar**: Indikator real-time untuk proses simpan otomatis (Auto-save).

## 2. Fitur Unggulan

### A. Mobile Dashboard & Quick Access (NEW)
Halaman utama saat membuka menu Diniyah di HP menampilkan 3 kartu "Pintasan Makro":
1.  **Muhafadzoh Akbar**: Otomatis set Prioritas -> Cari kelas berisi santri -> Buka **Console**.
2.  **Qiroatul Kitab**: Otomatis set Prioritas -> Cari kelas berisi santri -> Buka **Console (Mode Angka)**.
3.  **Taftisyul Kutub**: Otomatis set Prioritas -> Cari kelas berisi santri -> Buka **Tabel Mobile Biasa**.

### B. Async Smart Seeker (NEW)
Logika pencarian cerdas yang bekerja secara asinkron saat kartu diklik:
- **Scanning Real-time**: Sistem memindai daftar kelas secara berurutan.
- **Validasi Data**: Setiap kelas dicek melalui API untuk memastikan ada daftar santri di dalamnya.
- **Auto-Select**: Memilih kelas pertama yang valid (berisi data) dan otomatis mengunci santri urutan pertama untuk mulai dinilai.

### C. Adaptive Input Mode
Sistem secara otomatis mendeteksi konfigurasi kriteria penilaian:
1.  **Mode Angka (Numeric Keypad)**: 
    - Muncul saat `kriteriaType === 'Angka'`.
    - Menggunakan keypad numerik kustom untuk input nilai (0-2000).
2.  **Mode Teks (Achievement Pills)**: 
    - Muncul saat `kriteriaType === 'Teks'` (Contoh: Kelas 2, SP).
    - Menampilkan tombol-tombol besar berisi capaian Arab dan Predikat.
    - **Smart Auto-Next**: Setelah memilih capaian, sistem otomatis berpindah ke santri berikutnya secara instan.

## 3. Logika & State Management

### State View Mode
- `mobileViewMode`: Berpindah antara `'dashboard'` dan `'input'`.
- `pendingConsoleOpen`: Flag untuk memastikan Console hanya terbuka setelah data santri benar-benar dimuat dari server.

### Auto-Save & Data Integrity
- **Debounced Save**: Data dikirim ke server 1 detik setelah input terakhir.
- **Visual Feedback**: 
    - 🔵 `Sedang Menyimpan...`
    - 🟢 `Data Berhasil Tersimpan!`
    - 🔴 `Gagal Menyimpan`

## 4. Panduan Pemeliharaan (Maintenance)

### Kata Kunci Pencarian Mapel
Jika nama mata pelajaran di database berubah, sesuaikan kata kunci pada fungsi `handleQuickStart`:
- Muhafadzoh: `muhafadzoh`, `hafalan`, `muhafadhah`.
- Qiroatul Kitab: `qiroat`, `baca`.
- Taftisyul Kutub: `taftisy`, `periksa kitab`.

### Styling Variabel
Modifikasi di `ManajemenNilai.scss`:
- `$console-header-height`: Mengatur tinggi area fixed.
- `.score-preview.text-mode`: Mengatur ukuran font teks Arab di preview.
- `.quick-card`: Mengatur tampilan kartu di Dashboard Mobile.

---
*Terakhir Diperbarui: 6 Mei 2026*
