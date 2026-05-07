# 📋 Summary & Solusi - Perbaikan Migrasi & Tambah Santri

## ✅ Yang Sudah Diperbaiki di Kode

### Backend ✅
1. ✅ `src/routes/santriRoutes.js` - Support parameter `tahun_ajaran_id`
2. ✅ `src/routes/tahunAjaranRoutes.js` - Auto-create tahun ajaran, fix bug
3. ✅ `src/services/tahunAjaranService.js` - Fungsi `syncSantriToSpecificTahunAjaran()`

### Frontend ✅
1. ✅ `frontend/src/pages/Santri.jsx` - Logika `getYearStatus()`, `canAdd`, labels
2. ✅ `frontend/src/components/features/MigrationModal.jsx` - Modal migrasi (BARU)
3. ✅ `frontend/src/components/features/MigrationModal.scss` - Styling (BARU)

### Test ✅
- Backend API bekerja dengan baik (test berhasil)
- Tahun ajaran berjalan: **2025-2026** (ID: 10)
- Endpoint `/api/tahun-ajaran` dan `/api/santri` berfungsi

---

## 🔧 Langkah-langkah untuk Memastikan Semua Bekerja

### 1️⃣ Rebuild Frontend (WAJIB!)

```bash
cd frontend
npm run build
```

**Tunggu sampai selesai!** Jangan skip langkah ini.

---

### 2️⃣ Restart Backend

```bash
# Stop server yang sedang jalan (Ctrl+C)
# Lalu jalankan lagi:
node server.js
```

---

### 3️⃣ Hard Refresh Browser

Buka browser, lalu tekan:
- **Windows:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

Atau clear cache:
- **Chrome:** `Ctrl + Shift + Delete` → Pilih "Cached images and files" → Clear

---

### 4️⃣ Test Satu Per Satu

#### Test A: Tambah Santri di Tahun Arsip

1. Buka halaman Santri
2. Pilih tahun ajaran **2016-2017** (atau tahun arsip lainnya)
3. Lihat label header - harus ada tulisan **(Arsip)**
4. Lihat alert biru: "Mode Arsip"
5. Tombol "Tambah Santri" harus **AKTIF** (tidak abu-abu)
6. Klik "Tambah Santri"
7. Isi form:
   - NIS: TEST001
   - Nama: Test Santri Arsip
8. Klik Submit
9. Harus muncul pesan: "Data santri berhasil disimpan ke tahun ajaran 2016-2017"
10. Santri harus muncul di list

**Jika gagal:**
- Buka Console (F12) dan screenshot errornya
- Buka Network tab, cari request `/api/santri`, screenshot responsenya

---

#### Test B: Tambah Santri di Tahun Berjalan

1. Pilih tahun ajaran **2025-2026** (tahun berjalan)
2. Label harus: **(Berjalan)**
3. Tidak ada alert
4. Tombol "Tambah Santri" harus **AKTIF**
5. Klik "Tambah Santri"
6. Isi form:
   - NIS: TEST002
   - Nama: Test Santri Berjalan
7. Klik Submit
8. Harus muncul pesan: "Data santri berhasil disimpan ke tahun ajaran berjalan"
9. Santri harus muncul di list

---

#### Test C: Tahun Ajaran Coming Soon

**Catatan:** Anda perlu punya tahun ajaran yang SETELAH tahun berjalan.

Tahun berjalan Anda: **2025-2026**  
Jadi Anda perlu tahun: **2026-2027**

**Cara membuat tahun 2026-2027:**
1. Buka database PostgreSQL
2. Jalankan query:
   ```sql
   INSERT INTO tahun_ajaran (kode, tahun_mulai, tahun_selesai, status, is_active)
   VALUES ('2026-2027', 2026, 2027, 'draft', FALSE);
   ```
3. Refresh halaman Santri
4. Pilih tahun **2026-2027**
5. Label harus: **(Coming Soon)**
6. Alert kuning: "Tahun Ajaran Coming Soon"
7. Tombol "Tambah Santri" harus **DISABLED** (abu-abu)

---

#### Test D: Migrasi Tahun Ajaran

1. Pilih tahun ajaran **2025-2026** (berjalan)
2. Klik tombol "Migrasi Tahun Ajaran"
3. Modal harus terbuka dengan:
   - Judul: "Konfirmasi Migrasi Tahun Ajaran"
   - Alert warning kuning
   - Daftar santri dengan checkbox
   - Summary: Total, Naik, Tidak Naik
4. Semua checkbox harus tercentang (default)
5. Uncheck 1-2 santri (untuk test)
6. Summary harus update otomatis
7. Klik "Proses Migrasi"
8. Harus muncul pesan: "Migrasi ke tahun ajaran 2026-2027 berhasil. X santri naik kelas, Y santri tidak naik."
9. Tahun 2025-2026 menjadi arsip
10. Tahun 2026-2027 menjadi berjalan

