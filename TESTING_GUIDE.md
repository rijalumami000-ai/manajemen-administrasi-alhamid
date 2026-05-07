# 🧪 Panduan Testing: Smart Migration with Auto-Advance & Alumni Management

## 📋 Persiapan Sebelum Testing

### LANGKAH 1: Jalankan Migrasi Database

Tambahkan kolom `tingkat` ke tabel `kelas`:

```bash
node migrations/add_tingkat_to_kelas.js up
```

**Output yang diharapkan:**
```
📝 Adding tingkat column to kelas table...
✅ Column added
📝 Updating Diniyah classes...
✅ Diniyah classes updated
📝 Updating Sekolah classes...
✅ Sekolah classes updated
📝 Verifying tingkat assignments...
✅ All classes have tingkat assigned
📝 Adding NOT NULL constraint...
✅ NOT NULL constraint added
📝 Creating index on (jenis, tingkat)...
✅ Index created
✅ Migration completed successfully

📊 Summary of tingkat assignments:
   Diniyah tingkat 0: X class(es)
   Diniyah tingkat 1: X class(es)
   ...
```

**Jika ada error "Some classes do not have tingkat assigned":**
- Cek kelas mana yang belum ter-assign
- Update manual di database atau sesuaikan nama kelas

---

### LANGKAH 2: Restart Backend Server

```bash
# Hentikan server yang sedang berjalan (Ctrl+C)
# Kemudian jalankan ulang:
node server.js
```

**Pastikan tidak ada error saat startup!**

---

### LANGKAH 3: Rebuild Frontend

```bash
cd frontend
npm run build
```

Kemudian copy hasil build ke folder public:

```powershell
Copy-Item -Path "frontend/dist/*" -Destination "public/" -Recurse -Force
```

---

## 🧪 Skenario Testing

### TEST 1: Validasi Pre-Migration ✅

**Tujuan:** Memastikan validator mendeteksi kelas yang hilang

**Langkah:**
1. Buka aplikasi di browser
2. Pastikan ada santri di tahun ajaran berjalan
3. Hapus satu kelas yang dibutuhkan (misal: Kelas 2 Diniyah)
4. Klik tombol "Migrasi Tahun Ajaran"
5. Klik "Proses Migrasi"

**Hasil yang diharapkan:**
- ❌ Migrasi gagal dengan pesan error
- Error menampilkan kelas yang hilang: "Missing target classes: Diniyah tingkat 2"
- Tidak ada perubahan di database

**Perbaikan:**
- Tambahkan kembali kelas yang hilang
- Ulangi migrasi

---

### TEST 2: Auto-Advance Preview 👀

**Tujuan:** Memastikan preview menampilkan kenaikan kelas dengan benar

**Langkah:**
1. Klik tombol "Migrasi Tahun Ajaran"
2. Perhatikan modal yang muncul

**Hasil yang diharapkan:**
- ✅ Kolom "Kelas Diniyah" menampilkan: `Kelas 1` → `Kelas SP`
- ✅ Kolom "Kelas Sekolah" menampilkan: `Kelas 7` → `Kelas 8`
- ✅ Kolom "Status Kelulusan" menampilkan:
  - 🎓 Tag emas untuk santri tingkat 6 (Diniyah) atau 12 (MA)
  - 📝 Tag biru untuk santri tingkat 9 (MTs)
  - 📚 Tag hijau untuk santri tingkat 6 Diniyah yang masih sekolah

**Statistik yang ditampilkan:**
- Total Santri: X
- Akan Naik Kelas: X
- Tidak Naik Kelas: 0
- 🎓 Akan Jadi Alumni: X
- 📝 Lulus MTs: X

---

### TEST 3: Migrasi Santri Biasa (Tidak Lulus) ✅

**Tujuan:** Memastikan santri naik kelas dengan benar

**Setup:**
- Santri A: Kelas 1 Diniyah, Kelas 7 Sekolah
- Santri B: Kelas 3 Diniyah, Kelas 10 Sekolah

**Langkah:**
1. Klik "Migrasi Tahun Ajaran"
2. Pastikan semua santri tercentang
3. Klik "Proses Migrasi"

