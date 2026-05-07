# 🧪 Instruksi Test Ulang

## ✅ Yang Sudah Diperbaiki:

1. ✅ **Logging ditambahkan** - Sekarang kita bisa lihat di terminal backend apa yang terjadi
2. ✅ **Bug placeholder di migrasi** - Sudah diperbaiki (tanda $ ditambahkan)

---

## 🔄 Langkah Test:

### 1️⃣ Restart Backend

```bash
# Stop server (Ctrl+C)
# Lalu jalankan lagi:
node server.js
```

---

### 2️⃣ Test Tambah Santri di Tahun Arsip

**Langkah:**
1. Buka halaman Santri
2. Pilih tahun ajaran **2016-2017** (arsip)
3. Klik "Tambah Santri"
4. Isi form:
   - NIS: TEST-ARSIP-001
   - Nama: Test Santri Arsip 2016
5. Klik Submit

**Yang Harus Dilihat:**
1. **Di Browser Console (F12 → Console):**
   - Lihat apakah ada log: "Submitting santri data: ..."
   - Lihat nilai `tahun_ajaran_id` - harus sesuai dengan tahun 2016-2017

2. **Di Terminal Backend:**
   - Lihat log: "📝 POST /api/santri - Received data:"
   - Lihat nilai `tahun_ajaran_id` - harus sesuai dengan tahun 2016-2017
   - Lihat log: "🔄 Syncing to specific tahun_ajaran_id: ..."
   - Lihat log: "✅ Synced to tahun_ajaran_id: ..."
   - Lihat log: "📌 syncSantriToSpecificTahunAjaran called:"
   - Lihat log: "✅ Inserted/Updated santri_tahun_ajaran:"

3. **Screenshot semua log** dan kirim ke saya

---

### 3️⃣ Test Migrasi Tahun Ajaran

**Langkah:**
1. Pilih tahun ajaran **2025-2026** (berjalan)
2. Klik "Migrasi Tahun Ajaran"
3. Modal terbuka
4. Uncheck 1-2 santri (untuk test)
5. Klik "Proses Migrasi"

**Yang Harus Dilihat:**
1. **Di Browser Console (F12 → Console):**
   - Lihat apakah ada error

2. **Di Browser Network Tab (F12 → Network):**
   - Cari request `POST /api/tahun-ajaran/migrate`
   - Klik request tersebut
   - Lihat tab "Response" - apa isi responsenya?
   - Screenshot responsenya

3. **Di Terminal Backend:**
   - Lihat apakah ada error
   - Lihat log: "Creating new tahun ajaran: ..." (jika tahun target belum ada)
   - Lihat log: "Migration error: ..." (jika ada error)
   - Screenshot semua log

---

## 📸 Screenshot yang Dibutuhkan:

Tolong kirim screenshot:

1. **Browser Console** - saat tambah santri
2. **Terminal Backend** - saat tambah santri (harus ada log dengan emoji 📝, 🔄, ✅, 📌)
3. **Browser Network Tab** - saat migrasi (tab Response)
4. **Terminal Backend** - saat migrasi (jika ada error)

---

## 🎯 Yang Harus Terjadi:

### Tambah Santri di Tahun Arsip:
- ✅ Data masuk ke tahun ajaran yang dipilih (bukan tahun berjalan)
- ✅ Di terminal backend ada log yang jelas
- ✅ Success message muncul

### Migrasi Tahun Ajaran:
- ✅ Proses berhasil tanpa error
- ✅ Santri yang dipilih pindah ke tahun baru
- ✅ Santri yang tidak dipilih tetap dengan status "tidak_naik"
- ✅ Success message muncul

---

## 💡 Jika Masih Error:

Tolong beritahu saya:
1. **Error message lengkap** dari terminal backend
2. **Screenshot semua log** yang muncul
3. **Response dari Network tab** (jika ada error)

Dengan log yang lengkap, saya bisa tahu persis masalahnya! 😊