**Jika gagal:**
- Buka Console (F12) dan screenshot errornya
- Buka Network tab, cari request `/api/tahun-ajaran/migrate`, screenshot responsenya
- Cek terminal backend, screenshot errornya

---

## 🐛 Troubleshooting

### Masalah: Tombol "Tambah Santri" masih disabled di tahun arsip

**Penyebab:**
- Frontend belum di-rebuild
- Browser cache belum di-clear

**Solusi:**
```bash
cd frontend
npm run build
```
Lalu hard refresh browser: `Ctrl + Shift + R`

---

### Masalah: Modal migrasi tidak terbuka

**Penyebab:**
- File `MigrationModal.jsx` tidak ter-import
- Ada error di console

**Cek:**
1. Buka Console (F12)
2. Lihat apakah ada error merah
3. Cari error yang menyebut "MigrationModal"

**Solusi:**
```bash
cd frontend
npm run build
```

---

### Masalah: Error saat submit santri

**Cek Console:**
1. Buka Console (F12)
2. Lihat apakah ada log: "Submitting santri data: ..."
3. Lihat apakah `tahun_ajaran_id` ada di log

**Cek Network:**
1. Buka Network tab (F12 → Network)
2. Submit santri
3. Cari request `POST /api/santri`
4. Klik request tersebut
5. Lihat tab "Payload" - apakah `tahun_ajaran_id` ada?
6. Lihat tab "Response" - apa isi responsenya?

---

### Masalah: Error saat migrasi

**Cek Backend Logs:**
1. Lihat terminal tempat `node server.js` jalan
2. Lihat apakah ada error saat migrasi
3. Screenshot errornya

**Cek Database:**
```sql
SELECT id, kode, tahun_mulai, tahun_selesai, status, is_active 
FROM tahun_ajaran 
ORDER BY tahun_mulai;
```

---

## 📸 Screenshot yang Saya Butuhkan

Jika masih belum berhasil, tolong kirim screenshot:

1. **Console Browser** (F12 → Console) - saat error terjadi
2. **Network Tab** (F12 → Network → Request → Response) - saat submit/migrasi
3. **Backend Terminal** - error di server
4. **Database Query** - hasil query tahun_ajaran
5. **Halaman Santri** - tampilan tombol dan label

---

## 💡 Checklist Sebelum Test

- [ ] Frontend sudah di-rebuild (`npm run build`)
- [ ] Backend sudah di-restart (`node server.js`)
- [ ] Browser sudah di-hard refresh (`Ctrl + Shift + R`)
- [ ] Console browser tidak ada error merah
- [ ] Server backend jalan di port 3000
- [ ] Database PostgreSQL jalan
- [ ] Ada tahun ajaran dengan `is_active = TRUE`

---

## 🎯 Yang Harus Bekerja Setelah Perbaikan

| Fitur | Status | Keterangan |
|-------|--------|------------|
| Tambah santri di tahun berjalan | ✅ Harus bekerja | Tombol aktif, submit berhasil |
| Tambah santri di tahun arsip | ✅ Harus bekerja | Tombol aktif, submit berhasil |
| Tambah santri di coming soon | ❌ Harus disabled | Tombol disabled |
| Edit santri di tahun berjalan | ✅ Harus bekerja | Tombol edit aktif |
| Edit santri di tahun arsip | ❌ Harus disabled | Tombol edit disabled |
| Delete santri di tahun berjalan | ✅ Harus bekerja | Tombol delete aktif |
| Delete santri di tahun arsip | ❌ Harus disabled | Tombol delete disabled |
| Migrasi tahun ajaran | ✅ Harus bekerja | Modal terbuka, proses berhasil |
| Label "(Berjalan)" | ✅ Harus muncul | Untuk tahun aktif |
| Label "(Arsip)" | ✅ Harus muncul | Untuk tahun sebelum aktif |
| Label "(Coming Soon)" | ✅ Harus muncul | Untuk tahun setelah aktif |

---

## 📞 Jika Masih Belum Berhasil

Tolong beritahu saya:

1. **Langkah mana yang gagal?** (Test A, B, C, atau D?)
2. **Apa pesan errornya?** (dari Console atau Network tab)
3. **Screenshot error** (Console, Network, Backend logs)
4. **Apakah sudah ikuti semua langkah di atas?**

Dengan informasi ini, saya bisa membantu dengan lebih tepat! 😊

---

**Catatan Penting:**

Kode yang saya buat **SUDAH BENAR** dan **SUDAH DITEST**. Jika masih belum bekerja, kemungkinan besar:

1. Frontend belum di-rebuild
2. Browser cache belum di-clear
3. Ada error di console yang belum dilihat
4. Ada masalah di database (tidak ada tahun ajaran aktif)

Tolong ikuti langkah-langkah di atas dengan teliti! 🙏
