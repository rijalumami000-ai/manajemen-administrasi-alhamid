# 📋 Alumni Upgrade Plan - Implementasi Fitur Baru

## ✅ Masalah #4 - SUDAH DIPERBAIKI!

### Penyebab Data Hilang:
File `sql/init.sql` memiliki perintah `DROP TABLE IF EXISTS` yang **menghapus semua tabel** setiap kali server restart!

### Solusi:
✅ Semua perintah `DROP TABLE` sudah di-comment di `sql/init.sql`

**PENTING:** Sekarang data Anda **AMAN** dan tidak akan hilang lagi saat restart server!

---

## 🔄 Restart Server untuk Menerapkan Perubahan

```bash
# Stop server (Ctrl + C di terminal)
# Lalu start lagi:
npm start
```

**Catatan:** Data yang sudah hilang tidak bisa dikembalikan. Anda perlu input ulang data santri, kelas, kamar, guru, dll.

---

## 📝 Fitur yang Akan Diimplementasikan

### 1. ✅ Sidebar Menu di Halaman Alumni
**Status:** Perlu implementasi

**Yang Perlu Dilakukan:**
- Tambahkan struktur sidebar seperti di index.html
- Tambahkan hamburger menu untuk mobile
- Link navigasi ke halaman lain

### 2. 🔄 Fitur Migrasi Santri ke Alumni
**Status:** Perlu implementasi

**Fitur:**
- Search dropdown untuk memilih santri
- Auto-fill data dari santri
- Migrasi data: santri → alumni
- Preserve history: asrama, kelas, prestasi, pelanggaran

**API Baru yang Diperlukan:**
```javascript
// GET /api/santri/active - Ambil santri aktif untuk dropdown
// POST /api/alumni/migrate/:santriId - Migrasi santri ke alumni
```

### 3. 📊 Detail Alumni dengan Riwayat
**Status:** Perlu implementasi

**Fitur:**
- Modal detail per alumni
- Riwayat asrama
- Riwayat kelas diniyah & sekolah
- Daftar prestasi
- Daftar pelanggaran

**Perubahan Database:**
Perlu tabel history untuk tracking perubahan kelas dan asrama.

### 4. ✅ Pencegahan Data Hilang
**Status:** SUDAH DIPERBAIKI!

---

## 🎯 Prioritas Implementasi

### URGENT (Sekarang):
1. ✅ **Fix data hilang** - SELESAI!
2. **Restart server** - Lakukan sekarang
3. **Input ulang data** - Santri, kelas, kamar, guru, dll

### HIGH (Selanjutnya):
1. **Sidebar menu** di halaman alumni
2. **Fitur migrasi** santri ke alumni

### MEDIUM (Setelah itu):
1. **Detail alumni** dengan riwayat
2. **History tracking** untuk kelas & asrama

---

## 💾 Backup Data (PENTING!)

Sebelum melanjutkan, backup database Anda:

```bash
# Backup database
pg_dump -U postgres sekolah_info > backup_$(date +%Y%m%d_%H%M%S).sql

# Atau di Windows PowerShell:
pg_dump -U postgres sekolah_info > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

---

## 🔧 Langkah Implementasi Detail

### Langkah 1: Restart Server (SEKARANG!)

```bash
# Di terminal server, tekan Ctrl + C
# Lalu:
npm start
```

### Langkah 2: Verifikasi Data Tidak Hilang

```bash
# Tambah data test
# Restart server
# Cek apakah data masih ada
```

### Langkah 3: Input Ulang Data yang Hilang

Karena data sebelumnya sudah terhapus, Anda perlu input ulang:

1. **Kelas** (Diniyah & Sekolah)
2. **Kamar** (Asrama)
3. **Mata Pelajaran**
4. **Jabatan**
5. **Guru**
6. **Santri**
7. **Pelanggaran & Prestasi**

### Langkah 4: Implementasi Sidebar (Selanjutnya)

File yang perlu dimodifikasi:
- `public/alumni.html` - Tambah sidebar structure

### Langkah 5: Implementasi Fitur Migrasi (Selanjutnya)

File yang perlu dimodifikasi:
- `server.js` - Tambah API endpoints
- `public/alumni.html` - Tambah UI migrasi

---

## 📊 Struktur Database untuk History (Rencana)

```sql
-- Tabel untuk tracking history kelas
CREATE TABLE IF NOT EXISTS santri_kelas_history (
  id SERIAL PRIMARY KEY,
  santri_id INTEGER REFERENCES santri(id),
  kelas_diniyah_id INTEGER REFERENCES kelas(id),
  kelas_sekolah_id INTEGER REFERENCES kelas(id),
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel untuk tracking history kamar
CREATE TABLE IF NOT EXISTS santri_kamar_history (
  id SERIAL PRIMARY KEY,
  santri_id INTEGER REFERENCES santri(id),
  kamar_id INTEGER REFERENCES kamar(id),
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modifikasi tabel alumni untuk menyimpan santri_id
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS santri_id INTEGER REFERENCES santri(id);
```

---

## 🎨 UI/UX Improvements

### Halaman Alumni Baru:

1. **Sidebar Navigation**
   - Dashboard
   - Data Santri
   - Data Kelas
   - Data Kamar
   - Data Guru
   - Pelanggaran & Prestasi
   - **Data Alumni** (active)

2. **Dua Mode Tambah Alumni:**
   - **Mode 1:** Migrasi dari Santri (dengan search dropdown)
   - **Mode 2:** Input Manual (form biasa)

3. **Alumni Card dengan Detail Button:**
   - Klik "Detail" → Modal dengan riwayat lengkap
   - Tab: Info Dasar, Riwayat Kelas, Riwayat Asrama, Prestasi, Pelanggaran

---

## 🚀 Quick Start (Setelah Restart)

1. **Restart server:**
   ```bash
   npm start
   ```

2. **Verifikasi data aman:**
   - Tambah 1 santri test
   - Restart server
   - Cek apakah santri masih ada

3. **Input data:**
   - Mulai dari Kelas & Kamar
   - Lalu Mata Pelajaran & Jabatan
   - Kemudian Guru
   - Terakhir Santri

4. **Test alumni:**
   - Buka http://localhost:3000/alumni.html
   - Tambah alumni manual
   - Restart server
   - Cek apakah alumni masih ada

---

## ❓ Pertanyaan untuk Anda

1. **Apakah Anda ingin saya implementasikan semua fitur sekarang?**
   - Sidebar menu
   - Fitur migrasi santri
   - Detail alumni dengan riwayat

2. **Apakah Anda punya backup data sebelumnya?**
   - Jika ya, kita bisa restore

3. **Apakah Anda ingin history tracking untuk kelas & asrama?**
   - Ini akan memerlukan tabel baru

4. **Prioritas mana yang paling penting?**
   - Sidebar dulu?
   - Atau fitur migrasi dulu?

---

## 📞 Next Steps

**Sekarang:**
1. ✅ Restart server
2. ✅ Verifikasi data tidak hilang lagi
3. ✅ Input ulang data yang diperlukan

**Selanjutnya (tunggu konfirmasi Anda):**
1. Implementasi sidebar
2. Implementasi fitur migrasi
3. Implementasi detail dengan riwayat

---

**PENTING:** Jangan lupa backup database secara berkala!

```bash
# Setup auto backup (opsional)
# Buat script backup harian
```

