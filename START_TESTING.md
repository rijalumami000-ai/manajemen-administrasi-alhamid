# 🚀 Cara Memulai Testing - Akses UI

## 📍 Langkah-Langkah Akses UI

### LANGKAH 1: Jalankan Migrasi Database

```bash
node migrations/add_tingkat_to_kelas.js up
```

**Tunggu sampai muncul pesan:**
```
✅ Migration completed successfully
```

---

### LANGKAH 2: Pastikan Backend Server Berjalan

#### Cek apakah server sudah berjalan:
```bash
# Cek di terminal apakah ada proses node yang berjalan
# Atau coba akses: http://localhost:3000
```

#### Jika server BELUM berjalan, jalankan:
```bash
node server.js
```

**Output yang diharapkan:**
```
Server berjalan di http://localhost:3000
Database terhubung
```

#### Jika server SUDAH berjalan, RESTART:
```bash
# Tekan Ctrl+C untuk stop
# Kemudian jalankan ulang:
node server.js
```

**⚠️ PENTING:** Backend HARUS di-restart agar service baru (Auto-Advance Engine, Alumni Manager, dll) ter-load!

---

### LANGKAH 3: Rebuild Frontend

```bash
cd frontend
npm run build
```

**Tunggu sampai selesai (biasanya 10-30 detik)**

---

### LANGKAH 4: Copy File Frontend ke Public

```powershell
# Dari root folder project (bukan dari folder frontend)
Copy-Item -Path "frontend/dist/*" -Destination "public/" -Recurse -Force
```

**Atau jika masih di folder frontend:**
```powershell
cd ..
Copy-Item -Path "frontend/dist/*" -Destination "public/" -Recurse -Force
```

---

### LANGKAH 5: Buka Browser

Buka browser dan akses:

```
http://localhost:3000
```

**Atau jika port berbeda, cek di output server:**
```
Server berjalan di http://localhost:[PORT]
```

---

## 🎯 Halaman untuk Testing

### 1. **Halaman Login** (jika ada)
```
http://localhost:3000/login
```

### 2. **Halaman Santri** (Halaman Utama untuk Testing)
```
http://localhost:3000/santri
```

**Di halaman ini Anda akan melihat:**
- ✅ Daftar santri
- ✅ Tombol "Migrasi Tahun Ajaran" (kanan atas)
- ✅ Tombol "Rollback Migrasi" (kanan atas)
- ✅ Tombol "Tambah Santri"
- ✅ Filter dan pencarian

### 3. **Halaman Alumni** (untuk verifikasi)
```
http://localhost:3000/alumni
```

**Di halaman ini Anda akan melihat:**
- ✅ Daftar alumni yang sudah lulus
- ✅ Alumni baru yang dibuat saat migrasi

---

## 🧪 Mulai Testing

### Test Pertama: Buka Modal Migrasi

1. **Buka halaman Santri:** `http://localhost:3000/santri`
2. **Klik tombol "Migrasi Tahun Ajaran"** (tombol biru dengan icon ⇄)
3. **Modal akan muncul** dengan:
   - ✅ Daftar semua santri
   - ✅ Preview kenaikan kelas (Kelas 1 → Kelas SP)
   - ✅ Status kelulusan (🎓 Alumni, 📝 Lulus MTs, 📚 Lulus Diniyah)
   - ✅ Statistik: Total, Naik Kelas, Tidak Naik, Alumni, MTs

**Screenshot yang diharapkan:**
```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Konfirmasi Migrasi Tahun Ajaran                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Anda akan memigrasikan dari 2025-2026 ke 2026-2027│
│                                                      │
│  Total: 50  Naik: 50  Tidak Naik: 0                │
│  🎓 Alumni: 5  📝 MTs: 3                            │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ☑ NIS  Nama    Diniyah      Sekolah    Status│  │
│  │ ☑ 001  Ahmad   1 → SP       7 → 8       -    │  │
│  │ ☑ 002  Fatimah 6 → 🎓 Lulus -           🎓   │  │
│  │ ☑ 003  Umar    5 → 6        9 → 10(MA)  📝   │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [Batal]                    [Proses Migrasi]       │
└─────────────────────────────────────────────────────┘
```

---

## ❌ Troubleshooting

### Masalah 1: "Cannot GET /"
**Penyebab:** Frontend belum di-build atau belum di-copy

**Solusi:**
```bash
cd frontend
npm run build
cd ..
Copy-Item -Path "frontend/dist/*" -Destination "public/" -Recurse -Force
```

---

### Masalah 2: "Server tidak berjalan"
**Penyebab:** Backend belum dijalankan

**Solusi:**
```bash
node server.js
```

---

### Masalah 3: "Tombol Migrasi tidak muncul"
**Penyebab:** 
- Tidak ada tahun ajaran aktif
- Atau Anda sedang melihat tahun ajaran arsip

**Solusi:**
1. Pastikan ada tahun ajaran dengan status "Berjalan"
2. Klik kartu tahun ajaran yang berstatus "Berjalan"
3. Tombol migrasi hanya muncul di tahun ajaran aktif

---

### Masalah 4: "Modal migrasi kosong"
**Penyebab:** Tidak ada santri di tahun ajaran aktif

**Solusi:**
1. Tambah santri terlebih dahulu dengan tombol "Tambah Santri"
2. Atau pilih tahun ajaran yang memiliki santri

---

### Masalah 5: "Error saat migrasi"
**Penyebab:** Backend belum di-restart setelah implementasi

**Solusi:**
```bash
# Stop server (Ctrl+C)
# Jalankan ulang:
node server.js
```

---

## 📸 Screenshot Lokasi Tombol

### Halaman Santri - Tombol Migrasi
```
┌────────────────────────────────────────────────────────┐
│  Manajemen Data Santri                                 │
│  Data Santri Tahun Ajaran 2025-2026 (Berjalan)        │
│                                                         │
│  [Rollback] [Migrasi Tahun Ajaran] [+ Tambah Santri] ← TOMBOL DI SINI
└────────────────────────────────────────────────────────┘
```

### Kartu Tahun Ajaran
```
┌──────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ 2024-2025    │  │ 2025-2026    │  │ 2026-2027  │ │
│  │ Arsip        │  │ Berjalan ✓   │  │ Draft      │ │
│  │ 45 santri    │  │ 50 santri    │  │ 0 santri   │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                       ↑ KLIK DI SINI                  │
└──────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Sebelum Testing

- [ ] Migrasi database berhasil (`node migrations/add_tingkat_to_kelas.js up`)
- [ ] Backend server berjalan (`node server.js`)
- [ ] Frontend sudah di-build (`cd frontend && npm run build`)
- [ ] File frontend sudah di-copy ke public
- [ ] Browser bisa akses `http://localhost:3000`
- [ ] Halaman Santri terbuka dengan benar
- [ ] Ada santri di tahun ajaran aktif
- [ ] Tombol "Migrasi Tahun Ajaran" terlihat

---

## 🎉 Siap Testing!

Jika semua checklist di atas sudah ✅, Anda siap untuk mulai testing!

**Langkah selanjutnya:**
1. Klik tombol "Migrasi Tahun Ajaran"
2. Lihat preview auto-advance
3. Ikuti skenario testing di `TESTING_GUIDE.md`

**Selamat testing! 🚀**