**Hasil yang diharapkan:**
- ✅ Migrasi berhasil
- ✅ Pesan sukses menampilkan:
  ```
  Migrasi ke tahun ajaran 2026-2027 berhasil.
  ✅ 2 santri naik kelas
  🎓 0 santri menjadi alumni
  📝 0 santri lulus MTs
  ❌ 0 santri tidak naik kelas
  ```
- ✅ Santri A sekarang: Kelas SP Diniyah, Kelas 8 Sekolah
- ✅ Santri B sekarang: Kelas 4 Diniyah, Kelas 11 Sekolah
- ✅ Tahun ajaran berjalan berubah ke 2026-2027

---

### TEST 4: Lulus Diniyah (Tanpa Sekolah) 🎓

**Tujuan:** Memastikan santri menjadi alumni saat lulus Diniyah tanpa Sekolah

**Setup:**
- Santri C: Kelas 6 Diniyah, **TIDAK** ada Kelas Sekolah

**Langkah:**
1. Klik "Migrasi Tahun Ajaran"
2. Perhatikan Santri C memiliki tag 🎓 "Lulus Diniyah Kelas 6"
3. Klik "Proses Migrasi"

**Hasil yang diharapkan:**
- ✅ Migrasi berhasil
- ✅ Pesan sukses: `🎓 1 santri menjadi alumni`
- ✅ Santri C **TIDAK** muncul di tahun ajaran baru
- ✅ Santri C muncul di halaman Alumni dengan status "Lulus Diniyah Kelas 6"
- ✅ Di database: `alumni` table memiliki record baru untuk Santri C

**Verifikasi Database:**
```sql
SELECT * FROM alumni WHERE santri_id = [ID_SANTRI_C];
-- Harus ada 1 record dengan kelas_terakhir = 'Lulus Diniyah Kelas 6'
```

---

### TEST 5: Lulus MTs (Lanjut ke MA) 📝

**Tujuan:** Memastikan santri lulus MTs tapi TIDAK jadi alumni

**Setup:**
- Santri D: Kelas 6 Diniyah, Kelas 9 Sekolah (MTs)

**Langkah:**
1. Klik "Migrasi Tahun Ajaran"
2. Perhatikan Santri D memiliki tag 📝 "Lulus MTs"
3. Klik "Proses Migrasi"

**Hasil yang diharapkan:**
- ✅ Migrasi berhasil
- ✅ Pesan sukses: `📝 1 santri lulus MTs`
- ✅ Santri D **MASIH** muncul di tahun ajaran baru
- ✅ Santri D sekarang: Kelas 6 Diniyah (tetap), Kelas 10 Sekolah (MA)
- ✅ Santri D **TIDAK** muncul di halaman Alumni
- ✅ Status di tahun lama: "lulus"
- ✅ Catatan di tahun lama: "... | Lulus MTs"

**Verifikasi Database:**
```sql
-- Santri D TIDAK ada di tabel alumni
SELECT * FROM alumni WHERE santri_id = [ID_SANTRI_D];
-- Harus kosong (0 rows)

-- Santri D ada di tahun ajaran baru dengan kelas 10
SELECT * FROM santri_tahun_ajaran 
WHERE santri_id = [ID_SANTRI_D] 
  AND tahun_ajaran_id = [ID_TAHUN_BARU];
-- Harus ada dengan kelas_sekolah_id = Kelas 10
```

---

### TEST 6: Lulus MA (Jadi Alumni) 🎓

**Tujuan:** Memastikan santri menjadi alumni saat lulus MA

**Setup:**
- Santri E: Kelas 5 Diniyah, Kelas 12 Sekolah (MA)

**Langkah:**
1. Klik "Migrasi Tahun Ajaran"
2. Perhatikan Santri E memiliki tag 🎓 "Lulus MA"
3. Klik "Proses Migrasi"

**Hasil yang diharapkan:**
- ✅ Migrasi berhasil
- ✅ Pesan sukses: `🎓 1 santri menjadi alumni`
- ✅ Santri E **TIDAK** muncul di tahun ajaran baru
- ✅ Santri E muncul di halaman Alumni dengan status "Lulus MA"

---

### TEST 7: Lulus Diniyah & MA (Dual Track) 🎓🎓

