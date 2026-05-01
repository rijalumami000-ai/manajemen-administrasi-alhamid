# 📚 Alumni Database - Dokumentasi

## Ringkasan

Alumni Database adalah fitur baru dalam Sistem Informasi Pesantren yang memungkinkan pengelolaan data alumni secara terstruktur dan komprehensif. Fitur ini mencakup informasi lengkap alumni mulai dari data pribadi, riwayat pendidikan, hingga informasi pekerjaan saat ini.

## Fitur Utama

### 1. **Manajemen Data Alumni**
- ✅ Tambah data alumni baru
- ✅ Edit data alumni yang sudah ada
- ✅ Hapus data alumni
- ✅ Pencarian alumni berdasarkan nama atau NIS
- ✅ Filter alumni berdasarkan tahun kelulusan

### 2. **Informasi yang Disimpan**

#### Data Pribadi
- NIS (Nomor Induk Santri) - **Wajib**
- NIK (Nomor Induk Kependudukan)
- Nama Lengkap - **Wajib**
- Tempat Lahir
- Tanggal Lahir
- Alamat
- No. HP
- Email

#### Riwayat Pendidikan
- Tahun Masuk
- Tahun Lulus - **Wajib**
- Kelas Terakhir
- Prestasi Utama (selama di pesantren)

#### Informasi Karir
- Pekerjaan
- Instansi/Perusahaan

#### Lainnya
- Keterangan (catatan tambahan)

### 3. **Statistik Alumni**
Dashboard menampilkan:
- Total jumlah alumni
- Tahun kelulusan terbaru
- Jumlah alumni yang sudah bekerja

## Struktur Database

### Tabel: `alumni`

```sql
CREATE TABLE IF NOT EXISTS alumni (
  id SERIAL PRIMARY KEY,
  nis VARCHAR(50) NOT NULL,
  nik VARCHAR(50),
  nama VARCHAR(150) NOT NULL,
  tempat_lahir VARCHAR(120),
  tanggal_lahir DATE,
  tahun_masuk INTEGER,
  tahun_lulus INTEGER NOT NULL,
  kelas_terakhir VARCHAR(100),
  alamat TEXT,
  no_hp VARCHAR(60),
  email VARCHAR(150),
  pekerjaan VARCHAR(150),
  instansi VARCHAR(200),
  prestasi_utama TEXT,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alumni_nama ON alumni(nama);
CREATE INDEX idx_alumni_tahun_lulus ON alumni(tahun_lulus DESC);
CREATE INDEX idx_alumni_nis ON alumni(nis);
```

### Indeks Database
- `idx_alumni_nama`: Mempercepat pencarian berdasarkan nama
- `idx_alumni_tahun_lulus`: Mempercepat sorting dan filter berdasarkan tahun lulus
- `idx_alumni_nis`: Mempercepat pencarian berdasarkan NIS

## API Endpoints

### 1. GET `/api/alumni`
Mengambil semua data alumni, diurutkan berdasarkan tahun lulus (terbaru) dan nama.

**Response:**
```json
[
  {
    "id": 1,
    "nis": "A2020001",
    "nik": "3201234567890123",
    "nama": "Ahmad Fauzi",
    "tempat_lahir": "Jakarta",
    "tanggal_lahir": "2002-05-15",
    "tahun_masuk": 2015,
    "tahun_lulus": 2020,
    "kelas_terakhir": "XII IPA 1",
    "alamat": "Jl. Merdeka No. 123",
    "no_hp": "081234567890",
    "email": "ahmad@email.com",
    "pekerjaan": "Software Engineer",
    "instansi": "PT Tech Indonesia",
    "prestasi_utama": "Juara 1 Lomba Tahfidz",
    "keterangan": "Alumni berprestasi",
    "created_at": "2026-04-30T10:00:00Z"
  }
]
```

### 2. POST `/api/alumni`
Menambah data alumni baru.

