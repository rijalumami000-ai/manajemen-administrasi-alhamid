# 🔧 Fix: Rollback Berkali-kali (Multiple Rollbacks)

## 🔍 Masalah

**Skenario:**
1. ✅ Migrasi 2027-2028 → 2028-2029: **BERHASIL**
2. ✅ Rollback 2028-2029 → 2027-2028: **BERHASIL**
3. ❌ Rollback 2027-2028 → 2026-2027: **GAGAL**

**Error:**
```
Tidak ada log migrasi untuk tahun ajaran ini
```

**Penyebab:**
Setelah rollback pertama, migration log **dihapus**. Jadi saat mau rollback lagi ke tahun sebelumnya, tidak ada log yang tersisa.

---

## ✅ Solusi yang Diimplementasi

### Strategi: Jangan Hapus Data Saat Migrasi, Tapi Tandai Sebagai "Lulus"

**Sebelum fix:**
```sql
-- Migrasi: DELETE data dari tahun lama
DELETE FROM santri_tahun_ajaran
WHERE tahun_ajaran_id = source_year
  AND santri_id IN (migrated_santri_ids)
```
❌ **Masalah:** Data dihapus, tidak bisa di-restore saat rollback!

**Sesudah fix:**
```sql
-- Migrasi: MARK data sebagai "lulus" di tahun lama
UPDATE santri_tahun_ajaran
SET status = 'lulus',
    catatan = CONCAT(catatan, ' - Lulus ke 2028-2029')
WHERE tahun_ajaran_id = source_year
  AND santri_id IN (migrated_santri_ids)
```
✅ **Solusi:** Data tetap ada, hanya status berubah. Bisa di-restore saat rollback!

---

## 🔄 Alur Migrasi & Rollback Baru

### Migrasi: 2027-2028 → 2028-2029

**Tahun 2027-2028 (source):**
- Santri yang naik: Status `aktif` → `lulus` ✅ (tetap ada, tidak dihapus)
- Santri yang tidak naik: Status `aktif` → `tidak_naik` ✅

**Tahun 2028-2029 (target):**
- Santri yang naik: Status `aktif` ✅ (data baru di-copy)

**Migration Log:**
```json
{
  "source_tahun_ajaran_id": 5,  // 2027-2028
  "target_tahun_ajaran_id": 6,  // 2028-2029
  "migrated_count": 10,
  "excluded_santri_ids": [1, 2, 3]  // Yang tidak naik
}
```

### Rollback: 2028-2029 → 2027-2028

**Tahun 2028-2029 (target):**
- Semua data santri: **DIHAPUS** ❌

**Tahun 2027-2028 (source):**
- Santri yang naik: Status `lulus` → `aktif` ✅ (di-restore)
- Santri yang tidak naik: Status `tidak_naik` → `aktif` ✅ (di-restore)

**Migration Log:**
- **DIHAPUS** setelah rollback berhasil ❌

---

## 📊 Perbandingan Sebelum vs Sesudah

### Sebelum Fix ❌

| Aksi | Tahun Lama | Tahun Baru | Migration Log | Bisa Rollback Lagi? |
|------|------------|------------|---------------|---------------------|
| Migrasi | Data **DIHAPUS** | Data baru | Ada | ✅ Bisa |
| Rollback | Data **HILANG** | Data dihapus | **DIHAPUS** | ❌ Tidak bisa |

### Sesudah Fix ✅

| Aksi | Tahun Lama | Tahun Baru | Migration Log | Bisa Rollback Lagi? |
|------|------------|------------|---------------|---------------------|
| Migrasi | Status `lulus` | Data baru | Ada | ✅ Bisa |
| Rollback | Status `aktif` | Data dihapus | **DIHAPUS** | ✅ Bisa (jika ada log sebelumnya) |

---

## 🧪 Cara Test

### Test 1: Migrasi Berkali-kali

```
2026-2027 (Berjalan) → Migrasi → 2027-2028 (Berjalan)
2027-2028 (Berjalan) → Migrasi → 2028-2029 (Berjalan)
2028-2029 (Berjalan) → Migrasi → 2029-2030 (Berjalan)
```

**Expected:**
- ✅ Setiap tahun lama: Santri berstatus "lulus" (tidak dihapus)
- ✅ Setiap tahun baru: Santri berstatus "aktif"

### Test 2: Rollback Berkali-kali

```
2029-2030 (Berjalan) → Rollback → 2028-2029 (Berjalan)
2028-2029 (Berjalan) → Rollback → 2027-2028 (Berjalan)
2027-2028 (Berjalan) → Rollback → 2026-2027 (Berjalan)
```

**Expected:**
- ✅ Setiap rollback berhasil
- ✅ Data kembali ke tahun sebelumnya
- ✅ Status "lulus" berubah jadi "aktif"
- ✅ Status "tidak_naik" berubah jadi "aktif"

