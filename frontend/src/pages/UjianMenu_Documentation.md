# Dokumentasi Parkir: Fitur Input Nilai Ujian di Menu Ujian

## Status
**DIPARKIR** (Ditunda untuk perbaikan lebih lanjut)

## Tujuan Awal
Membuat kartu "Input Nilai" di menu bawah (Ujian) yang ketika ditekan langsung membuka halaman input nilai untuk **Ujian Semester** (mata pelajaran reguler), dengan ketentuan:
1.  Hanya menampilkan tab "Input Nilai" (menyembunyikan Absensi, Kepribadian, Catatan Wali Kelas).
2.  Langsung menampilkan daftar mata pelajaran tanpa perlu membuka dropdown atau memilih kategori secara manual.
3.  Mempermudah admin dalam menginput nilai ujian semester di perangkat mobile.

## Percobaan yang Telah Dilakukan
1.  **Menggunakan Komponen `ManajemenNilai.jsx` dengan `mode="input-ujian"`**:
    *   Mencoba memfilter tab agar hanya menampilkan tab 'input'.
    *   Mencoba mematikan `mobileFocusMode` (Prioritas) secara otomatis untuk meniru kelakuan tombol "Lainnya".
2.  **Otomatisasi Pemilihan Kelas**:
    *   Mencoba mendeteksi kelas dan otomatis memilih Kelas 1 agar data langsung muncul.
3.  **Pendekatan Langsung (Direct Mode)**:
    *   Mencoba memotong logika kategori dan langsung merender mata pelajaran reguler jika berada dalam mode `input-ujian`.

## Kendala / Alasan Diparkir
Meskipun berbagai logika telah dicoba, tampilan di layar pengguna (terutama pada perangkat mobile) masih belum berhasil menampilkan daftar mata pelajaran secara otomatis sesuai dengan screenshot yang diharapkan. Hal ini kemungkinan disebabkan oleh:
*   Kompleksitas state management di dalam `ManajemenNilai.jsx` yang berukuran sangat besar (1700+ baris).
*   Timing pemuatan data asinkron (*API calls*) yang berbenturan dengan logika otomatisasi pemilihan level/kelas.
*   Penyimpanan state di `localStorage` yang terkadang memaksa halaman membuka kategori yang salah (seperti Ujian Khusus).

## Rekomendasi Solusi di Masa Depan
Jika fitur ini ingin dilanjutkan, disarankan untuk:
1.  **Membuat File Komponen Baru**: Jangan menyatukannya di `ManajemenNilai.jsx`. Buatlah file khusus seperti `InputNilaiUjian.jsx` yang benar-benar bersih dari logika "Absensi", "Kepribadian", dan "Ujian Khusus". Ini akan jauh lebih mudah dikontrol dan tidak akan merusak fitur yang sudah berjalan di menu Input utama.
2.  **Menyederhanakan Alur**: Buat alur yang benar-benar linier: Pilih Tingkat -> Pilih Kelas -> Muncul Mapel -> Input Nilai. Tanpa embel-embel filter prioritas atau collapse yang membingungkan.