**Request Body:**
```json
{
  "nis": "A2020001",
  "nik": "3201234567890123",
  "nama": "Ahmad Fauzi",
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "2002-05-15",
  "tahun_masuk": 2015,
  "tahun_lulus": 2020,
  "kelas_terakhir": "XII IPA 1",
  "alamat": "Jl. Merdeka No. 123",
  "no_hp": "081234567890",
  "email": "ahmad@email.com",
  "pekerjaan": "Software Engineer",
  "instansi": "PT Tech Indonesia",
  "prestasi_utama": "Juara 1 Lomba Tahfidz",
  "keterangan": "Alumni berprestasi"
}
```

**Response (201):**
```json
{
  "id": 1,
  "nis": "A2020001",
  "nama": "Ahmad Fauzi",
  ...
}
```

**Response Error (400):**
```json
{
  "error": "NIS, nama, dan tahun lulus wajib diisi."
}
```

### 3. PUT `/api/alumni/:id`
Memperbarui data alumni berdasarkan ID.

**Request Body:** (sama dengan POST)

**Response (200):**
```json
{
  "id": 1,
  "nis": "A2020001",
  "nama": "Ahmad Fauzi Updated",
  ...
}
```

**Response Error (404):**
```json
{
  "error": "Data alumni tidak ditemukan."
}
```

### 4. DELETE `/api/alumni/:id`
Menghapus data alumni berdasarkan ID.

**Response (200):**
```json
{
  "message": "Data alumni berhasil dihapus."
}
```

**Response Error (404):**
```json
{
  "error": "Data alumni tidak ditemukan."
}
```

### 5. GET `/api/alumni/search`
Mencari alumni berdasarkan nama/NIS atau tahun lulus.

**Query Parameters:**
- `q`: Kata kunci pencarian (nama atau NIS)
- `tahun`: Tahun kelulusan

**Contoh:**
- `/api/alumni/search?q=Ahmad` - Cari alumni dengan nama/NIS mengandung "Ahmad"
- `/api/alumni/search?tahun=2020` - Cari alumni yang lulus tahun 2020
- `/api/alumni/search?q=Ahmad&tahun=2020` - Kombinasi keduanya

**Response:**
```json
[
  {
    "id": 1,
    "nis": "A2020001",
    "nama": "Ahmad Fauzi",
    ...
  }
]
```

## Frontend Interface

### Halaman Alumni (`/alumni.html`)

#### Komponen Utama:

1. **Statistik Dashboard**
   - Total Alumni
   - Tahun Kelulusan Terbaru
   - Jumlah Alumni yang Bekerja

2. **Search Bar**
   - Input pencarian (nama/NIS)
   - Filter tahun kelulusan
   - Tombol reset

3. **Alumni Cards**
   - Menampilkan data alumni dalam format card yang informatif
   - Tombol Edit dan Hapus untuk setiap alumni
   - Informasi ditampilkan secara terstruktur dan mudah dibaca

4. **Modal Form**
   - Form tambah/edit alumni
   - Layout 2 kolom untuk efisiensi ruang
   - Validasi input di frontend dan backend

### Navigasi

Link ke halaman Alumni tersedia di:
- Sidebar menu halaman utama (`index.html`)
- Navbar di halaman alumni

## Cara Menggunakan

### 1. Menambah Alumni Baru

1. Buka halaman Alumni
2. Klik tombol **"+ Tambah Alumni"**
3. Isi form dengan data alumni:
   - **Wajib:** NIS, Nama, Tahun Lulus
   - **Opsional:** Data lainnya
4. Klik **"Simpan"**

### 2. Mencari Alumni

**Berdasarkan Nama/NIS:**
1. Ketik nama atau NIS di search bar
2. Hasil akan muncul secara otomatis

**Berdasarkan Tahun:**
1. Pilih tahun dari dropdown filter
2. Hasil akan ditampilkan sesuai tahun yang dipilih

**Reset Pencarian:**
- Klik tombol **"Reset"** untuk menampilkan semua alumni

### 3. Mengedit Data Alumni

1. Klik tombol **"Edit"** pada card alumni
2. Form akan terbuka dengan data yang sudah terisi
3. Ubah data yang diperlukan
4. Klik **"Simpan"**

