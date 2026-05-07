# 🔧 Migration & Rollback Fix - Data Berpindah dengan Benar

## 🔍 Masalah yang Ditemukan

### Masalah 1: Data Tidak Berpindah Saat Migrasi ❌
**Sebelum fix:**
- Migrasi dari 2028-2029 ke 2029-2030
- Data di-**COPY** (bukan di-move)
- Hasil:
  - 2028-2029: 13 santri (masih ada!)
  - 2029-2030: 13 santri (hasil copy)

**Seharusnya:**
- Data di-**MOVE** (pindah)
- Hasil:
  - 2028-2029: 0 santri (atau hanya yang tidak naik)
  - 2029-2030: 13 santri (yang naik kelas)

### Masalah 2: Rollback Error - Constraint Violation ❌
**Error:**
```
duplicate key value violates unique constraint "idx_tahun_ajaran_active_once"
```

**Penyebab:**
Saat rollback, sistem mencoba set 2 tahun ajaran sebagai `is_active = TRUE` secara bersamaan, melanggar constraint yang memastikan hanya 1 tahun ajaran yang aktif.

---

## ✅ Perbaikan yang Dilakukan

### Fix 1: Migrasi Sekarang MOVE Data (Bukan Copy)

**Perubahan di `src/routes/tahunAjaranRoutes.js`:**

```javascript
// SETELAH copy data ke tahun baru:

// 1. Mark santri yang tidak naik sebagai "tidak_naik"
if (excludedSantriIds.length > 0) {
  UPDATE santri_tahun_ajaran
  SET status = 'tidak_naik'
  WHERE tahun_ajaran_id = source.id
    AND santri_id IN (excludedSantriIds)
}

// 2. DELETE santri yang sudah naik dari tahun lama
DELETE FROM santri_tahun_ajaran
WHERE tahun_ajaran_id = source.id
  AND status != 'tidak_naik'  // Jangan hapus yang tidak naik
  AND santri_id IN (
    SELECT santri_id FROM santri_tahun_ajaran 
    WHERE tahun_ajaran_id = target.id
  )
```

**Hasil setelah migrasi:**
- ✅ Santri yang naik kelas: **PINDAH** ke tahun baru (dihapus dari tahun lama)
- ✅ Santri yang tidak naik: **TETAP** di tahun lama dengan status "tidak_naik"
- ✅ Tahun lama: Hanya berisi santri yang tidak naik
- ✅ Tahun baru: Berisi santri yang naik kelas

### Fix 2: Rollback Tidak Lagi Error Constraint

**Perubahan di rollback logic:**

```javascript
// SEBELUM (ERROR):
UPDATE tahun_ajaran SET is_active = TRUE WHERE id = sourceYear.id;
UPDATE tahun_ajaran SET is_active = FALSE WHERE id = currentYear.id;
// ❌ Bisa terjadi 2 tahun aktif bersamaan!

// SESUDAH (FIXED):
// 1. Set SEMUA tahun ke inactive dulu
UPDATE tahun_ajaran SET is_active = FALSE;

// 2. Baru set tahun yang benar ke active
UPDATE tahun_ajaran SET is_active = TRUE WHERE id = sourceYear.id;
UPDATE tahun_ajaran SET is_active = FALSE WHERE id = currentYear.id;
// ✅ Dijamin hanya 1 tahun yang aktif!
```

---

## 🧪 Cara Test Setelah Fix

### Test 1: Migrasi (Data Harus Pindah)

**Setup:**
- Tahun 2028-2029 (Berjalan): 13 santri
- Tahun 2029-2030 (Belum ada): 0 santri

**Langkah:**
1. Klik **"Migrasi Tahun Ajaran"**
2. Pilih 10 santri naik kelas, 3 santri tidak naik
3. Klik **"Proses Migrasi"**

**Expected Result:**
- ✅ 2028-2029 (Arsip): **3 santri** (yang tidak naik)
- ✅ 2029-2030 (Berjalan): **10 santri** (yang naik kelas)
- ✅ Status tahun berubah: 2028-2029 jadi "Arsip", 2029-2030 jadi "Berjalan"

### Test 2: Rollback (Data Harus Kembali)

**Setup:**
- Setelah migrasi di atas
- 2028-2029 (Arsip): 3 santri
- 2029-2030 (Berjalan): 10 santri

