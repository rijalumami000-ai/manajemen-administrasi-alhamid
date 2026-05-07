# 🔍 Debug Guide - Perbaikan Migrasi & Tambah Santri

## Langkah-langkah Debug

### 1️⃣ Cek Browser Console

Buka halaman Santri, lalu buka **Developer Tools** (F12), dan lihat tab **Console**.

**Yang harus dicek:**
- Apakah ada error merah?
- Apakah ada warning kuning?
- Screenshot error dan kirim ke saya

---

### 2️⃣ Test Tambah Santri di Tahun Arsip

**Langkah:**
1. Buka halaman Santri
2. Pilih tahun ajaran ARSIP (misal: 2019-2020)
3. Lihat label di header - apakah ada tulisan **(Arsip)**?
4. Lihat tombol "Tambah Santri" - apakah AKTIF atau DISABLED?
5. Jika DISABLED, buka Console (F12) dan ketik:
   ```javascript
   console.log('yearStatus:', yearStatus);
   console.log('canAdd:', canAdd);
   ```
6. Screenshot hasilnya

**Jika tombol AKTIF:**
1. Klik "Tambah Santri"
2. Isi form (minimal NIS dan Nama)
3. Klik Submit
4. Lihat di Console - apakah ada log:
   ```
   Submitting santri data: { ..., tahun_ajaran_id: ... }
   ```
5. Apakah ada error? Screenshot errornya

---

### 3️⃣ Test Migrasi Tahun Ajaran

**Langkah:**
1. Pastikan Anda di tahun ajaran BERJALAN
2. Klik tombol "Migrasi Tahun Ajaran"
3. Apakah modal terbuka? 
   - Jika TIDAK, buka Console dan lihat error
4. Jika modal terbuka:
   - Apakah ada daftar santri?
   - Apakah ada checkbox?
   - Apakah ada summary (Total, Naik, Tidak Naik)?
5. Uncheck beberapa santri
6. Klik "Proses Migrasi"
7. Lihat di Console - apakah ada error?
8. Lihat di Network tab (F12 → Network):
   - Cari request ke `/api/tahun-ajaran/migrate`
   - Klik request tersebut
   - Lihat tab "Response" - apa isi responsenya?
   - Screenshot responsenya

---

### 4️⃣ Test Label Coming Soon

**Langkah:**
1. Buka halaman Santri
2. Lihat daftar tahun ajaran di board
3. Pilih tahun ajaran yang SETELAH tahun berjalan
   - Misal: Jika tahun berjalan 2024-2025, pilih 2025-2026
4. Lihat label di header - apakah ada tulisan **(Coming Soon)**?
5. Apakah ada alert kuning dengan pesan "Tahun Ajaran Coming Soon"?
6. Lihat tombol "Tambah Santri" - apakah DISABLED?

**Jika label masih (Arsip):**
1. Buka Console (F12)
2. Ketik:
   ```javascript
   console.log('activeTahunAjaran:', activeTahunAjaran);
   console.log('selectedYear:', selectedYear);
   console.log('yearStatus:', yearStatus);
   ```
3. Screenshot hasilnya

---

### 5️⃣ Cek Backend Logs

**Langkah:**
1. Buka terminal tempat server Node.js berjalan
2. Lihat apakah ada error saat:
   - Tambah santri
   - Migrasi tahun ajaran
3. Screenshot error di terminal

---

### 6️⃣ Cek Database

**Langkah:**
1. Buka database PostgreSQL
2. Jalankan query:
   ```sql
   SELECT id, kode, tahun_mulai, tahun_selesai, status, is_active 
   FROM tahun_ajaran 
   ORDER BY tahun_mulai;
   ```
3. Screenshot hasilnya
4. Lihat apakah ada tahun ajaran dengan `is_active = TRUE`

---

## 🐛 Error yang Mungkin Terjadi

### Error 1: Tombol "Tambah Santri" masih disabled di tahun arsip

**Penyebab:**
- Frontend belum di-rebuild setelah perubahan
- Browser cache belum di-clear

**Solusi:**
```bash
# Di folder frontend
npm run build

# Atau jika pakai dev server
npm run dev
```

Lalu **hard refresh** browser: `Ctrl + Shift + R` (Windows) atau `Cmd + Shift + R` (Mac)

---

### Error 2: Modal migrasi tidak terbuka

**Penyebab:**
- Komponen MigrationModal belum ter-import
- Ada error di console

**Solusi:**
1. Cek Console browser untuk error
2. Pastikan file `frontend/src/components/features/MigrationModal.jsx` ada
3. Rebuild frontend

---

### Error 3: Error saat submit santri

**Penyebab:**
- Parameter `tahun_ajaran_id` tidak terkirim
- Backend tidak menerima parameter

**Solusi:**
1. Cek Console browser - lihat log "Submitting santri data"
2. Cek apakah `tahun_ajaran_id` ada di log
3. Cek Network tab - lihat request body
4. Cek backend logs - lihat apakah ada error

---

### Error 4: Error saat migrasi

**Penyebab:**
- Tahun ajaran target gagal dibuat
- Query SQL error
- Placeholder bug

**Solusi:**
1. Cek backend logs di terminal
2. Lihat error message lengkap
3. Cek database - apakah tahun ajaran baru terbuat?

---

## 📝 Informasi yang Saya Butuhkan

Tolong berikan informasi berikut agar saya bisa membantu:

1. **Screenshot Console Browser** (F12 → Console)
2. **Screenshot Network Tab** saat submit/migrasi (F12 → Network)
3. **Screenshot Backend Logs** di terminal
4. **Screenshot Database** (query tahun_ajaran)
5. **Pesan error spesifik** yang muncul
6. **Langkah yang Anda lakukan** sebelum error terjadi

---

## 🔧 Quick Fix Commands

### Rebuild Frontend
```bash
cd frontend
npm run build
```

### Restart Backend
```bash
# Stop server (Ctrl+C)
node server.js
```

### Clear Browser Cache
- Chrome: `Ctrl + Shift + Delete` → Clear cache
- Atau hard refresh: `Ctrl + Shift + R`

### Check if Server Running
```bash
# Windows
netstat -ano | findstr :3000

# Jika ada, kill process
taskkill /PID <PID> /F
```

---

## 💡 Tips

1. **Selalu cek Console browser** - 90% error terlihat di sini
2. **Cek Network tab** - Lihat request/response API
3. **Cek backend logs** - Lihat error di server
4. **Hard refresh browser** - Setelah rebuild frontend
5. **Restart server** - Setelah ubah backend

---

Silakan ikuti langkah-langkah di atas dan beritahu saya:
- **Error spesifik apa yang terjadi?**
- **Di langkah mana error terjadi?**
- **Screenshot error yang muncul**

Dengan informasi ini, saya bisa membantu memperbaiki dengan tepat! 😊