**Tujuan:** Memastikan santri dual-track menjadi alumni dengan status gabungan

**Setup:**
- Santri F: Kelas 6 Diniyah, Kelas 12 Sekolah (MA)

**Langkah:**
1. Klik "Migrasi Tahun Ajaran"
2. Perhatikan Santri F memiliki tag 🎓 "Lulus Diniyah & MA"
3. Klik "Proses Migrasi"

**Hasil yang diharapkan:**
- ✅ Migrasi berhasil
- ✅ Pesan sukses: `🎓 1 santri menjadi alumni`
- ✅ Santri F **TIDAK** muncul di tahun ajaran baru
- ✅ Santri F muncul di halaman Alumni dengan status "Lulus Diniyah & MA"

**Verifikasi Database:**
```sql
SELECT * FROM alumni WHERE santri_id = [ID_SANTRI_F];
-- kelas_terakhir harus = 'Lulus Diniyah & MA'
```

---

### TEST 8: Lulus Diniyah Sambil Lanjut Sekolah 📚

**Tujuan:** Memastikan santri yang lulus Diniyah tapi masih sekolah TIDAK jadi alumni

**Setup:**
- Santri G: Kelas 6 Diniyah, Kelas 10 Sekolah (MA)

**Langkah:**
1. Klik "Migrasi Tahun Ajaran"
2. Perhatikan Santri G memiliki tag 📚 "Lulus Diniyah (Lanjut Sekolah)"
3. Klik "Proses Migrasi"

**Hasil yang diharapkan:**
- ✅ Migrasi berhasil
- ✅ Santri G **MASIH** muncul di tahun ajaran baru
- ✅ Santri G sekarang: Kelas 6 Diniyah (tetap), Kelas 11 Sekolah
- ✅ Santri G **TIDAK** muncul di halaman Alumni
- ✅ Catatan di tahun lama: "... | Lulus Diniyah Kelas 6"

---

### TEST 9: Santri Tidak Naik Kelas ❌

**Tujuan:** Memastikan santri yang tidak naik kelas ditandai dengan benar

**Setup:**
- Santri H: Kelas 2 Diniyah, Kelas 8 Sekolah

**Langkah:**
1. Klik "Migrasi Tahun Ajaran"
2. **Hilangkan centang** pada Santri H
3. Klik "Proses Migrasi"

**Hasil yang diharapkan:**
- ✅ Migrasi berhasil
- ✅ Pesan sukses: `❌ 1 santri tidak naik kelas`
- ✅ Santri H **TIDAK** muncul di tahun ajaran baru
- ✅ Santri H masih di tahun ajaran lama dengan:
  - Status: "tidak_naik"
  - Catatan: "... | Tidak naik ke 2026-2027"
  - Kelas tetap: Kelas 2 Diniyah, Kelas 8 Sekolah

---

### TEST 10: Rollback Migrasi 🔄

**Tujuan:** Memastikan rollback mengembalikan semua data dengan benar

**Langkah:**
1. Setelah migrasi berhasil, klik tombol "Rollback Migrasi"
2. Baca peringatan yang muncul
3. Klik OK untuk konfirmasi

**Hasil yang diharapkan:**
- ✅ Rollback berhasil
- ✅ Pesan sukses menampilkan:
  ```
  Rollback ke tahun ajaran 2025-2026 berhasil.
  🗑️ X data santri dihapus
  🔄 X status dikembalikan
  🎓 X record alumni dihapus
  ```
- ✅ Tahun ajaran berjalan kembali ke 2025-2026
- ✅ Semua santri kembali ke tahun ajaran lama
- ✅ Status "tidak_naik" kembali ke "aktif"
- ✅ Status "lulus" kembali ke "aktif"
- ✅ Status "alumni" kembali ke "aktif"
- ✅ Record alumni yang dibuat saat migrasi terhapus
- ✅ Tahun ajaran baru berstatus "draft"

**Verifikasi Database:**
```sql
-- Cek tahun ajaran aktif
SELECT * FROM tahun_ajaran WHERE is_active = TRUE;
-- Harus kembali ke tahun lama

-- Cek santri di tahun baru (harus kosong)
SELECT COUNT(*) FROM santri_tahun_ajaran 
WHERE tahun_ajaran_id = [ID_TAHUN_BARU];
-- Harus 0

-- Cek alumni yang dibuat saat migrasi (harus terhapus)
SELECT * FROM alumni WHERE tahun_lulus = [TAHUN_SELESAI_LAMA];
-- Harus kosong jika alumni dibuat saat migrasi
```

