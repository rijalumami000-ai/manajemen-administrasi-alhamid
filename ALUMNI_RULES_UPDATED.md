# 📋 Aturan Alumni - Updated

## ✅ Aturan Baru (Sudah Diterapkan)

### 🎓 Alumni Status

**Alumni HANYA jika:**
- Diniyah Kelas 6 **DAN** Sekolah Kelas 12 (keduanya lulus)

### 📝 Status "Lulus" (Bukan Alumni)

Santri akan mendapat status "lulus" dan catatan, tapi **TETAP MIGRASI** ke tahun berikutnya:

| No | Diniyah | Sekolah | Status | Catatan | Migrasi? | Alumni? |
|----|---------|---------|--------|---------|----------|---------|
| 1  | 6       | -       | lulus  | Lulus Diniyah | ✅ Ya | ❌ Tidak |
| 2  | -       | 9       | lulus  | Lulus MTs | ✅ Ya | ❌ Tidak |
| 3  | -       | 12      | lulus  | Lulus MA | ✅ Ya | ❌ Tidak |
| 4  | 5       | 9       | lulus  | Lulus MTs | ✅ Ya | ❌ Tidak |
| 5  | 3       | 12      | lulus  | Lulus MA | ✅ Ya | ❌ Tidak |
| 6  | 1       | 7       | aktif  | - | ✅ Ya | ❌ Tidak |
| 7  | 4       | 8       | aktif  | - | ✅ Ya | ❌ Tidak |
| 8  | 3       | 11      | aktif  | - | ✅ Ya | ❌ Tidak |
| 9  | 6       | 9       | lulus  | Lulus Diniyah, Lulus MTs | ✅ Ya | ❌ Tidak |
| 10 | 6       | 8       | lulus  | Lulus Diniyah | ✅ Ya | ❌ Tidak |
| 11 | 6       | 11      | lulus  | Lulus Diniyah | ✅ Ya | ❌ Tidak |
| 12 | 6       | 12      | alumni | Lulus Diniyah, Lulus MA | ❌ Tidak | ✅ **YA** |
| 13 | -       | -       | aktif  | - | ✅ Ya | ❌ Tidak |

---

## 🔄 Perubahan dari Aturan Lama

### Aturan Lama (Salah):
- ❌ Diniyah 6 (tanpa Sekolah) → Alumni
- ❌ Sekolah 9 → Lulus MTs, lanjut ke MA
- ❌ Sekolah 12 → Alumni

### Aturan Baru (Benar):
- ✅ Diniyah 6 (tanpa Sekolah) → **Lulus Diniyah** (bukan alumni, tetap migrasi)
- ✅ Sekolah 9 → **Lulus MTs** (bukan alumni, tetap migrasi)
- ✅ Sekolah 12 → **Lulus MA** (bukan alumni, tetap migrasi)
- ✅ Diniyah 6 + Sekolah 12 → **Alumni** (tidak migrasi)

---

## 📊 Contoh Skenario

### Skenario 1: Santri Diniyah Saja
**Data:**
- Diniyah: Kelas 6
- Sekolah: -

**Hasil Migrasi:**
- Status di tahun lama: `lulus`
- Catatan di tahun lama: `Lulus Diniyah`
- **Migrasi ke tahun baru:** ✅ Ya
- Diniyah di tahun baru: Kelas 6 (tetap)
- Alumni: ❌ Tidak

---

### Skenario 2: Santri Lulus MTs
**Data:**
- Diniyah: Kelas 5
- Sekolah: Kelas 9

**Hasil Migrasi:**
- Status di tahun lama: `lulus`
- Catatan di tahun lama: `Lulus MTs`
- **Migrasi ke tahun baru:** ✅ Ya
- Diniyah di tahun baru: Kelas 6
- Sekolah di tahun baru: Kelas 10 (MA)
- Alumni: ❌ Tidak

---

### Skenario 3: Santri Lulus MA (tanpa Diniyah 6)
**Data:**
- Diniyah: Kelas 3
- Sekolah: Kelas 12