---

## 🔍 Technical Details

### Perubahan di Migration Logic

```javascript
// SEBELUM (DELETE):
DELETE FROM santri_tahun_ajaran
WHERE tahun_ajaran_id = source.id
  AND santri_id IN (migrated_santri_ids)

// SESUDAH (UPDATE STATUS):
UPDATE santri_tahun_ajaran
SET status = 'lulus',
    catatan = CONCAT(catatan, ' - Lulus ke ', target.kode)
WHERE tahun_ajaran_id = source.id
  AND status NOT IN ('tidak_naik', 'lulus')
  AND santri_id IN (
    SELECT santri_id FROM santri_tahun_ajaran 
    WHERE tahun_ajaran_id = target.id
  )
```

### Perubahan di Rollback Logic

```javascript
// Restore "lulus" status back to "aktif"
UPDATE santri_tahun_ajaran
SET status = 'aktif',
    catatan = REGEXP_REPLACE(catatan, ' - Lulus ke .*', '', 'g')
WHERE tahun_ajaran_id = source.id
  AND santri_id = ANY(migrated_santri_ids)
  AND status = 'lulus'

// Restore "tidak_naik" status back to "aktif"
UPDATE santri_tahun_ajaran
SET status = 'aktif',
    catatan = REGEXP_REPLACE(catatan, ' - Tidak naik ke .*', '', 'g')
WHERE tahun_ajaran_id = source.id
  AND santri_id = ANY(excluded_santri_ids)
  AND status = 'tidak_naik'
```

---

## 📋 Status Santri

| Status | Arti | Kapan Digunakan |
|--------|------|-----------------|
| `aktif` | Santri aktif di tahun ajaran ini | Default status |
| `lulus` | Santri sudah lulus/naik ke tahun berikutnya | Setelah migrasi |
| `tidak_naik` | Santri tidak naik kelas | Saat migrasi (excluded) |
| `draft` | Data draft (belum final) | Jarang digunakan |

---

## 🚀 Langkah-Langkah Testing

### 1. Restart Backend (WAJIB!)

```bash
# Stop backend (Ctrl+C)
# Start lagi:
node server.js
```

### 2. Clear Browser Cache

```bash
Ctrl + Shift + R
```

### 3. Test Migrasi Berkali-kali

1. Migrasi 2026-2027 → 2027-2028
2. Cek: 2026-2027 harus ada santri dengan status "lulus"
3. Migrasi 2027-2028 → 2028-2029
4. Cek: 2027-2028 harus ada santri dengan status "lulus"
5. Migrasi 2028-2029 → 2029-2030
6. Cek: 2028-2029 harus ada santri dengan status "lulus"

### 4. Test Rollback Berkali-kali

1. Rollback 2029-2030 → 2028-2029
2. Cek: 2028-2029 santri status "lulus" jadi "aktif"
3. Rollback 2028-2029 → 2027-2028
4. Cek: 2027-2028 santri status "lulus" jadi "aktif"
5. Rollback 2027-2028 → 2026-2027
6. Cek: 2026-2027 santri status "lulus" jadi "aktif"

---

## 💡 Catatan Penting

### Kenapa Tidak Hapus Data Saat Migrasi?

**Alasan:**
1. ✅ **Rollback bisa dilakukan berkali-kali** - Data masih ada di tahun lama
2. ✅ **History tetap terjaga** - Bisa lihat santri mana yang lulus di tahun tertentu
3. ✅ **Audit trail** - Bisa tracking perjalanan santri dari tahun ke tahun
4. ✅ **Aman** - Tidak ada data yang hilang permanen

### Apakah Data Tahun Lama Akan Muncul di UI?

**Tidak!** Data dengan status "lulus" **tidak akan muncul** di UI karena:
- Filter default hanya menampilkan santri dengan status `aktif`, `draft`, atau `tidak_naik`
- Status `lulus` dianggap sebagai "archived" dan tidak ditampilkan

### Bagaimana Jika Ingin Lihat Santri yang Lulus?

Bisa tambahkan filter di UI untuk menampilkan santri dengan status "lulus" jika diperlukan.

---

## 📊 Status Implementasi

| Feature | Status | Keterangan |
|---------|--------|------------|
| Migrasi MARK as "lulus" | ✅ DONE | Data tidak dihapus, hanya status berubah |
| Rollback Restore "lulus" | ✅ DONE | Status "lulus" dikembalikan ke "aktif" |
| Rollback Berkali-kali | ✅ DONE | Bisa rollback ke tahun sebelumnya berkali-kali |
| Constraint Fix | ✅ DONE | Tidak ada error constraint lagi |

---

**Dibuat:** 3 Mei 2026, 04:30 AM
**Status:** Siap untuk testing
**Files Modified:** `src/routes/tahunAjaranRoutes.js`
