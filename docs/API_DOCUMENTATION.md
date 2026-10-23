# 🔌 Dokumentasi REST API Lengkap (API Contracts)
### Pondok Pesantren Al-Hamid (Sekolah-Info)

Dokumen ini memuat inventaris lengkap seluruh endpoint REST API, parameter query, struktur payload request, dan response JSON baku yang disediakan oleh backend **Sekolah-Info**.

---

## 📌 Konvensi Umum API

### 1. Base URL
- **Lokal**: `http://localhost:3000/api`
- **Produksi**: `https://[domain-pesantren.com]/api`

### 2. Header Standar
Kecuali pada endpoint publik, setiap request wajib menyertakan token JWT pada header otorisasi:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
```

### 3. Struktur Baku Response JSON
Backend mengembalikan struktur JSON konsisten untuk seluruh endpoint:

#### Respons Sukses:
```json
{
  "success": true,
  "data": { ... } | [ ... ],
  "message": "Operasi berhasil diselesaikan"
}
```

#### Respons Paginasi:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 350,
    "totalPages": 14
  }
}
```

#### Respons Error:
```json
{
  "success": false,
  "error": "Pesan deskripsi kesalahan",
  "details": [ ... ]
}
```

---

## 🔐 1. Modul Autentikasi & Pengguna

### A. Autentikasi (`/api/auth`)
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `POST` | `/api/auth/login` | Publik | Otentikasi username & password, mengembalikan token JWT dan menyetel refresh cookie. |
| `POST` | `/api/auth/logout` | Terautentikasi | Menghapus refresh cookie dan menonaktifkan sesi aktif pengguna. |
| `POST` | `/api/auth/refresh` | Publik | Memperbarui access token baru menggunakan refresh token cookie. |
| `GET` | `/api/auth/me` | Terautentikasi | Mengambil profil user yang sedang aktif. |

#### Payload `POST /api/auth/login`:
```json
{
  "username": "admin_pesantren",
  "password": "password_rahasia"
}
```

### B. Profil Pengguna (`/api/profile`)
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/profile` | Terautentikasi | Mengambil detail profil user yang sedang login. |
| `PUT` | `/api/profile` | Terautentikasi | Memperbarui biodata profil dan kontak. |
| `PUT` | `/api/profile/password` | Terautentikasi | Mengubah password akun aktif. |

### C. Manajemen Pengguna (`/api/users`)
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/users` | Admin | Daftar seluruh akun pengguna terdaftar. |
| `POST` | `/api/users` | Admin | Mendaftarkan pengguna baru dengan peran spesifik. |
| `PUT` | `/api/users/:id` | Admin | Memperbarui data pengguna atau hak akses. |
| `DELETE` | `/api/users/:id` | Admin | Menghapus akun pengguna dari sistem. |
| `PUT` | `/api/users/:id/reset-password` | Admin | Mereset password akun pengguna terpilih. |

---

## 🎓 2. Master Data Akademik & Kesiswaan

### A. Data Santri (`/api/santri`)
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/santri` | Terautentikasi | Daftar santri dengan filter kelas, kamar, status, dan pencarian nama/NISN. |
| `GET` | `/api/santri/:id` | Terautentikasi | Detail lengkap biodata santri dan riwayat akademik. |
| `POST` | `/api/santri` | Admin / Staff | Mendaftarkan santri baru. |
| `PUT` | `/api/santri/:id` | Admin / Staff | Memperbarui biodata santri. |
| `DELETE` | `/api/santri/:id` | Admin | Menghapus data santri. |
| `POST` | `/api/santri/:id/foto` | Admin / Staff | Mengunggah foto profil santri (multipart/form-data). |
| `POST` | `/api/santri/bulk-import` | Admin | Impor massal data santri melalui file Excel (`.xlsx`). |
| `GET` | `/api/santri/export/excel` | Admin / Guru | Ekspor seluruh data santri ke format Excel. |

### B. Data Dewan Asatidz / Guru (`/api/guru`)
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/guru` | Terautentikasi | Daftar ustadz/ustadzah beserta jabatan dan tugas pengajaran. |
| `GET` | `/api/guru/:id` | Terautentikasi | Detail profil ustadz dan riwayat mengajar. |
| `POST` | `/api/guru` | Admin | Menambah data ustadz baru. |
| `PUT` | `/api/guru/:id` | Admin | Memperbarui informasi dewan ustadz. |
| `DELETE` | `/api/guru/:id` | Admin | Menghapus ustadz dari master data. |
| `POST` | `/api/guru/:id/foto` | Admin | Mengunggah foto profil ustadz. |
| `POST` | `/api/guru/:id/ttd` | Admin | Mengunggah tanda tangan digital ustadz untuk rapor. |