---

### TEST 11: Existing Alumni Exclusion ℹ️

**Tujuan:** Memastikan alumni yang sudah ada tidak diproses ulang

**Setup:**
- Santri I: Sudah ada di tabel `alumni`

**Langkah:**
1. Tambahkan Santri I ke tabel alumni secara manual
2. Klik "Migrasi Tahun Ajaran"
3. Klik "Proses Migrasi"

**Hasil yang diharapkan:**
- ✅ Migrasi berhasil
- ✅ Pesan sukses: `ℹ️ 1 alumni sudah ada (tidak diproses)`
- ✅ Santri I **TIDAK** muncul di tahun ajaran baru
- ✅ Santri I tetap di tabel alumni (tidak duplikat)

---

## 🐛 Troubleshooting

### Error: "Some classes do not have tingkat assigned"

**Penyebab:** Ada kelas yang nama-nya tidak sesuai pattern

**Solusi:**
1. Cek kelas mana yang error:
   ```sql
   SELECT jenis, nama, tingkat FROM kelas WHERE tingkat IS NULL;
   ```
2. Update manual:
   ```sql
   UPDATE kelas SET tingkat = [TINGKAT] WHERE id = [ID_KELAS];
   ```
3. Jalankan ulang migrasi

---

### Error: "Missing target classes"

**Penyebab:** Kelas target untuk kenaikan tidak ada

**Solusi:**
1. Lihat kelas mana yang hilang di error message
2. Tambahkan kelas yang hilang di halaman Kelas
3. Pastikan tingkat sudah benar
4. Ulangi migrasi

---

### Santri tidak naik kelas dengan benar

**Penyebab:** Tingkat kelas salah

**Solusi:**
1. Cek tingkat kelas di database:
   ```sql
   SELECT id, jenis, nama, tingkat FROM kelas ORDER BY jenis, tingkat;
   ```
2. Perbaiki tingkat yang salah
3. Restart backend
4. Ulangi migrasi

---

### Alumni tidak terbuat

**Penyebab:** Logika graduation detection error

**Solusi:**
1. Cek log backend untuk error
2. Cek tingkat kelas santri:
   ```sql
   SELECT sta.*, kd.tingkat as diniyah_tingkat, ks.tingkat as sekolah_tingkat
   FROM santri_tahun_ajaran sta
   LEFT JOIN kelas kd ON sta.kelas_diniyah_id = kd.id
   LEFT JOIN kelas ks ON sta.kelas_sekolah_id = ks.id
   WHERE sta.santri_id = [ID_SANTRI];
   ```
3. Pastikan tingkat = 6 (Diniyah) atau 12 (Sekolah)

---

## 📊 Checklist Testing Lengkap

- [ ] Migrasi database berhasil (tingkat column added)
- [ ] Backend restart tanpa error
- [ ] Frontend rebuild dan copy berhasil
- [ ] Validasi pre-migration bekerja
- [ ] Auto-advance preview tampil dengan benar
- [ ] Santri biasa naik kelas dengan benar
- [ ] Lulus Diniyah (tanpa Sekolah) → Alumni ✅
- [ ] Lulus MTs → Lanjut ke MA (bukan alumni) ✅
- [ ] Lulus MA → Alumni ✅
- [ ] Lulus Diniyah & MA → Alumni dengan status gabungan ✅
- [ ] Lulus Diniyah sambil lanjut Sekolah → Bukan alumni ✅
- [ ] Santri tidak naik kelas ditandai dengan benar
- [ ] Rollback mengembalikan semua data
- [ ] Existing alumni tidak diproses ulang
- [ ] Statistik migrasi akurat
- [ ] Log backend menampilkan emoji dengan benar

---

## 🎉 Selamat Testing!

Jika semua test di atas berhasil, fitur Smart Migration sudah siap digunakan! 🚀

**Catatan:** Selalu backup database sebelum testing di production!
