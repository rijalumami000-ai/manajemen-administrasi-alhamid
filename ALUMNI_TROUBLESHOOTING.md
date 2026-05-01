# 🔧 Alumni Database - Troubleshooting Guide

## Masalah Umum & Solusi

### 1. ❌ Error: "relation idx_alumni_nama already exists"

**Penyebab:** Indeks database sudah ada dari instalasi sebelumnya.

**Solusi:** ✅ Sudah diperbaiki!
File `sql/init.sql` sudah diupdate dengan `IF NOT EXISTS` untuk semua indeks.

**Jika masih error:**
```bash
# Restart server
npm start
```

---

### 2. ❌ Tidak bisa akses http://localhost:3000

**Kemungkinan Penyebab:**

#### A. Server belum berjalan
```bash
# Cek apakah server berjalan
# Jika tidak, jalankan:
npm start
```

#### B. Port 3000 sudah digunakan
```bash
# Cek proses yang menggunakan port 3000
netstat -ano | findstr :3000

# Atau ubah port di .env
PORT=3001
```

#### C. PostgreSQL tidak berjalan
```bash
# Cek status PostgreSQL
# Windows: Buka Services, cari PostgreSQL
# Atau jalankan:
pg_isready
```

---

### 3. ❌ Halaman alumni kosong / tidak ada data

**Penyebab:** Belum ada data alumni di database.

**Solusi:**
1. Buka http://localhost:3000/alumni.html
2. Klik tombol "+ Tambah Alumni"
3. Isi form dan simpan

**Atau tambah data test:**
```bash
node test_alumni_api.js
```

---

### 4. ❌ Error saat menyimpan data alumni

**Kemungkinan Penyebab:**

#### A. Field wajib tidak diisi
**Solusi:** Pastikan field berikut diisi:
- NIS
- Nama
- Tahun Lulus

#### B. Koneksi database terputus
**Solusi:**
```bash
# Cek koneksi database di .env
# Pastikan kredensial benar:
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sekolah_info
```

#### C. Tabel alumni belum dibuat
**Solusi:**
```bash
# Jalankan init.sql
psql -U postgres -d sekolah_info -f sql/init.sql
```

---

### 5. ❌ Search tidak berfungsi

**Penyebab:** JavaScript error atau API error.

**Solusi:**
1. Buka Developer Tools (F12)
2. Cek tab Console untuk error
3. Cek tab Network untuk API response
4. Pastikan server berjalan

---

### 6. ❌ Data tidak terupdate setelah edit

**Penyebab:** Cache browser atau API error.

**Solusi:**
1. Refresh halaman (Ctrl + F5)
2. Clear browser cache
3. Cek console untuk error

---

### 7. ❌ Styling tidak muncul / halaman berantakan

**Penyebab:** File CSS tidak termuat.

**Solusi:**
1. Pastikan file `public/styles.css` ada
2. Clear browser cache (Ctrl + Shift + Delete)
3. Hard refresh (Ctrl + F5)

---

### 8. ❌ Error: "Cannot GET /api/alumni"

**Penyebab:** API routes belum terdaftar di server.js

**Solusi:**
1. Pastikan kode API alumni ada di `server.js`
2. Restart server:
```bash
# Stop server (Ctrl + C)
npm start
```

---

### 9. ❌ Modal form tidak muncul

**Penyebab:** JavaScript error atau CSS issue.

**Solusi:**
1. Buka Developer Tools (F12)
2. Cek Console untuk error
3. Pastikan file `alumni.html` lengkap
4. Refresh halaman

---

### 10. ❌ Database connection error

**Error Message:**
```
error: password authentication failed for user "postgres"
```

**Solusi:**
1. Cek file `.env`:
```env
DB_USER=postgres
DB_PASSWORD=your_actual_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sekolah_info
```

2. Test koneksi:
```bash
psql -U postgres -d sekolah_info
```

3. Jika password salah, reset password PostgreSQL

---

## Cara Cek Status Sistem

### 1. Cek Server Status
```bash
# Lihat output terminal
# Harus ada: "Server berjalan di http://localhost:3000"
```

### 2. Cek Database Connection
```bash
psql -U postgres -d sekolah_info -c "SELECT COUNT(*) FROM alumni;"
```

### 3. Cek API Endpoints
```bash
# Test GET
curl http://localhost:3000/api/alumni

# Test POST (PowerShell)
$body = @{
    nis = "TEST001"
    nama = "Test Alumni"
    tahun_lulus = 2024
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/alumni -Method POST -Body $body -ContentType "application/json"
```

### 4. Cek Tabel Alumni
```bash
psql -U postgres -d sekolah_info -c "\d alumni"
```

---

## Reset Database Alumni

Jika ingin mulai dari awal:

```sql
-- Hapus semua data alumni
TRUNCATE TABLE alumni RESTART IDENTITY CASCADE;

-- Atau drop dan buat ulang tabel
DROP TABLE IF EXISTS alumni CASCADE;

-- Lalu jalankan ulang init.sql
\i sql/init.sql
```

---

## Logs & Debugging

### 1. Server Logs
Lihat output terminal saat menjalankan `npm start`

### 2. Browser Console
1. Buka halaman alumni
2. Tekan F12
3. Lihat tab Console untuk error JavaScript
4. Lihat tab Network untuk API requests

### 3. Database Logs
```bash
# Lihat log PostgreSQL
# Windows: C:\Program Files\PostgreSQL\{version}\data\log\
```

---

## Verifikasi Instalasi

Jalankan checklist ini untuk memastikan semua berfungsi:

### ✅ Checklist:

1. [ ] PostgreSQL berjalan
2. [ ] File `.env` sudah dikonfigurasi
3. [ ] Database `sekolah_info` sudah dibuat
4. [ ] Tabel `alumni` sudah dibuat (cek dengan `\d alumni`)
5. [ ] Server berjalan (`npm start`)
6. [ ] Bisa akses http://localhost:3000
7. [ ] Bisa akses http://localhost:3000/alumni.html
8. [ ] API `/api/alumni` mengembalikan data (array)
9. [ ] Bisa tambah alumni baru
10. [ ] Bisa search alumni

### Test Cepat:
```bash
# 1. Start server
npm start

# 2. Di terminal lain, test API
curl http://localhost:3000/api/alumni

# 3. Jalankan test suite
node test_alumni_api.js

# 4. Buka browser
# http://localhost:3000/alumni.html
```

---

## Kontak Support

Jika masalah masih berlanjut:

1. **Cek dokumentasi lengkap:** `ALUMNI_DATABASE_DOCUMENTATION.md`
2. **Lihat implementation summary:** `ALUMNI_IMPLEMENTATION_SUMMARY.md`
3. **Review kode:** Lihat `server.js` bagian "ALUMNI API"
4. **Jalankan test:** `node test_alumni_api.js`

---

## Tips Pencegahan

1. **Selalu backup database** sebelum update:
   ```bash
   pg_dump -U postgres sekolah_info > backup.sql
   ```

2. **Gunakan version control** (Git):
   ```bash
   git add .
   git commit -m "Update alumni feature"
   ```

3. **Test di development** sebelum production

4. **Monitor logs** secara berkala

5. **Update dependencies** secara teratur:
   ```bash
   npm update
   ```

---

**Last Updated:** 30 April 2026  
**Version:** 1.0.0
