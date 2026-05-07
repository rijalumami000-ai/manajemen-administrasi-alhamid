# ✅ Quick Fix Checklist - Rollback Button

## 🎯 Masalah
Tombol "Rollback Migrasi" tidak muncul di halaman Santri

## 🔧 Solusi Cepat (3 Langkah)

### ☑️ LANGKAH 1: Buat Tabel Database (WAJIB!)

```bash
# Jalankan di terminal:
psql -U postgres -d nama_database -f migration_log_table.sql
```

**Atau** copy-paste SQL ini ke PostgreSQL:
```sql
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  source_tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
  target_tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
  migrated_count INTEGER NOT NULL,
  excluded_santri_ids INTEGER[],
  migration_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### ☑️ LANGKAH 2: Restart Backend

```bash
# Stop backend (Ctrl+C)
# Start lagi:
node server.js
```

### ☑️ LANGKAH 3: Clear Cache Browser

**Cara Paling Ampuh:**
1. Buka browser
2. Tekan `F12` (Developer Tools)
3. **Klik kanan** tombol refresh
4. Pilih **"Empty Cache and Hard Reload"**

**Atau:**
- Tekan `Ctrl + Shift + Delete`
- Pilih "All time"
- Clear cache

**Atau:**
- Buka Incognito Window (`Ctrl + Shift + N`)

---

## ✅ Verifikasi

Setelah 3 langkah di atas, buka halaman Santri.

**Tombol yang harus muncul:**
```
[Rollback Migrasi]  [Migrasi Tahun Ajaran]  [Tambah Santri]
```

---

## 🧪 Test Script (Optional)

Untuk mengecek apakah setup sudah benar:

```bash
node check_rollback_setup.js
```

Script ini akan mengecek:
- ✅ File frontend ada
- ✅ File lama sudah dihapus
- ✅ Backend route ada
- ✅ Tabel database ada

---

## 📚 Dokumentasi Lengkap

Baca `ROLLBACK_BUTTON_FIX.md` untuk penjelasan detail dan troubleshooting.

---

**Update:** 3 Mei 2026, 04:00 AM