### 4. Menghapus Alumni

1. Klik tombol **"Hapus"** pada card alumni
2. Konfirmasi penghapusan
3. Data akan dihapus dari database

## Testing

File test tersedia di `test_alumni_api.js` untuk menguji semua endpoint API.

### Menjalankan Test:

```bash
# Pastikan server berjalan
npm start

# Di terminal lain, jalankan test
node test_alumni_api.js
```

### Test Coverage:

1. ✅ GET /api/alumni (initial - empty)
2. ✅ POST /api/alumni (create new alumni)
3. ✅ GET /api/alumni (after create)
4. ✅ POST /api/alumni (create second alumni)
5. ✅ PUT /api/alumni/:id (update alumni)
6. ✅ GET /api/alumni/search (search by name)
7. ✅ GET /api/alumni/search (search by year)
8. ✅ POST /api/alumni (validation test)
9. ✅ DELETE /api/alumni/:id
10. ✅ GET /api/alumni (verify deletion)

## Validasi Data

### Backend Validation:
- NIS: Wajib diisi
- Nama: Wajib diisi
- Tahun Lulus: Wajib diisi
- Semua field text akan di-normalize (trim whitespace)

### Frontend Validation:
- Required fields ditandai dengan asterisk (*)
- Input type sesuai dengan data (date, number, email, tel)
- Form tidak bisa disubmit jika field wajib kosong

## Keamanan

1. **Input Sanitization:** Semua input text di-normalize menggunakan fungsi `normalizeText()`
2. **SQL Injection Prevention:** Menggunakan parameterized queries
3. **Error Handling:** Error ditangani dengan baik dan mengembalikan pesan yang informatif

## Integrasi dengan Sistem

Alumni Database terintegrasi dengan:
- ✅ Database PostgreSQL yang sama
- ✅ Express.js backend
- ✅ Sistem navigasi utama
- ✅ Styling yang konsisten dengan halaman lain

## File yang Ditambahkan/Dimodifikasi

### File Baru:
1. `public/alumni.html` - Halaman frontend alumni
2. `test_alumni_api.js` - File testing API
3. `ALUMNI_DATABASE_DOCUMENTATION.md` - Dokumentasi ini

### File Dimodifikasi:
1. `sql/init.sql` - Menambah tabel alumni dan indeks
2. `server.js` - Menambah API endpoints alumni
3. `public/index.html` - Menambah link ke halaman alumni

## Fitur Masa Depan (Roadmap)

Beberapa fitur yang bisa dikembangkan:

1. **Export Data**
   - Export ke Excel/CSV
   - Export ke PDF

2. **Import Data**
   - Import dari Excel/CSV
   - Bulk upload alumni

3. **Statistik Lanjutan**
   - Grafik distribusi tahun lulus
   - Grafik jenis pekerjaan
   - Tracking karir alumni

4. **Komunikasi**
   - Kirim email/SMS ke alumni
   - Newsletter alumni

5. **Alumni Portal**
   - Login untuk alumni
   - Update data sendiri
   - Forum alumni

6. **Integrasi dengan Data Santri**
   - Otomatis pindahkan santri ke alumni saat lulus
   - Link data santri dengan data alumni

## Troubleshooting

### Server tidak bisa start
```bash
# Pastikan PostgreSQL berjalan
# Pastikan .env sudah dikonfigurasi dengan benar
# Jalankan:
npm install
npm start
```

### Data tidak muncul
- Cek koneksi database di `.env`
- Pastikan tabel alumni sudah dibuat (jalankan init.sql)
- Cek console browser untuk error

### Error saat menyimpan
- Pastikan field wajib (NIS, Nama, Tahun Lulus) sudah diisi
- Cek format data (tahun harus angka, email harus valid)

## Kontak & Support

Untuk pertanyaan atau masalah terkait Alumni Database, silakan hubungi tim pengembang.

---

**Versi:** 1.0.0  
**Tanggal:** 30 April 2026  
**Dibuat oleh:** Kiro AI Assistant
