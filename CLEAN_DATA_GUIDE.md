# 🧹 Panduan Membersihkan Data Testing

## 📋 Pilihan Script

Ada **2 script** untuk membersihkan data:

### 1. `clean_test_data.js` - Hapus SEMUA Data ⚠️
**Gunakan jika:** Mau mulai dari awal, hapus semua data santri dan migration log.

**Yang dihapus:**
- ✅ Semua migration log
- ✅ Semua data santri_tahun_ajaran
- ✅ Reset semua tahun ajaran ke status "draft"
- ✅ Set tahun paling lama sebagai tahun berjalan

**Cara pakai:**
```bash
node clean_test_data.js
```

### 2. `clean_specific_years.js` - Hapus Data Tahun Tertentu ✅ (RECOMMENDED)
**Gunakan jika:** Hanya mau hapus data dari tahun tertentu saja.

**Yang dihapus:**
- ✅ Data santri dari tahun yang dipilih
- ✅ Migration log yang terkait dengan tahun tersebut

**Cara pakai:**
```bash
node clean_specific_years.js
```

---

## 🚀 Cara Menggunakan `clean_specific_years.js` (RECOMMENDED)

### Langkah 1: Jalankan Script

```bash
node clean_specific_years.js
```

### Langkah 2: Lihat Daftar Tahun Ajaran

Script akan menampilkan daftar seperti ini:

```
📋 Daftar Tahun Ajaran:

ID | Kode      | Status    | Active | Jumlah Santri
---|-----------|-----------|--------|---------------
1  | 2016-2017 | arsip     |        | 0
2  | 2017-2018 | arsip     |        | 1
3  | 2018-2019 | arsip     |        | 0
4  | 2019-2020 | arsip     |        | 0
5  | 2020-2021 | arsip     |        | 0
6  | 2021-2022 | arsip     |        | 0
7  | 2022-2023 | arsip     |        | 0
8  | 2023-2024 | arsip     |        | 0
9  | 2024-2025 | arsip     |        | 0
10 | 2025-2026 | arsip     |        | 11
11 | 2026-2027 | arsip     |        | 0
12 | 2027-2028 | berjalan  | ✅     | 13
13 | 2028-2029 | draft     |        | 0
14 | 2029-2030 | draft     |        | 0
```

### Langkah 3: Pilih Tahun yang Mau Dihapus

Masukkan ID tahun ajaran (pisahkan dengan koma):

**Contoh 1:** Hapus data dari tahun 2027-2028 dan 2028-2029
```
Masukkan ID: 12,13
```

**Contoh 2:** Hapus data dari semua tahun kecuali 2026-2027
```
Masukkan ID: 1,2,3,4,5,6,7,8,9,10,11,12,13,14
```

**Contoh 3:** Hapus data dari tahun 2025-2026 ke atas
```
Masukkan ID: 10,11,12,13,14
```

### Langkah 4: Konfirmasi

Script akan menampilkan tahun yang akan dihapus:

```
📝 Tahun yang akan dihapus datanya:
   - 2027-2028 (13 santri)
   - 2028-2029 (0 santri)

⚠️  Yakin mau hapus data dari tahun-tahun ini? (yes/no):
```

Ketik `yes` untuk konfirmasi.

### Langkah 5: Selesai

```
✅ SUCCESS! Data has been cleaned.

📝 Summary:
   - Santri records deleted: 13
   - Migration logs deleted: 2

💡 Next Steps:
   1. Restart backend server
   2. Refresh browser
   3. Test migration and rollback
```

---

## 🧪 Skenario Testing yang Disarankan

### Skenario 1: Test dari Awal (Clean Slate)

**Tujuan:** Test migrasi dan rollback dari awal tanpa data lama.

**Langkah:**
1. Jalankan `clean_test_data.js` untuk hapus semua data
2. Restart backend
3. Tambah 10-15 santri ke tahun berjalan (misal 2026-2027)
4. Test migrasi ke 2027-2028
5. Test rollback ke 2026-2027
6. Test migrasi lagi ke 2027-2028
7. Test migrasi ke 2028-2029
8. Test rollback ke 2027-2028
9. Test rollback ke 2026-2027

### Skenario 2: Test dengan Data Existing

**Tujuan:** Test rollback berkali-kali dengan data yang sudah ada.

**Langkah:**
1. Jalankan `clean_specific_years.js`
2. Pilih tahun 2027-2028 ke atas untuk dihapus
3. Biarkan data di 2026-2027 tetap ada
4. Restart backend
5. Set 2026-2027 sebagai tahun berjalan (jika belum)
6. Test migrasi ke 2027-2028
7. Test rollback ke 2026-2027
8. Ulangi beberapa kali

---

## 🔧 Troubleshooting

### Error: "relation does not exist"

**Penyebab:** Tabel belum dibuat.

**Solusi:**
```bash
node create_migration_log_table.js
```

### Error: "Cannot read property 'kode' of undefined"

**Penyebab:** Tidak ada tahun ajaran di database.

**Solusi:**
1. Buat tahun ajaran dulu via UI atau SQL
2. Jalankan script lagi

### Script Tidak Menghapus Apa-apa

**Penyebab:** Mungkin ID yang dimasukkan salah atau tidak ada data.

**Solusi:**
1. Cek daftar tahun ajaran yang ditampilkan
2. Pastikan ID yang dimasukkan benar
3. Cek apakah tahun tersebut punya data santri

---

## 💡 Tips

### Backup Database Sebelum Hapus Data

```bash
# Backup database:
pg_dump -U postgres nama_database > backup_before_clean.sql

# Restore jika ada masalah:
psql -U postgres nama_database < backup_before_clean.sql
```

### Hapus Data Tahun Tertentu via SQL (Manual)

Jika mau hapus manual via SQL:

```sql
-- Hapus data santri dari tahun 2027-2028 (ID = 12)
DELETE FROM santri_tahun_ajaran WHERE tahun_ajaran_id = 12;

-- Hapus migration log terkait
DELETE FROM migration_log 
WHERE source_tahun_ajaran_id = 12 
   OR target_tahun_ajaran_id = 12;

-- Reset status tahun ajaran
UPDATE tahun_ajaran SET status = 'draft', is_active = FALSE WHERE id = 12;
```

### Set Tahun Ajaran Berjalan via SQL

```sql
-- Set semua tahun ke inactive
UPDATE tahun_ajaran SET is_active = FALSE;

-- Set tahun 2026-2027 (ID = 11) sebagai berjalan
UPDATE tahun_ajaran 
SET is_active = TRUE, status = 'berjalan' 
WHERE id = 11;
```

---

## 📊 Checklist Setelah Clean Data

- [ ] Data santri terhapus dari tahun yang dipilih
- [ ] Migration log terhapus
- [ ] Backend sudah di-restart
- [ ] Browser sudah di-refresh
- [ ] Tahun berjalan sudah benar
- [ ] Bisa tambah santri baru
- [ ] Bisa migrasi ke tahun berikutnya
- [ ] Bisa rollback ke tahun sebelumnya

---

**Dibuat:** 3 Mei 2026, 04:45 AM
**Status:** Siap digunakan
