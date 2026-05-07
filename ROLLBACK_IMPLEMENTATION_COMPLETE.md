# ✅ Rollback Migration - Implementation Complete!

## 🎉 Fitur Rollback Sudah Diimplementasikan!

Fitur rollback migration memungkinkan user untuk membatalkan migrasi dan mengembalikan data ke tahun ajaran sebelumnya.

---

## 📋 Yang Sudah Diimplementasikan:

### 1. **Database Table: `migration_log`**
- File SQL: `migration_log_table.sql`
- Menyimpan log setiap migrasi untuk keperluan rollback
- Kolom: source_tahun_ajaran_id, target_tahun_ajaran_id, migrated_count, excluded_santri_ids

### 2. **Backend API: Rollback Endpoint**
- File: `src/routes/tahunAjaranRoutes.js`
- Endpoint: `POST /api/tahun-ajaran/rollback`
- Fungsi:
  - Menghapus data santri yang sudah dimigrasi
  - Mengembalikan status "tidak_naik" ke "aktif"
  - Mengembalikan tahun ajaran berjalan ke tahun sebelumnya
  - Menghapus log migrasi

### 3. **Frontend Service**
- File: `frontend/src/services/santriService.js`
- Fungsi: `rollbackMigration()`
- Memanggil endpoint rollback

### 4. **Frontend UI**
- File: `frontend/src/pages/Santri.jsx`
- Tombol "Rollback Migrasi" (merah/danger) di PageHeader
- Konfirmasi dialog sebelum rollback
- Handler: `handleRollbackClick()`

### 5. **Logging Migration**
- Setiap migrasi sekarang otomatis disimpan ke tabel `migration_log`
- Log berisi: source year, target year, jumlah santri yang migrasi, dan ID santri yang tidak naik

---

## 🚀 Langkah-Langkah Setup:

### **LANGKAH 1: Create Table `migration_log`** (WAJIB!)

Kamu perlu menjalankan SQL script untuk membuat tabel `migration_log` di database.

#### **Cara 1: Menggunakan pgAdmin atau DBeaver**
1. Buka pgAdmin atau DBeaver
2. Connect ke database `sekolah_info`
3. Buka Query Tool
4. Copy-paste isi file `migration_log_table.sql`:

```sql
-- Tabel untuk menyimpan log migrasi (untuk fitur rollback)
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  source_tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
  target_tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
  migrated_count INTEGER NOT NULL,
  excluded_santri_ids INTEGER[],
  migration_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_migration_log_target ON migration_log(target_tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_migration_log_date ON migration_log(migration_date DESC);

-- Comment
COMMENT ON TABLE migration_log IS 'Log migrasi tahun ajaran untuk fitur rollback';
COMMENT ON COLUMN migration_log.source_tahun_ajaran_id IS 'ID tahun ajaran sumber (yang lama)';
COMMENT ON COLUMN migration_log.target_tahun_ajaran_id IS 'ID tahun ajaran target (yang baru)';
COMMENT ON COLUMN migration_log.migrated_count IS 'Jumlah santri yang dimigrasi';
COMMENT ON COLUMN migration_log.excluded_santri_ids IS 'Array ID santri yang tidak naik kelas';
COMMENT ON COLUMN migration_log.migration_date IS 'Tanggal migrasi dilakukan';
```

5. Execute (F5 atau klik tombol Execute)
6. Verifikasi tabel berhasil dibuat

#### **Cara 2: Menggunakan psql (Command Line)**
```bash
psql -U postgres -d sekolah_info -f migration_log_table.sql
```

---

### **LANGKAH 2: Restart Backend** (WAJIB!)

```bash
# Di terminal backend:
Ctrl+C (untuk stop)

# Lalu start lagi:
node server.js
```

**Tunggu sampai muncul:**
```
Server berjalan di http://localhost:3000
Database connected successfully
```

---

### **LANGKAH 3: Refresh Browser**

