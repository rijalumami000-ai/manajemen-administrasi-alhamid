# 💰 Submodul Keuangan Pesantren (Financial Management Service)
### Pondok Pesantren Al-Hamid Cintamulya
> *Sub-service TypeScript independen untuk pembukuan kas syariah, penagihan SPP bulanan, daftar ulang, event haflah, dan cetak kwitansi resmi.*

---

## 🌟 Ikhtisar Submodul

Modul Keuangan (`keuangan/`) dirancang dengan arsitektur terisolasi (*semi-microservice/modular sub-package*) di dalam monorepo **Sekolah-Info**. Pemisahan ini memastikan:
1. **Integritas Transaksi Finansial**: Logika perhitungan keuangan terbebas dari dependensi modul akademik umum.
2. **Kompilasi TypeScript Mandiri**: Memiliki `tsconfig.json` dan `package.json` tersendiri, dikompilasi ke direktori `keuangan/dist/` sebelum di-mount ke server utama Express.
3. **Audit Trail Ketat**: Seluruh tindakan penambahan, pengubahan, atau penghapusan transaksi tercatat secara otomatis pada tabel `audit_log_keuangan`.

---

## 📦 Skema & Modul Finansial

### 1. Master Pos Iuran & Tarif (`setupRoutes.ts`)
- **Jenis Iuran**:
  - `spp_bulanan`: SPP Makan dan SPP Madin.
  - `daftar_ulang_baru`: Infaq Bangunan, Lemari, Kasur, KTS, Sampul Rapor, dan Cicilan Haflah.
  - `daftar_ulang_lama`: Infaq Bangunan dan Cicilan Haflah tahunan.
  - `event`: Pelunasan Haflah, Seragam, Kitab Ramadhan, dan insidental lainnya.
- **Matriks Tarif**: Penentuan besaran nominal tagihan per pos berdasarkan tahun ajaran dan tingkat kelas santri.

### 2. Penagihan & Pembayaran Santri (`tagihanRoutes.ts` & `pembayaranRoutes.ts`)
- **Generate Tagihan Massal**: Pembuatan otomatis tagihan santri per periode bulan/tahun ajaran aktif.
- **Penerimaan Pembayaran**: Pencatatan kas masuk dari wali santri dengan status lunas atau cicilan bertahap.
- **Penerbitan Kwitansi Berseri**: Pembuatan bukti bayar resmi bernomor seri unik dan QR code otentikasi.

### 3. Buku Kas Umum & Kas Keluar (`kasKeluarRoutes.ts`)
- Pencatatan seluruh beban pengeluaran operasional pesantren (dapur, listrik, honorarium asatidz, renovasi fisik).
- Unggah dan lampiran bukti nota/struk belanja digital.

### 4. Pelaporan Keuangan (`laporanRoutes.ts`)
- Laporan rekapitulasi penerimaan SPP per kelas dan per bulan.
- Laporan pelunasan daftar ulang santri baru & lama.
- Laporan arus kas harian, bulanan, dan tahunan.

### 5. Audit Log Keuangan (`auditRoutes.ts`)
- Jejak audit transparan mengenai waktu transaksi, nominal yang diubah, dan identitas petugas kasir/bendahara penanggung jawab.

---

## 📁 Struktur Direktori

```
keuangan/
├── src/
│   ├── routes/                # Endpoint router Express
│   │   ├── index.ts           # Master register rute keuangan
│   │   ├── setupRoutes.ts     # Pos iuran & matriks tarif
│   │   ├── tagihanRoutes.ts   # Pembuatan tagihan santri
│   │   ├── pembayaranRoutes.ts# Kasir & penerbitan kwitansi
│   │   ├── kasKeluarRoutes.ts # Pengeluaran kas pesantren
│   │   ├── laporanRoutes.ts   # Rekap SPP, daftar ulang & kas
│   │   └── auditRoutes.ts     # Log jejak modifikasi transaksi
│   ├── services/              # Logika kalkulasi matematis & query transaksi
│   ├── middleware/            # Proteksi otorisasi peran Bendahara / Admin
│   ├── types/                 # Definisi tipe & interface TypeScript
│   ├── utils/                 # Format mata uang rupiah & penomoran kwitansi
│   └── db.ts                  # Koneksi pool database PostgreSQL
├── dist/                      # Hasil kompilasi JavaScript (output tsc)
├── tsconfig.json              # Konfigurasi kompilasi TypeScript
├── package.json               # Dependensi submodule
└── README.md                  # Dokumentasi modul
```

---

## ⚡ Perintah Kompilasi & Pemeliharaan

Seluruh skrip dijalankan dari root proyek:

| Perintah | Fungsi |
|---|---|
| `npm run keuangan:build` | Mengompilasi seluruh file `.ts` di folder `keuangan/src/` ke `keuangan/dist/` |
| `npm run keuangan:watch` | Mengaktifkan mode pengawasan (`tsc --watch`) untuk re-kompilasi otomatis saat kode diubah |
| `npm run keuangan:typecheck` | Melakukan verifikasi tipe data (`tsc --noEmit`) tanpa menghasilkan berkas build |

---

## 🔒 Kebijakan Keamanan & Transaksi Database

- Seluruh mutasi kas dan pembayaran wajib dibungkus dalam blok **Database Transaction** (`BEGIN`, `COMMIT`, `ROLLBACK`) untuk mencegah terjadinya selisih saldo pembukuan (*race condition* / kegagalan parsial).
- Penghapusan data transaksi berstatus lunak (*soft delete*) atau memerlukan otorisasi tingkat Administrator untuk menjamin auditabilitas hukum syariah dan negara.

---

*Modul Keuangan Al-Hamid: Transparansi, Akuntabilitas, dan Berkah dalam Tata Kelola Finansial Pesantren.* 🪙📈