**Hasil Migrasi:**
- Status di tahun lama: `lulus`
- Catatan di tahun lama: `Lulus MA`
- **Migrasi ke tahun baru:** ✅ Ya
- Diniyah di tahun baru: Kelas 4
- Sekolah di tahun baru: Kelas 12 (tetap)
- Alumni: ❌ Tidak

---

### Skenario 4: Santri Lulus Diniyah + MTs
**Data:**
- Diniyah: Kelas 6
- Sekolah: Kelas 9

**Hasil Migrasi:**
- Status di tahun lama: `lulus`
- Catatan di tahun lama: `Lulus Diniyah, Lulus MTs`
- **Migrasi ke tahun baru:** ✅ Ya
- Diniyah di tahun baru: Kelas 6 (tetap)
- Sekolah di tahun baru: Kelas 10 (MA)
- Alumni: ❌ Tidak

---

### Skenario 5: Santri Lulus Diniyah + MA (ALUMNI!)
**Data:**
- Diniyah: Kelas 6
- Sekolah: Kelas 12

**Hasil Migrasi:**
- Status di tahun lama: `alumni`
- Catatan di tahun lama: `Lulus Diniyah, Lulus MA`
- **Migrasi ke tahun baru:** ❌ Tidak
- Record di tabel alumni: ✅ Ya
- Alumni status: `Alumni - Lulus Diniyah & MA`
- Alumni: ✅ **YA**

---

## 🎯 Logika Implementasi

```javascript
// Alumni ONLY if both Diniyah 6 AND Sekolah 12
if (diniyahTingkat === 6 && sekolahTingkat === 12) {
  // Become Alumni
  // Don't migrate to next year
  // Create alumni record
}
// Otherwise, mark as "Lulus" but continue migration
else {
  // Check individual completions
  if (diniyahTingkat === 6) {
    // Add "Lulus Diniyah" to catatan
  }
  if (sekolahTingkat === 9) {
    // Add "Lulus MTs" to catatan
  }
  if (sekolahTingkat === 12) {
    // Add "Lulus MA" to catatan
  }
  
  // Update status to "lulus" in source year
  // Migrate to next year
}
```

---

## 🚀 Cara Testing

### LANGKAH 1: Restart Backend

```bash
# Ctrl+C untuk stop
node server.js
```

### LANGKAH 2: Siapkan Data Test

Buat santri dengan berbagai kombinasi:
1. Diniyah 6, Sekolah - (harus lulus, bukan alumni)
2. Diniyah -, Sekolah 9 (harus lulus MTs, bukan alumni)
3. Diniyah -, Sekolah 12 (harus lulus MA, bukan alumni)
4. Diniyah 6, Sekolah 12 (harus jadi alumni!)

### LANGKAH 3: Coba Migrasi

1. Klik "Migrasi Tahun Ajaran"
2. Lihat preview (harus sesuai aturan baru)
3. Klik "Proses Migrasi"

### LANGKAH 4: Verifikasi

**Untuk Santri Diniyah 6 + Sekolah 12:**
- ✅ Jadi alumni
- ✅ Tidak muncul di tahun baru
- ✅ Muncul di halaman Alumni

**Untuk Santri Lainnya:**
- ✅ Status "lulus" di tahun lama
- ✅ Catatan sesuai (Lulus Diniyah, Lulus MTs, Lulus MA)
- ✅ **Tetap muncul di tahun baru**
- ✅ Tidak jadi alumni

---

## 📝 Catatan Penting

1. **Santri yang "Lulus" tetap migrasi** - Ini berbeda dari aturan lama!
2. **Alumni HANYA Diniyah 6 + Sekolah 12** - Kombinasi lengkap
3. **Status "lulus" di tahun lama** - Untuk tracking siapa yang sudah lulus apa
4. **Catatan detail** - Mencatat semua kelulusan (Diniyah, MTs, MA)

---

## ✅ Status

**Implementasi:** ✅ Selesai  
**Testing:** ⏳ Pending (restart backend & test)  
**Production Ready:** ✅ Ya (setelah testing)

---

**Next Step:** Restart backend dan test dengan berbagai skenario! 🚀