### C. Alumni Pesantren (`/api/alumni`)
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/alumni` | Terautentikasi | Daftar alumni dengan filter tahun kelulusan dan profesi/kampus. |
| `GET` | `/api/alumni/:id` | Terautentikasi | Detail profil alumni dan riwayat pengabdian. |
| `POST` | `/api/alumni` | Admin / Staff | Mendaftarkan data alumni baru. |
| `PUT` | `/api/alumni/:id` | Admin / Staff | Memperbarui data alumni. |
| `DELETE` | `/api/alumni/:id` | Admin | Menghapus data alumni. |

### D. Kelas, Kamar & Tahun Ajaran
| Endpoint | Method | Deskripsi |
|---|:---:|---|
| `/api/kelas` | `GET`, `POST`, `PUT`, `DELETE` | Master data kelas berjenjang (*Ula, Wustho, Ulya*). |
| `/api/kamar` | `GET`, `POST`, `PUT`, `DELETE` | Master data kamar asrama santri dan kapasitas hunian. |
| `/api/tahun-ajaran` | `GET`, `POST`, `PUT` | Pengaturan tahun ajaran aktif dan status semester. |
| `/api/mata-pelajaran` | `GET`, `POST`, `PUT`, `DELETE` | Master kurikulum mata pelajaran diniyah & formal. |
| `/api/jabatan` | `GET`, `POST`, `PUT`, `DELETE` | Master struktur jabatan kepengurusan dewan asatidz. |
| `/api/jadwal-pelajaran` | `GET`, `POST`, `PUT`, `DELETE` | Penjadwalan mingguan jam mengajar per kelas & guru. |
| `/api/buku-induk` | `GET`, `POST`, `PUT` | Pengelolaan data buku induk digital santri dan nomor stambuk. |

---

## 📝 3. Penilaian, Ujian & Rapor

### A. Manajemen Nilai (`/api/nilai`)
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/nilai` | Guru / Admin | Mengambil daftar nilai santri per kelas, mapel, dan semester. |
| `POST` | `/api/nilai/batch` | Guru / Admin | Simpan/update nilai santri secara massal. |
| `GET` | `/api/nilai/rekap` | Guru / Admin | Rekapitulasi nilai akumulatif per santri untuk rapor. |
| `POST` | `/api/nilai/batch-omr` | Admin / Panitia | Menerima hasil pemindaian scanner OMR untuk dimasukkan ke database. |

### B. Lembar & Kartu Ujian
| Endpoint | Method | Deskripsi |
|---|:---:|---|
| `/api/peserta-ujian` | `GET`, `POST` | Penetapan nomor peserta ujian dan verifikasi kelayakan ujian. |
| `/api/lembar-ujian` | `GET`, `POST`, `PUT` | Template lembar jawaban komputer (LJK) dan kunci jawaban pilihan ganda. |
| `/api/materi-sidang` | `GET`, `POST`, `DELETE` | Unggah dan kelola materi sidang komprehensif kelulusan santri. |

---

## 🕌 4. Presensi Biometrik & Setoran Hafalan

### A. Presensi Sholat Berjamaah (`/api/absensi-sholat`)
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/absensi-sholat/today` | Guru / Admin | Daftar status kehadiran sholat santri hari ini (Subuh s/d Isya). |
| `POST` | `/api/absensi-sholat/scan` | Terautentikasi | Catat presensi santri via pengenalan wajah biometrik / QR scan. |
| `POST` | `/api/absensi-sholat/manual` | Guru / Staff | Input manual kehadiran santri (Hadir, Sakit, Izin, Alfa). |
| `GET` | `/api/absensi-sholat/rekap` | Guru / Admin | Rekapitulasi persentase kehadiran sholat santri bulanan. |

### B. Setoran Hafalan Qur'an & Nadzom (`/api/setoran-hafalan`)
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/setoran-hafalan` | Guru / Admin | Riwayat setoran hafalan santri (Juz/Surat/Bait Nadzom). |
| `POST` | `/api/setoran-hafalan` | Guru | Mencatat capaian setoran hafalan baru santri beserta predikat mutqin. |
| `GET` | `/api/setoran-hafalan/rekap-mini` | Guru / Admin | Ringkasan pencapaian muhafadzoh santri per halaqoh/kelas. |

---

## 💰 5. Modul Keuangan Pesantren (`/api/keuangan`)

