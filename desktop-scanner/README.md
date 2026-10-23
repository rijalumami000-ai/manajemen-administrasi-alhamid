# 🖨️ Desktop OMR Scanner — Madrasah Al-Hamid
### Aplikasi Pemindai Lembar Jawaban Komputer (LJK) Ujian Otomatis Berbasis C# .NET WPF

Aplikasi desktop Windows berkecepatan tinggi yang dirancang khusus untuk memindai, menganalisis bulatan pensil, dan mengkalkulasi nilai ujian pilihan ganda santri secara otomatis langsung ke server pusat **Pondok Pesantren Al-Hamid**.

---

## 🌟 Fitur Utama

1. **⚡ Pemindaian Otomatis Berkecepatan Tinggi**:
   - Mendukung integrasi mesin pemindai dokumen otomatis (Automatic Document Feeder / ADF Scanner).
   - Memproses puluhan lembar jawaban ujian per menit.
2. **🔍 Deteksi Barcode & QR Presisi**:
   - Membaca barcode nomor peserta ujian santri dan kode mata pelajaran yang tertera di bagian atas lembar ujian.
3. **🎯 Algoritma Analisis Kerapatan Piksel (Optical Mark Recognition)**:
   - Menghitung densitas pengisian bulatan pensil (opsi A, B, C, D, E) menggunakan ambang batas kontras dinamis (*adaptive thresholding*).
   - Mampu membedakan coretan tipis/arsiran ragu-ragu dari bulatan mantap.
4. **📡 Sinkronisasi Langsung ke Server Backend**:
   - Mengirimkan hasil jawaban dan nilai akhir santri langsung ke endpoint REST API `/api/nilai/batch-omr` tanpa perlu ekspor/impor manual.
5. **🖼️ Verifikasi Visual Real-Time**:
   - Menampilkan pratinjau citra hasil scan di antarmuka aplikasi dengan indikator visual hijau (jawaban benar) dan merah (jawaban salah) untuk memudahkan audit pengawas ujian.

---

## 🛠️ Prasyarat & Lingkungan Pengembangan

- **Sistem Operasi**: Windows 10 / Windows 11 (64-bit)
- **Runtime**: [.NET 8.0 Desktop Runtime](https://dotnet.microsoft.com/download/dotnet/8.0) atau `.NET Framework 4.8`
- **IDE**: Visual Studio 2022 (Community / Professional) atau VS Code dengan ekstensi C# Dev Kit
- **Perangkat Keras Pemindai**: Scanner dokumen berfitur TWAIN / WIA compliant (Epson, Canon, Fujitsu, Brother, dll)

---

## 📁 Struktur Berkas

```
desktop-scanner/
├── AlHamidScanner.csproj      # File konfigurasi proyek .NET C#
├── App.xaml / App.xaml.cs     # Konfigurasi aplikasi WPF & siklus hidup
├── MainWindow.xaml            # Antarmuka pengguna visual (WPF XAML)
├── MainWindow.xaml.cs         # Logika event scanner & preview gambar
├── Models/                    # Model data (HasilScan, LembarUjian, JawabanSantri)
├── Services/                  # Layanan pengolahan citra & klien REST API
├── app_icon.ico               # Ikon resmi aplikasi
├── publish/                   # Direktori berkas executable rilis siap pakai
│   └── AlHamidScanner.exe     # Eksekutor utama aplikasi
└── README.md                  # Dokumentasi teknis aplikasi
```

---

## 🚀 Cara Menjalankan Aplikasi

### Cara 1: Menggunakan Pintasan Instan (Siap Pakai)
Cukup klik dua kali berkas batch di root direktori proyek:
```
Jalankan_Scanner_OMR.bat
```
*Aplikasi `AlHamidScanner.exe` akan langsung terbuka.*

### Cara 2: Menjalankan dari Kode Sumber (Developer)
```bash
cd desktop-scanner
dotnet restore
dotnet build
dotnet run
```

---

## ⚙️ Alur Kerja Pemindaian Ujian (SOP Panitia)

1. **Persiapan Kunci Jawaban**:
   - Pastikan kunci jawaban ujian untuk mata pelajaran terkait telah diisi melalui web di menu **Lembar Ujian** (`/lembar-ujian`).
2. **Pemuatan Lembar Jawaban**:
   - Rapikan tumpukan kertas LJK santri dan letakkan di tray pengumpan scanner (ADF).
3. **Mulai Pemindaian**:
   - Buka `AlHamidScanner.exe`.
   - Pilih perangkat scanner dan klik **Mulai Scan**.
4. **Validasi & Pengiriman**:
   - Sistem akan memproses lembar demi lembar, mencocokkan barcode peserta, dan menghitung skor.
   - Klik **Sinkronkan Nilai ke Database** untuk memasukkan nilai seluruh santri ke buku nilai rapor.

---

*Scanner OMR Al-Hamid: Akurasi Tinggi, Menghemat Waktu Koreksi, dan Mewujudkan Ujian Pesantren yang Akuntabel.* 🖨️📊
