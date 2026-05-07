# 🔍 Debug Migration Error

## Error yang Terlihat
Dari screenshot Network tab:
```json
{"error":"Gagal migrasi tahun ajaran."}
```

Ini adalah error message generic dari catch block.

---

## 🚨 YANG HARUS DILAKUKAN SEKARANG

### **PALING PENTING: Lihat Backend Terminal!**

Saat kamu klik "Proses Migrasi", di **backend terminal** HARUS ada log.

**Jika TIDAK ADA LOG SAMA SEKALI** = Backend belum di-restart dengan benar!

**Jika ADA LOG** = Screenshot SEMUA LOG yang muncul!

---

## 📋 Cara Restart Backend yang BENAR

### Langkah 1: Stop Backend
```bash
# Di terminal backend, tekan Ctrl+C
# Tunggu sampai muncul prompt lagi (biasanya C:\...)
```

### Langkah 2: Cek Apakah Masih Ada Proses Node.js
```powershell
# Di PowerShell atau terminal baru:
Get-Process node

# Jika ada output, kill semua:
Stop-Process -Name node -Force
```

### Langkah 3: Start Backend Lagi
```bash
# Di folder root project:
node server.js
```

### Langkah 4: Verifikasi Backend Berjalan
Harus muncul log seperti ini:
```
Server berjalan di http://localhost:3000
Database connected successfully
```

**JANGAN LANJUT** sebelum melihat log ini!

---

## 🧪 Test Migration Lagi

### Langkah 1: Buka Browser (Incognito)
```
Ctrl+Shift+N (Chrome) atau Ctrl+Shift+P (Edge)
```

### Langkah 2: Login
```
http://localhost:3000
Login dengan username dan password
```

### Langkah 3: Buka Halaman Santri
```
Pilih Tahun Ajaran Berjalan
```

### Langkah 4: Klik "Migrasi Tahun Ajaran"
```
Modal harus muncul dengan daftar santri
```

### Langkah 5: Pilih Santri dan Klik "Proses Migrasi"
```
Centang semua santri (atau pilih beberapa)
Klik "Proses Migrasi"
```

### Langkah 6: LIHAT BACKEND TERMINAL!
**INI YANG PALING PENTING!**

Di backend terminal, HARUS ada log seperti ini:
```
🔍 Migration started: { sourceKode: '...', targetKode: '...', excludedCount: ... }
📝 Creating new tahun ajaran: ... (jika tahun target belum ada)
✅ Target year created: ... (jika tahun target baru dibuat)
📝 Exclusion placeholders: ... (jika ada santri yang tidak naik)
🔄 Executing migration query with params: [...]
✅ Migration query completed. Rows migrated: XX
✅ Marked as tidak_naik: X (jika ada)
✅ Year statuses updated
✅ Migration committed successfully
```

**ATAU jika error:**
```
🔍 Migration started: ...
❌ Migration error: [ERROR MESSAGE]  <-- INI YANG PENTING!
❌ Error stack: [STACK TRACE]
```

---

## 📸 Screenshot yang Dibutuhkan

### 1. Backend Terminal (WAJIB!)
Screenshot SEMUA LOG yang muncul saat klik "Proses Migrasi"

Jika TIDAK ADA LOG SAMA SEKALI, screenshot terminal yang menunjukkan:
- Backend sedang berjalan
- Tidak ada log saat klik "Proses Migrasi"

### 2. Browser Console (F12 → Console)
Screenshot semua log/error yang muncul

### 3. Network Tab (F12 → Network)
Screenshot tab **Payload** dari request `migrate` untuk lihat data yang dikirim

---

## 🔍 Kemungkinan Masalah

### Masalah 1: Backend Belum Di-Restart
**Gejala:** Tidak ada log di backend terminal saat klik "Proses Migrasi"

**Solusi:**
1. Stop backend (Ctrl+C)
2. Kill semua proses node: `Stop-Process -Name node -Force`
3. Start lagi: `node server.js`
4. Verifikasi ada log "Server berjalan di http://localhost:3000"

### Masalah 2: File Lama Masih Di-Load
**Gejala:** Backend terminal ada log tapi masih error

**Solusi:**
1. Pastikan file `src/routes/tahunAjaranRoutes.js` sudah benar
2. Cek dengan command:
   ```powershell
   Get-Content src/routes/tahunAjaranRoutes.js | Select-String -Pattern "placeholders.*map" -Context 2
   ```
3. Harus ada: `const placeholders = excludedSantriIds.map((_, i) => \`$${i + 4}\`).join(', ');`
4. Perhatikan ada **$** sebelum `${i + 4}`

### Masalah 3: SQL Error
**Gejala:** Backend terminal ada log error dengan stack trace

**Solusi:**
1. Screenshot error lengkap
2. Kirim ke saya untuk analisis

### Masalah 4: Database Connection Error
**Gejala:** Error "connection refused" atau "database error"

**Solusi:**
1. Cek apakah PostgreSQL berjalan
2. Cek file `.env` untuk connection string
3. Test connection dengan:
   ```bash
   node -e "const db = require('./db'); db.query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0])).catch(e => console.error('DB Error:', e));"
   ```

---

## 🎯 Action Items

**SEKARANG:**
1. ✅ Stop backend (Ctrl+C)
2. ✅ Kill proses node: `Stop-Process -Name node -Force`
3. ✅ Start backend: `node server.js`
4. ✅ Verifikasi ada log "Server berjalan..."
5. ✅ Test migration di Incognito window
6. ✅ **LIHAT BACKEND TERMINAL** saat klik "Proses Migrasi"
7. ✅ Screenshot backend terminal (WAJIB!)

**Tanpa screenshot backend terminal, saya tidak bisa tahu error yang sebenarnya!**

---

## 💡 Tips

### Cara Mudah Lihat Log Backend:
1. Buka terminal backend
2. Scroll ke bawah (atau clear terminal dengan `cls`)
3. Klik "Proses Migrasi" di browser
4. Lihat terminal - harus ada log baru muncul
5. Screenshot SEMUA log yang muncul

### Jika Tidak Ada Log:
Berarti request tidak sampai ke backend. Kemungkinan:
- Backend belum di-restart
- Backend crash
- Port salah
- Authentication error (401) menghalangi request

---

**Dibuat oleh:** Kiro AI Assistant
**Tanggal:** 3 Mei 2026
