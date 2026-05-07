# 🔧 Fix: Migration Error - ON CONFLICT Constraint

## ❌ Error Message
```
Gagal migrasi tahun ajaran: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

## 🔍 Root Cause

Query migrasi menggunakan `ON CONFLICT (tahun_ajaran_id, santri_id)` tapi UNIQUE constraint tidak ada di database.

## ✅ Solusi yang Sudah Diterapkan

### Solusi 1: Hapus ON CONFLICT Clause (SUDAH DITERAPKAN)

Code sudah diupdate untuk:
1. **Cek dulu** apakah santri sudah ada di target year
2. **Skip** jika sudah ada
3. **Insert** tanpa ON CONFLICT clause

**Status:** ✅ Code sudah diperbaiki

---

## 🚀 Cara Testing Fix

### LANGKAH 1: Restart Backend Server

**PENTING!** Backend harus di-restart:

```bash
# Tekan Ctrl+C untuk stop
# Kemudian jalankan ulang:
node server.js
```

### LANGKAH 2: Coba Migrasi Lagi

1. Buka halaman Santri: `http://localhost:3000/santri`
2. Klik "Migrasi Tahun Ajaran"
3. Klik "Proses Migrasi"

**Seharusnya sekarang berhasil!** ✅

---

## 🔧 Solusi Alternatif (Opsional): Tambah UNIQUE Constraint

Jika Anda ingin menambahkan UNIQUE constraint ke database (recommended untuk data integrity):

### Jalankan Fix Script:

```bash
node fix_unique_constraint.js
```

**Script ini akan:**
1. ✅ Cek apakah constraint sudah ada
2. ✅ Hapus duplicate records (jika ada)
3. ✅ Buat UNIQUE constraint
4. ✅ Verifikasi constraint berhasil dibuat

**Output yang diharapkan:**
```
🔍 Checking for UNIQUE constraint on santri_tahun_ajaran...
⚠️  UNIQUE constraint not found. Creating...
🔍 Checking for duplicate records...
✅ No duplicate records found
📝 Creating UNIQUE constraint...
✅ UNIQUE constraint created successfully

📊 Current UNIQUE constraints on santri_tahun_ajaran:
   - santri_tahun_ajaran_tahun_ajaran_id_santri_id_key

✅ Fix completed successfully
```

### Jika Ada Duplicate Records:

Script akan otomatis:
- Menampilkan duplicate records
- Menghapus duplicates (keep yang terbaru)
- Buat constraint

---

## 📊 Verifikasi Manual (Opsional)

### Cek Constraint di Database:

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'santri_tahun_ajaran'
  AND constraint_type = 'UNIQUE';
```

**Harus ada constraint dengan nama seperti:**
- `santri_tahun_ajaran_tahun_ajaran_id_santri_id_key`

### Cek Duplicate Records:

```sql
SELECT tahun_ajaran_id, santri_id, COUNT(*) as count
FROM santri_tahun_ajaran
GROUP BY tahun_ajaran_id, santri_id
HAVING COUNT(*) > 1;
```

**Harus return 0 rows** (tidak ada duplicate)

---

## 🎯 Perbandingan Solusi

### Solusi 1: Hapus ON CONFLICT (SUDAH DITERAPKAN) ✅

**Pros:**
- ✅ Langsung bisa dipakai
- ✅ Tidak perlu ubah database
- ✅ Aman untuk data existing

**Cons:**
- ⚠️ Sedikit lebih lambat (extra SELECT query)
- ⚠️ Tidak enforce data integrity di database level

**Recommended untuk:** Quick fix, production dengan data existing

---

### Solusi 2: Tambah UNIQUE Constraint (OPSIONAL)

**Pros:**
- ✅ Data integrity di database level
- ✅ Lebih cepat (ON CONFLICT lebih efisien)
- ✅ Prevent duplicate di masa depan

**Cons:**
- ⚠️ Perlu hapus duplicate dulu (jika ada)
- ⚠️ Perlu run migration script

**Recommended untuk:** Clean database, long-term solution

---

## ✅ Checklist

- [ ] Backend server di-restart
- [ ] Coba migrasi lagi
- [ ] Migrasi berhasil! 🎉
- [ ] (Opsional) Run `fix_unique_constraint.js`
- [ ] (Opsional) Verify constraint di database

---

## 🐛 Troubleshooting

### Error: "Duplicate key value violates unique constraint"

**Penyebab:** Ada duplicate records di database

**Solusi:**
```bash
# Run fix script untuk hapus duplicates
node fix_unique_constraint.js
```

### Error: "Cannot read property 'rows' of undefined"

**Penyebab:** Backend belum di-restart

**Solusi:**
```bash
# Restart backend
# Ctrl+C, kemudian:
node server.js
```

### Migrasi masih error

**Solusi:**
1. Cek log backend untuk error detail
2. Pastikan backend sudah di-restart
3. Cek database connection
4. Coba rollback dulu, kemudian migrasi lagi

---

## 📝 Technical Details

### Perubahan Code:

**Before:**
```javascript
await client.query(`
  INSERT INTO santri_tahun_ajaran (...)
  VALUES (...)
  ON CONFLICT (tahun_ajaran_id, santri_id) DO NOTHING
`, [...]);
```

**After:**
```javascript
// Check if santri already exists
const existingCheck = await client.query(
  'SELECT id FROM santri_tahun_ajaran WHERE tahun_ajaran_id = $1 AND santri_id = $2',
  [target.id, santri.santri_id]
);

if (existingCheck.rows.length > 0) {
  console.log(`   ⚠️  Santri already exists in target year, skipping...`);
  continue;
}

await client.query(`
  INSERT INTO santri_tahun_ajaran (...)
  VALUES (...)
`, [...]);
```

**Benefit:**
- ✅ Tidak bergantung pada UNIQUE constraint
- ✅ Lebih explicit error handling
- ✅ Better logging

---

## 🎉 Status

**Fix Applied:** ✅ Yes  
**Tested:** ⏳ Pending (restart backend & test)  
**Production Ready:** ✅ Yes (after testing)

---

**Next Step:** Restart backend dan coba migrasi lagi! 🚀
