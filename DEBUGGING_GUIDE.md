# 🐛 Debugging Guide: Migration Still Failing

## 📋 Langkah Debugging

### LANGKAH 1: Jalankan Diagnostic Script

```bash
node check_constraints.js
```

**Script ini akan mengecek:**
1. ✅ UNIQUE constraint pada `santri_tahun_ajaran`
2. ✅ UNIQUE constraint pada `alumni`
3. ✅ Kolom `tingkat` pada `kelas`
4. ✅ Sample data kelas
5. ✅ Kelas tanpa tingkat
6. ✅ Duplicate records

**Kirimkan output script ini untuk analisis lebih lanjut!**

---

### LANGKAH 2: Cek Log Backend

Buka terminal tempat `node server.js` berjalan, cari error message seperti:

```
❌ Migration error: [error message]
❌ Error stack: [stack trace]
```

**Copy paste error message lengkap!**

---

### LANGKAH 3: Cek Browser Console

1. Buka Developer Tools (F12)
2. Tab "Console"
3. Cari error message berwarna merah
4. Screenshot atau copy paste error

---

### LANGKAH 4: Verifikasi Backend Sudah Restart

```bash
# Pastikan Anda sudah:
# 1. Ctrl+C untuk stop server lama
# 2. node server.js untuk start server baru

# Cek di output server, harus ada:
Server berjalan di http://localhost:3000
Database terhubung
```

**Jika belum restart, RESTART SEKARANG!**

---

## 🔍 Common Issues & Solutions

### Issue 1: Backend Belum Di-Restart

**Symptom:** Error masih sama persis

**Solution:**
```bash
# Stop server (Ctrl+C)
# Start ulang:
node server.js
```

---

### Issue 2: UNIQUE Constraint Tidak Ada

**Symptom:** Error "there is no unique or exclusion constraint"

**Solution:**
```bash
# Run fix script:
node fix_unique_constraint.js
```

---

### Issue 3: Kelas Tidak Punya Tingkat

**Symptom:** Error "tingkat is null" atau "cannot read property tingkat"

**Solution:**
```bash
# Run migration script:
node migrations/add_tingkat_to_kelas.js up
```

---

### Issue 4: Duplicate Records

**Symptom:** Error "duplicate key value violates unique constraint"

**Solution:**
```bash
# Run fix script (akan hapus duplicates):
node fix_unique_constraint.js
```

---

### Issue 5: Alumni Table Tidak Ada Constraint

**Symptom:** Error di `alumniManager.createAlumniRecord`

**Solution:**
```sql
-- Run di database:
ALTER TABLE alumni
ADD CONSTRAINT alumni_santri_id_key
UNIQUE (santri_id);
```

---

## 📊 Expected vs Actual

### Expected Behavior:

**Santri Kelas 6 Diniyah (tanpa Sekolah):**
```
🔄 Processing: [Nama Santri]
🎓 Processing graduation for santri [ID]
   Graduation status: { shouldBecomeAlumni: true, ... }
   ✅ Creating alumni record with status: Lulus Diniyah Kelas 6
   📝 Creating alumni record for santri [ID]
   ✅ Alumni record created with ID: [ID]
   ✅ Status updated successfully
```

**Santri Kelas 9 Sekolah:**
```
🔄 Processing: [Nama Santri]
🎓 Processing graduation for santri [ID]
   Graduation status: { isMtsGraduate: true, ... }
   📝 Marking as MTs graduate (lulus status)
   ✅ MTs graduate status updated
   📚 Advanced classes: { diniyah: null, sekolah: [Kelas 10 ID] }
   ✅ Migrated successfully
```

**Santri Kelas 12 Sekolah:**
```
🔄 Processing: [Nama Santri]
🎓 Processing graduation for santri [ID]
   Graduation status: { shouldBecomeAlumni: true, ... }
   ✅ Creating alumni record with status: Lulus MA
   📝 Creating alumni record for santri [ID]
   ✅ Alumni record created with ID: [ID]
   ✅ Status updated successfully
```

### Actual Behavior (Yang Anda Lihat):

**Tolong screenshot atau copy paste log yang muncul!**

---

## 🧪 Manual Testing Steps

### Test 1: Cek Kelas Tingkat

```sql
-- Cek kelas 6, 9, 12 ada dan punya tingkat
SELECT id, jenis, nama, tingkat
FROM kelas
WHERE tingkat IN (6, 9, 12)
ORDER BY jenis, tingkat;
```

**Expected:** Harus ada kelas dengan tingkat 6, 9, 12

---

### Test 2: Cek Santri Data

```sql
-- Cek santri yang akan di-test
SELECT 
  sta.id,
  sta.santri_id,
  sta.nama,
  kd.nama as diniyah,
  kd.tingkat as diniyah_tingkat,
  ks.nama as sekolah,
  ks.tingkat as sekolah_tingkat
FROM santri_tahun_ajaran sta
LEFT JOIN kelas kd ON sta.kelas_diniyah_id = kd.id
LEFT JOIN kelas ks ON sta.kelas_sekolah_id = ks.id
WHERE sta.tahun_ajaran_id = [ID_TAHUN_AKTIF]
  AND (kd.tingkat = 6 OR ks.tingkat IN (9, 12));
```

**Expected:** Harus ada santri dengan tingkat yang sesuai

---

### Test 3: Cek Alumni Table

```sql
-- Cek struktur alumni table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'alumni'
ORDER BY ordinal_position;
```

**Expected:** Harus ada kolom: santri_id, nis, nama, tahun_lulus, kelas_terakhir, dll

---

## 📝 Information Needed for Debugging

Tolong berikan informasi berikut:

1. **Output dari `node check_constraints.js`**
2. **Log error dari backend console** (terminal)
3. **Error dari browser console** (F12)
4. **Screenshot modal migrasi** (sebelum klik Proses Migrasi)
5. **Hasil query Test 1, 2, 3** di atas

Dengan informasi ini, saya bisa identify masalah yang sebenarnya!

---

## 🚨 Quick Fix Checklist

Coba langkah-langkah ini secara berurutan:

- [ ] **Stop backend** (Ctrl+C)
- [ ] **Run:** `node check_constraints.js`
- [ ] **Run:** `node fix_unique_constraint.js` (jika ada issue)
- [ ] **Run:** `node migrations/add_tingkat_to_kelas.js up` (jika belum)
- [ ] **Start backend:** `node server.js`
- [ ] **Refresh browser** (Ctrl+F5)
- [ ] **Coba migrasi lagi**

---

## 💡 Tips

1. **Selalu cek log backend** - Error detail ada di sini
2. **Restart backend setelah code change** - Wajib!
3. **Clear browser cache** - Ctrl+Shift+R
4. **Cek database constraints** - Harus ada UNIQUE constraints
5. **Cek tingkat column** - Semua kelas harus punya tingkat

---

**Status:** ⏳ Waiting for diagnostic information

**Next Step:** Jalankan `node check_constraints.js` dan kirim outputnya!