### A. Tarif & Setup Keuangan (`/api/keuangan/setup`)
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/keuangan/setup/jenis-iuran` | Bendahara | Daftar jenis iuran (SPP Makan, SPP Madin, Infaq Bangunan, Event). |
| `POST` | `/api/keuangan/setup/jenis-iuran` | Bendahara | Menambah jenis iuran baru. |
| `GET` | `/api/keuangan/setup/tarif` | Bendahara | Daftar tarif iuran berdasarkan tahun ajaran dan tingkat kelas. |
| `POST` | `/api/keuangan/setup/tarif` | Bendahara | Menetapkan tarif iuran santri. |

### B. Tagihan & Pembayaran Santri
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/keuangan/tagihan` | Bendahara | Daftar tagihan aktif santri dengan filter status lunas/belum lunas. |
| `POST` | `/api/keuangan/tagihan/generate` | Bendahara | Otomatisasi generate tagihan bulanan seluruh santri aktif. |
| `POST` | `/api/keuangan/pembayaran` | Bendahara | Mencatat pembayaran iuran santri dan menerbitkan ID kwitansi. |
| `GET` | `/api/keuangan/pembayaran/kwitansi/:id` | Bendahara | Mengambil data kwitansi pembayaran lengkap untuk dicetak. |

### C. Buku Kas & Laporan Finansial
| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/keuangan/kas` | Bendahara | Buku kas umum (arus kas masuk dan keluar). |
| `POST` | `/api/keuangan/kas-keluar` | Bendahara | Mencatat pengeluaran operasional pesantren beserta bukti nota. |
| `GET` | `/api/keuangan/laporan/spp` | Bendahara | Laporan rekapitulasi penerimaan SPP bulanan. |
| `GET` | `/api/keuangan/laporan/daftar-ulang`| Bendahara | Laporan pembayaran daftar ulang santri baru & lama. |
| `GET` | `/api/keuangan/laporan/event` | Bendahara | Laporan penerimaan event insidental (haflah, kitab, seragam). |
| `GET` | `/api/keuangan/audit` | Bendahara / Admin| Log audit jejak transaksi dan modifikasi data keuangan. |

---

## 📱 6. Integrasi Mobile Alhamid One (`/api/mymustahiq`)

| Method | Endpoint | Hak Akses | Deskripsi |
|---|---|:---:|---|
| `POST` | `/api/mymustahiq/login` | Guru / Wali | Otentikasi aplikasi mobile via kode akses guru atau NIK wali santri. |
| `GET` | `/api/mymustahiq/dashboard` | Guru / Wali | Ringkasan dasbor mobile: jadwal hari ini, santri asuh, notifikasi penting. |
| `GET` | `/api/mymustahiq/santri/:id` | Guru / Wali | Tampilan biodata santri, absensi sholat, rekap nilai, dan tagihan. |
| `GET` | `/api/mymustahiq/kelasku` | Guru | Akses data santri kelas binaan untuk input nilai dan rapor dari HP. |
| `GET` | `/api/mymustahiq/chat/rooms` | Guru / Wali | Daftar ruang obrolan internal asatidz dan wali santri. |
| `POST` | `/api/mymustahiq/chat/send` | Guru / Wali | Mengirim pesan obrolan internal. |
| `GET` | `/api/app-content/announcements`| Publik / Wali | Pengumuman resmi pondok pesantren Al-Hamid. |
| `POST` | `/api/notifications/fcm-token` | Guru / Wali | Mendaftarkan token Firebase Cloud Messaging perangkat HP. |

---

## 🏢 7. Kelembagaan, Fasilitas & Event

| Endpoint | Method | Deskripsi |
|---|:---:|---|
| `/api/struktur` | `GET`, `POST`, `PUT` | Bagan hierarki kepengurusan pesantren dan dewan masyaikh. |
| `/api/inventaris` | `GET`, `POST`, `PUT`, `DELETE` | Pendataan aset inventaris pesantren, lokasi ruang, dan kondisi fisik. |
| `/api/romadhon` | `GET`, `POST`, `PUT` | Manajemen jadwal kegiatan khusus bulan suci Ramadhan dan khataman kitab. |
| `/api/summary` | `GET` | Ringkasan statistik cepat: total santri, guru, kelas, kamar, dan rasio kehadiran. |

---

*Seluruh rute API di atas dilindungi oleh aturan Zero-Breakage Policy. Dilarang memutus atau mengubah struktur response JSON yang aktif dikonsumsi oleh aplikasi mobile Flutter dan Desktop Scanner.* 🛡️
