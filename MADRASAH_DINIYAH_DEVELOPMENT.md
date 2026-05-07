# Dokumentasi Pengembangan Modul Madrasah Diniyah

Dokumen ini merangkum seluruh perubahan, peningkatan, dan logika teknis yang telah diimplementasikan pada modul Madrasah Diniyah di aplikasi Manajemen Administrasi Al-Hamid.

## 1. Restrukturisasi Navigasi & Sidebar

Menu Madrasah Diniyah telah disusun ulang untuk memberikan alur kerja yang lebih logis bagi admin dan pengajar.

*   **Pemindahan Menu**: Sub-menu `Data Kelas` dipindahkan dari menu Pesantren ke menu Madrasah Diniyah.
*   **Hierarki Baru**:
    1.  **Data Kelas**: Manajemen rincian kelas diniyah.
    2.  **Data Guru**: Manajemen data ustadz/ustadzah.
    3.  **Pengaturan & Jadwal**: Konfigurasi kriteria nilai dan penugasan mata pelajaran ke tingkatan kelas.
    4.  **Input Penilaian**: Halaman utama untuk memasukkan nilai harian/ujian.
    5.  **Rekap & Rapot**: Halaman rekapitulasi nilai per kelas dan pencetakan rapor.

## 2. Peningkatan UI/UX (Halaman Manajemen Nilai)

Fokus utama adalah memudahkan navigasi filter yang sebelumnya menggunakan banyak dropdown yang memenuhi layar.

*   **Sistem Card Selection**: Pemilihan Tingkatan dan Mata Pelajaran kini menggunakan komponen Card interaktif yang lebih visual dan intuitif.
*   **Collapsible Mapel Groups**: Mata pelajaran dikelompokkan ke dalam 3 kategori utama menggunakan komponen `Collapse` (Ant Design) untuk menghemat ruang:
    *   **Ujian Semester**: Mata pelajaran reguler/harian.
    *   **Muhafadzoh Mini**: Hafalan rutin (Mini 1-4).
    *   **Ujian Khusus**: Muhafadzoh Akbar, Qiroatul Kitab, dan Taftisyul Kutub.
*   **State Persistence**: Status buka/tutup grup (Collapse) tetap dipertahankan saat pengguna berpindah rincian kelas, sehingga pengguna tidak perlu membuka ulang grup yang sama berkali-kali.

## 3. Logika Data & Pemetaan Khusus

Beberapa penyesuaian teknis dilakukan untuk menangani struktur kelas dan mata pelajaran yang unik.

*   **Virtual Class SP (Sifir Persiapan)**: Kelas dengan nama "SP" secara otomatis dipetakan ke `tingkat 99` secara virtual. Hal ini memisahkan Kelas SP dari Tingkat 1 agar tidak bercampur, namun tetap dalam satu modul navigasi.
*   **Standarisasi Tipe Mata Pelajaran**: Sistem kini menggunakan tipe (`jenis`) yang eksplisit di database untuk akurasi pendeteksian:
    *   **Reguler**: Khusus mata pelajaran Ujian Semester.
    *   **Muhafadzoh**: Untuk Muhafadzoh Akbar dan Mini.
    *   **Qiroah**: Untuk Qiroatul Kitab.
    *   **Taftisy**: Untuk Taftisyul Kutub.
    Hal ini menggantikan sistem pencarian kata kunci yang sebelumnya digunakan, sehingga performa dan akurasi data lebih terjamin.

## 4. Sistem Penilaian (Input & Rekap)

Logika penilaian telah disesuaikan dengan standar akademik Madrasah Diniyah.

### A. Input Penilaian
*   **Mata Pelajaran Reguler & Qiroat**: Menggunakan skala angka **0 - 100**.
*   **Muhafadzoh Akbar & Mini**:
    *   Mendukung skala angka hingga **0 - 2000**.
    *   **Auto-Predikat**: Saat angka dimasukkan, sistem secara otomatis menghitung dan menampilkan Predikat (Mumtaz, Jayyid, Mutawassith, Rodi') di kolom Predikat.
    *   Mendukung mode **Capaian (Dropdown)** jika konfigurasi kriteria diatur menggunakan Teks/Bab.
*   **Taftisyul Kutub**: Menggunakan pilihan status **Tam (Lengkap)** atau **Naqish (Belum Lengkap)**.
*   **Auto-Save Robustness**: Implementasi penyimpanan otomatis (auto-save) yang kini mencakup data predikat dan capaian secara bersamaan untuk mencegah kehilangan data saat halaman dimuat ulang.

### C. Konfigurasi Kriteria
*   **Dua Mode Input**: Mendukung mode **Angka** (skala nilai) dan mode **Teks** (daftar bab/capaian).
*   **Styling Kondisional**: 
    *   **Tingkat 2 & SP**: Menggunakan font khusus (Arabic) pada daftar capaian untuk mendukung penulisan materi kitab.
    *   **Tingkat Sifir & Lainnya**: Menggunakan font standar untuk kemudahan pembacaan materi non-Arab.
*   **Fleksibilitas Konfigurasi**: Tab pengaturan kini mendukung konfigurasi untuk Muhafadzoh, Qiroah, dan Taftisy dalam satu tempat.

### B. Rekap Nilai
*   **Visibilitas Kolom**: Subjek khusus (Akbar, Mini, Qiroat, Taftisy) kini selalu muncul sebagai kolom di tabel Rekap untuk memudahkan pemantauan.
*   **Format Tampilan**:
    *   **Muhafadzoh**: Menampilkan **Predikat** (bukan angka mentah) agar lebih informatif.
    *   **Taftisyul Kutub**: Menampilkan status **Tam/Naqish**.
    *   **Reguler/Qiroat**: Menampilkan nilai angka.

## 5. Ringkasan Teknis (Developer Notes)

*   **File Utama**: `ManajemenNilai.jsx` & `ManajemenNilai.scss`.
*   **Komponen Kunci**: `antd/Card`, `antd/Collapse`, `antd/InputNumber`, `antd/Select`.
*   **Service**: `nilaiService.js` (sinkronisasi antara frontend dan backend untuk kriteria dan rekap).
*   **Optimasi**: Penggunaan `useMemo` untuk kalkulasi kategori mapel dan `useEffect` yang terarah untuk meminimalisir re-render saat pemilihan filter.
*   **Error Handling**: Sistem pelaporan error database yang lebih transparan, memberikan detail teknis jika terjadi kegagalan penyimpanan untuk mempermudah debugging.
*   **Data Integrity**: Penggunaan `JSON.stringify` pada kolom konfigurasi JSONB untuk memastikan kompatibilitas data tingkat tinggi antara Node.js dan PostgreSQL.

---
*Dokumentasi ini dibuat sebagai referensi untuk pengembangan tahap selanjutnya, khususnya pada bagian pembenahan Konsep Rapor.*
