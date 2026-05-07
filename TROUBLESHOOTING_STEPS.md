# 🔧 Langkah Troubleshooting - IKUTI DENGAN TELITI

## ⚠️ MASALAH YANG TERDETEKSI

Dari screenshot browser console, ada 2 masalah:
1. **401 Unauthorized** di `/api/auth/me:1` - Masalah autentikasi/session
2. **500 Internal Server Error** di `/api/tahun-ajaran/migrate` - Masalah migrasi

---

## 📋 LANGKAH 1: CLEAR SEMUA CACHE & SESSION

### A. Clear Browser Cache & Cookies
1. Buka browser (Chrome/Edge)
2. Tekan **Ctrl+Shift+Delete**
3. Pilih:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
   - Time range: **All time**
4. Klik **Clear data**
5. **TUTUP BROWSER SEPENUHNYA** (semua tab dan window)

### B. Clear Node Modules Cache (Opsional tapi Disarankan)
```bash
# Di folder frontend
cd frontend
rm -rf node_modules/.vite
rm -rf dist
```

---

## 📋 LANGKAH 2: RESTART BACKEND DENGAN BENAR

### A. Stop Backend
1. Di terminal backend, tekan **Ctrl+C**
2. Tunggu sampai benar-benar berhenti
3. Pastikan tidak ada proses Node.js yang masih berjalan:
   ```bash
   # Windows PowerShell
   Get-Process node
   
   # Jika ada, kill semua:
   Stop-Process -Name node -Force
   ```

### B. Start Backend Lagi
```bash
# Di root folder project
node server.js
```

### C. Verifikasi Backend Berjalan
Harus muncul log seperti ini:
```
Server berjalan di http://localhost:3000
Database connected successfully
```

**JANGAN LANJUT** sebelum backend benar-benar berjalan!

---

## 📋 LANGKAH 3: REBUILD FRONTEND (SUDAH DILAKUKAN, TAPI PASTIKAN)

```bash
cd frontend
npm run build
```

Tunggu sampai selesai. Harus ada output:
```
✓ built in XX.XXs
```

---

## 📋 LANGKAH 4: LOGIN ULANG

1. Buka browser BARU (setelah clear cache)
2. Buka `http://localhost:3000`
3. **LOGIN ULANG** dengan username dan password
4. Jangan langsung ke halaman Santri, tunggu sampai dashboard muncul

---

## 📋 LANGKAH 5: TEST TAMBAH SANTRI

### A. Persiapan
1. Buka halaman Santri
2. Pilih **Tahun Ajaran Arsip** (misalnya 2019-2020)
3. Buka **Developer Tools** (F12)
4. Pilih tab **Console**
5. Clear console (klik icon 🚫 atau Ctrl+L)

### B. Tambah Santri
1. Klik tombol **"Tambah Santri"**
2. Isi form dengan data test:
   - NIS: `TEST001`
   - Nama: `Test Santri`
   - (isi field lainnya sesuai kebutuhan)
3. Klik **Submit**

### C. Cek Console Log
Di browser console, HARUS ada log seperti ini:
```
🔍 DEBUG - handleModalSubmit: {
  selectedTahunAjaranId: "X",
  targetTahunAjaranId: X,
  selectedYear: { id: X, kode: "2019-2020", ... }
}
📤 Submitting santri data: { ..., tahun_ajaran_id: X }
```

### D. Cek Backend Terminal
Di backend terminal, HARUS ada log seperti ini:
```
📝 POST /api/santri - Received data: { nis: 'TEST001', nama: 'Test Santri', tahun_ajaran_id: X }
✅ Santri created with ID: XX
🔄 Syncing to specific tahun_ajaran_id: X
📌 syncSantriToSpecificTahunAjaran called: { santriId: XX, tahunAjaranId: X }
✅ Inserted/Updated santri_tahun_ajaran: { ... }
✅ Synced to tahun_ajaran_id: X
```

### E. Screenshot yang Dibutuhkan
Jika masih error, ambil screenshot:
1. **Browser Console** (F12 → Console tab) - FULL LOG
2. **Backend Terminal** - FULL LOG dari saat submit
3. **Network Tab** (F12 → Network tab) - Klik request yang error, screenshot **Response** tab

---

## 📋 LANGKAH 6: TEST MIGRASI

### A. Persiapan
1. Pastikan ada data santri di tahun ajaran berjalan
2. Buka halaman Santri
3. Pilih **Tahun Ajaran Berjalan**
4. Clear browser console (Ctrl+L)
5. Clear backend terminal (atau scroll ke bawah untuk lihat log baru)

### B. Proses Migrasi
1. Klik tombol **"Migrasi Tahun Ajaran"**
2. Modal harus muncul dengan daftar santri
3. Pilih santri yang akan naik kelas (centang = naik)
4. Klik **"Proses Migrasi"**