```
1. Buka browser
2. Hard refresh: Ctrl+Shift+R
3. Atau clear cache dan refresh
```

---

## 🧪 Cara Testing Rollback:

### **Skenario Test:**

#### **1. Lakukan Migrasi Dulu**
```
1. Buka halaman Santri
2. Pilih Tahun Ajaran Berjalan (2026-2027)
3. Klik "Migrasi Tahun Ajaran"
4. Pilih santri yang akan naik kelas
5. Klik "Proses Migrasi"
6. Verifikasi migrasi berhasil
```

**Hasil:**
- Tahun ajaran berjalan berubah ke 2027-2028
- Santri yang dipilih pindah ke tahun baru
- Log migrasi tersimpan di tabel `migration_log`

#### **2. Lakukan Rollback**
```
1. Masih di halaman Santri
2. Klik tombol "Rollback Migrasi" (tombol merah)
3. Konfirmasi dialog akan muncul
4. Klik "OK" untuk konfirmasi
5. Tunggu proses rollback selesai
```

**Hasil yang Diharapkan:**
- Tahun ajaran berjalan kembali ke 2026-2027
- Data santri di tahun 2027-2028 terhapus
- Santri yang tidak naik kelas (status "tidak_naik") kembali ke status "aktif"
- Success message muncul: "Rollback ke tahun ajaran 2026-2027 berhasil. X data dihapus, Y status dikembalikan."

---

## 📸 Screenshot yang Dibutuhkan:

### **Setelah Create Table:**
1. Screenshot pgAdmin/DBeaver showing table `migration_log` berhasil dibuat
2. Screenshot query result: `SELECT * FROM migration_log;` (harus kosong dulu)

### **Setelah Migrasi:**
1. Screenshot backend terminal showing migration logs (termasuk "📝 Saving migration log...")
2. Screenshot query result: `SELECT * FROM migration_log;` (harus ada 1 row)
3. Screenshot halaman Santri di tahun ajaran baru

### **Setelah Rollback:**
1. Screenshot backend terminal showing rollback logs
2. Screenshot query result: `SELECT * FROM migration_log;` (harus kosong lagi)
3. Screenshot halaman Santri di tahun ajaran lama (data kembali)

---

## 🔍 Backend Terminal Logs:

### **Saat Migrasi (dengan logging):**
```
🔍 Migration started: { sourceKode: '2026-2027', targetKode: '2027-2028', excludedCount: 0 }
📝 Creating new tahun ajaran: 2027-2028
✅ Target year created: { ... }
🔄 Executing migration query with params: [...]
✅ Migration query completed. Rows migrated: 8
🔄 Updating year statuses...
✅ Year statuses updated
📝 Saving migration log...
✅ Migration log saved
✅ Migration committed successfully
```

### **Saat Rollback:**
```
🔍 Rollback started for tahun ajaran: 2027-2028
📝 Migration log found: { ... }
🔄 Deleting migrated data from target year...
✅ Deleted migrated data: 8 rows
🔄 Restoring tidak_naik status to aktif...
✅ Restored tidak_naik to aktif: 0 rows
🔄 Restoring year statuses...
✅ Year statuses restored
🔄 Deleting migration log...
✅ Migration log deleted
✅ Rollback committed successfully
```

---

## ⚠️ Catatan Penting:

### **1. Rollback Hanya Bisa Dilakukan Sekali**
- Setelah rollback, log migrasi dihapus
- Tidak bisa rollback lagi kecuali melakukan migrasi baru

### **2. Rollback Menghapus Data**
- Semua data santri di tahun ajaran target akan dihapus
- Pastikan user benar-benar ingin rollback sebelum konfirmasi

### **3. Rollback Hanya untuk Migrasi Terakhir**
- Rollback hanya membatalkan migrasi terakhir
- Tidak bisa rollback migrasi yang sudah lama