**Langkah:**
1. Klik **"Rollback Migrasi"**
2. Konfirmasi dialog

**Expected Result:**
- ✅ 2028-2029 (Berjalan): **13 santri** (semua kembali, status "tidak_naik" jadi "aktif")
- ✅ 2029-2030 (Draft): **0 santri** (data dihapus)
- ✅ Status tahun berubah: 2028-2029 jadi "Berjalan", 2029-2030 jadi "Draft"
- ✅ **TIDAK ADA ERROR** constraint violation

---

## 📋 Checklist Sebelum Test

### ☑️ 1. Restart Backend (WAJIB!)

```bash
# Stop backend (Ctrl+C di terminal backend)
# Start lagi:
node server.js
```

### ☑️ 2. Clear Browser Cache

```bash
# Hard refresh:
Ctrl + Shift + R

# Atau:
F12 > Right-click refresh > "Empty Cache and Hard Reload"
```

### ☑️ 3. Backup Database (RECOMMENDED!)

```bash
# Backup sebelum test:
pg_dump -U postgres nama_database > backup_before_test.sql

# Restore jika ada masalah:
psql -U postgres nama_database < backup_before_test.sql
```

---

## 🎯 Perbandingan Sebelum vs Sesudah

### Sebelum Fix ❌

| Aksi | Tahun Lama | Tahun Baru | Masalah |
|------|------------|------------|---------|
| Migrasi 13 santri | 13 santri | 13 santri | Data di-copy, tidak pindah |
| Rollback | Error | Error | Constraint violation |

### Sesudah Fix ✅

| Aksi | Tahun Lama | Tahun Baru | Status |
|------|------------|------------|--------|
| Migrasi 10 naik, 3 tidak naik | 3 santri (tidak naik) | 10 santri (naik) | ✅ Data pindah |
| Rollback | 13 santri (semua kembali) | 0 santri | ✅ Berhasil |

---

## 🔍 Technical Details

### Constraint yang Menyebabkan Error

```sql
-- Constraint ini memastikan hanya 1 tahun ajaran yang aktif:
CREATE UNIQUE INDEX idx_tahun_ajaran_active_once 
ON tahun_ajaran (is_active) 
WHERE is_active = TRUE;
```

**Solusi:**
Set semua tahun ke `is_active = FALSE` dulu, baru set yang benar ke `TRUE`.

### Query DELETE yang Ditambahkan

```sql
-- Hapus santri yang sudah naik dari tahun lama:
DELETE FROM santri_tahun_ajaran
WHERE tahun_ajaran_id = $1  -- source year
  AND status != 'tidak_naik'  -- Jangan hapus yang tidak naik
  AND santri_id IN (
    SELECT santri_id 
    FROM santri_tahun_ajaran 
    WHERE tahun_ajaran_id = $2  -- target year
  )
```

---

## 📊 Status Implementasi

| Feature | Status | Keterangan |
|---------|--------|------------|
| Migrasi MOVE Data | ✅ FIXED | Data sekarang pindah, bukan copy |
| Rollback Constraint | ✅ FIXED | Tidak ada error constraint lagi |
| Rollback Button UI | ✅ DONE | Tombol sudah muncul |
| Migration Log | ✅ DONE | Log tersimpan untuk rollback |
| Database Table | ✅ DONE | Tabel migration_log sudah ada |

---

## 🚀 Next Steps

1. ✅ **Restart backend** (WAJIB!)
2. ✅ **Clear browser cache**
3. ✅ **Backup database** (recommended)
4. ✅ **Test migrasi** - Cek data pindah dengan benar
5. ✅ **Test rollback** - Cek data kembali tanpa error

---

## 💡 Tips

- **Selalu backup database** sebelum test migrasi/rollback
- **Cek jumlah santri** di setiap tahun ajaran setelah migrasi
- **Santri yang tidak naik** akan tetap di tahun lama dengan status "tidak_naik"
- **Rollback hanya bisa dilakukan 1x** per migrasi (log dihapus setelah rollback)

---

**Dibuat:** 3 Mei 2026, 04:15 AM
**Status:** Siap untuk testing
**Files Modified:** `src/routes/tahunAjaranRoutes.js`