### C. Cek Backend Terminal
HARUS ada log seperti ini:
```
🔍 Migration started: { sourceKode: '2024-2025', targetKode: '2025-2026', excludedCount: 0 }
📝 Creating new tahun ajaran: 2025-2026
✅ Target year created: { id: X, kode: '2025-2026', ... }
📝 Exclusion placeholders: $4, $5, $6 (jika ada excluded)
🔄 Executing migration query with params: [...]
✅ Migration query completed. Rows migrated: XX
✅ Marked as tidak_naik: X (jika ada)
✅ Year statuses updated
✅ Migration committed successfully
```

### D. Jika Ada Error 500
Di backend terminal, akan ada log:
```
❌ Migration error: [ERROR MESSAGE]
❌ Error stack: [STACK TRACE]
```

**SCREENSHOT ERROR INI!** Ini yang paling penting untuk debugging.

---

## 🚨 KEMUNGKINAN MASALAH & SOLUSI

### Masalah 1: 401 Unauthorized
**Penyebab:** Session expired atau cookie tidak tersimpan
**Solusi:**
1. Clear browser cache & cookies (Langkah 1)
2. Login ulang (Langkah 4)
3. Pastikan `credentials: 'include'` ada di semua fetch request (sudah ada)

### Masalah 2: Data Masih Masuk ke Tahun Berjalan
**Penyebab:** Frontend lama masih di-cache
**Solusi:**
1. Hard refresh: **Ctrl+Shift+R** (bukan Ctrl+R biasa!)
2. Atau clear cache seperti Langkah 1
3. Pastikan di console ada log `🔍 DEBUG - handleModalSubmit:`

### Masalah 3: Migration Error 500
**Kemungkinan Penyebab:**
- SQL syntax error (sudah diperbaiki tapi perlu restart backend)
- Database constraint violation
- Data tidak valid

**Solusi:**
1. Pastikan backend sudah di-restart (Langkah 2)
2. Cek backend terminal untuk error message lengkap
3. Screenshot error dan kirim ke saya

### Masalah 4: Frontend Tidak Berubah
**Penyebab:** Browser masih load file lama dari cache
**Solusi:**
1. Clear cache (Langkah 1)
2. Hard refresh (Ctrl+Shift+R)
3. Buka Incognito/Private window untuk test
4. Cek di Network tab (F12) apakah file JS di-load ulang

---

## 📸 SCREENSHOT YANG DIBUTUHKAN JIKA MASIH ERROR

### Untuk Issue Tambah Santri:
1. **Browser Console** (F12 → Console):
   - Harus menunjukkan log `🔍 DEBUG - handleModalSubmit:`
   - Harus menunjukkan nilai `targetTahunAjaranId` dan `selectedYear`
   
2. **Backend Terminal**:
   - Harus menunjukkan log `📝 POST /api/santri`
   - Harus menunjukkan log `🔄 Syncing to specific tahun_ajaran_id:`
   - Harus menunjukkan log `📌 syncSantriToSpecificTahunAjaran called:`
   - Harus menunjukkan log `✅ Synced to tahun_ajaran_id:`

3. **Network Tab** (F12 → Network):
   - Klik request POST `/api/santri`
   - Screenshot tab **Payload** (untuk lihat data yang dikirim)
   - Screenshot tab **Response** (untuk lihat response dari server)

### Untuk Issue Migrasi:
1. **Backend Terminal** - FULL ERROR LOG:
   - Harus menunjukkan log `🔍 Migration started:`
   - Jika error, harus ada `❌ Migration error:` dan `❌ Error stack:`
   
2. **Browser Console** (F12 → Console):
   - Lihat apakah ada error JavaScript
   
3. **Network Tab** (F12 → Network):
   - Klik request POST `/api/tahun-ajaran/migrate`
   - Screenshot tab **Payload** (untuk lihat data yang dikirim)
   - Screenshot tab **Response** (untuk lihat error message dari server)

---

## ✅ CHECKLIST SEBELUM LAPOR ERROR

Sebelum kirim screenshot, pastikan sudah:
- [ ] Clear browser cache & cookies (Ctrl+Shift+Delete)
- [ ] Tutup dan buka browser lagi
- [ ] Stop backend (Ctrl+C) dan start lagi (`node server.js`)
- [ ] Rebuild frontend (`cd frontend && npm run build`)
- [ ] Login ulang ke aplikasi
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Buka Developer Tools (F12) sebelum test
- [ ] Clear console log sebelum test (Ctrl+L)

---

## 🎯 YANG PALING PENTING

**JANGAN SKIP LANGKAH 1 (Clear Cache)!**

Masalah cache adalah masalah paling umum. Browser akan terus load file JavaScript lama dari cache meskipun sudah rebuild. Ini menyebabkan:
- Frontend tidak berubah meskipun sudah rebuild
- Bug lama masih muncul
- Log debug tidak muncul

**SOLUSI PASTI:**
1. Clear cache (Ctrl+Shift+Delete)
2. Tutup browser sepenuhnya
3. Buka browser lagi
4. Login ulang
5. Hard refresh (Ctrl+Shift+R)

Atau test di **Incognito/Private Window** untuk memastikan tidak ada cache.

---

**Dibuat oleh:** Kiro AI Assistant
**Tanggal:** 3 Mei 2026