### **4. Tombol Rollback Hanya Muncul di Tahun Berjalan**
- Tombol "Rollback Migrasi" hanya enabled di tahun ajaran berjalan
- Disabled di tahun arsip atau coming soon

---

## 🐛 Troubleshooting:

### **Error: "Tidak ada log migrasi untuk tahun ajaran ini."**
**Penyebab:** Belum ada migrasi yang dilakukan, atau log sudah dihapus

**Solusi:** Lakukan migrasi dulu sebelum rollback

### **Error: "relation 'migration_log' does not exist"**
**Penyebab:** Tabel `migration_log` belum dibuat

**Solusi:** Jalankan SQL script dari `migration_log_table.sql`

### **Error: "Gagal rollback migrasi"**
**Penyebab:** Ada error di backend

**Solusi:** 
1. Cek backend terminal untuk error message lengkap
2. Screenshot error dan kirim ke saya

### **Tombol Rollback Tidak Muncul**
**Penyebab:** Frontend belum di-rebuild atau browser masih load file lama

**Solusi:**
1. Pastikan frontend sudah di-rebuild (`npm run build`)
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear cache browser

---

## 📊 Database Schema:

### **Tabel `migration_log`:**
```sql
Column                    | Type      | Description
--------------------------|-----------|----------------------------------
id                        | SERIAL    | Primary key
source_tahun_ajaran_id    | INTEGER   | ID tahun ajaran sumber (lama)
target_tahun_ajaran_id    | INTEGER   | ID tahun ajaran target (baru)
migrated_count            | INTEGER   | Jumlah santri yang dimigrasi
excluded_santri_ids       | INTEGER[] | Array ID santri yang tidak naik
migration_date            | TIMESTAMP | Tanggal migrasi dilakukan
created_at                | TIMESTAMP | Tanggal record dibuat
```

### **Query untuk Cek Log:**
```sql
-- Lihat semua log migrasi
SELECT * FROM migration_log ORDER BY migration_date DESC;

-- Lihat log migrasi terakhir
SELECT * FROM migration_log ORDER BY migration_date DESC LIMIT 1;

-- Lihat log untuk tahun ajaran tertentu
SELECT * FROM migration_log WHERE target_tahun_ajaran_id = 11;
```

---

## ✅ Checklist Setup:

- [ ] Create table `migration_log` di database
- [ ] Verifikasi table berhasil dibuat (`SELECT * FROM migration_log;`)
- [ ] Restart backend (`node server.js`)
- [ ] Refresh browser (Ctrl+Shift+R)
- [ ] Test migrasi (harus ada log di `migration_log`)
- [ ] Test rollback (log harus terhapus, data kembali)
- [ ] Verifikasi tombol "Rollback Migrasi" muncul di UI

---

## 🎯 Status Implementasi:

| Component | Status | File |
|-----------|--------|------|
| Database Table | ✅ READY | `migration_log_table.sql` |
| Backend Endpoint | ✅ DONE | `src/routes/tahunAjaranRoutes.js` |
| Frontend Service | ✅ DONE | `frontend/src/services/santriService.js` |
| Frontend UI | ✅ DONE | `frontend/src/pages/Santri.jsx` |
| Frontend Build | ✅ DONE | Build completed successfully |
| Backend Restart | ⏳ PENDING | User perlu restart |
| Database Setup | ⏳ PENDING | User perlu run SQL script |

---

## 🚀 Next Steps:

1. ✅ **Create table `migration_log`** (run SQL script)
2. ✅ **Restart backend** (`node server.js`)
3. ✅ **Refresh browser** (Ctrl+Shift+R)
4. ✅ **Test migrasi** (untuk generate log)
5. ✅ **Test rollback** (untuk verify fitur bekerja)
6. ✅ **Screenshot dan beri tahu hasilnya**

---

**Dibuat oleh:** Kiro AI Assistant
**Tanggal:** 3 Mei 2026
**Status:** READY TO TEST (after database setup)
