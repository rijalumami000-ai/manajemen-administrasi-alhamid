# Manual Testing Checklist - Prioritas 1

**Tujuan:** Memastikan semua fitur berfungsi dengan baik setelah refactor  
**Status:** Ready for testing  
**Date:** 2026-05-02  

---

## 📋 Pre-Testing Setup

### 1. Start Server
```bash
node server.js
```

**Expected Output:**
```
Server berjalan di http://localhost:3000
Untuk akses dari mobile, gunakan: http://[IP-ADDRESS]:3000
```

### 2. Open Browser
- Buka: `http://localhost:3000`
- Pastikan console browser terbuka (F12)
- Check for any JavaScript errors

---

## ✅ Testing Checklist

### 🏠 Dashboard (Halaman Utama)

**URL:** `http://localhost:3000`

- [ ] **Load Page**
  - Halaman muncul tanpa error
  - Tidak ada error di console
  - Loading time < 3 detik

- [ ] **Summary Cards**
  - [ ] Card "Total Santri" menampilkan angka
  - [ ] Card "Total Guru" menampilkan angka
  - [ ] Card "Total Kelas" menampilkan angka
  - [ ] Card "Total Kamar" menampilkan angka
  - [ ] Angka sesuai dengan data di database

- [ ] **Navigation Menu**
  - [ ] Semua menu item terlihat
  - [ ] Hover effect berfungsi
  - [ ] Click menu tidak error

**Screenshot:** 📸 Ambil screenshot dashboard

---

### 👨‍🎓 Santri Management

**URL:** `http://localhost:3000` → Click "Santri"

#### View List
- [ ] **Table Display**
  - [ ] Tabel santri muncul
  - [ ] Data santri terload
  - [ ] Kolom: NIS, Nama, Kelas Diniyah, Kelas Sekolah, Kamar
  - [ ] Tidak ada error di console

- [ ] **Search Function**
  - [ ] Search box berfungsi
  - [ ] Ketik nama santri → hasil filter
  - [ ] Clear search → kembali ke semua data

#### Create Santri
- [ ] **Open Modal**
  - [ ] Click "Tambah Santri"
  - [ ] Modal muncul
  - [ ] Form fields terlihat semua

- [ ] **Fill Form**
  - [ ] NIS: `TEST123456` (required)
  - [ ] Nama: `Test Santri Manual` (required)
  - [ ] Jenis Kelamin: Pilih "Laki-laki"
  - [ ] Kelas Diniyah: Pilih salah satu
  - [ ] Kelas Sekolah: Pilih salah satu
  - [ ] Kamar: Pilih salah satu
  - [ ] Tempat Lahir: `Jakarta`
  - [ ] Tanggal Lahir: Pilih tanggal
  - [ ] Alamat: `Jl. Test No. 123`

- [ ] **Submit**
  - [ ] Click "Simpan"
  - [ ] Loading indicator muncul
  - [ ] Success message muncul
  - [ ] Modal tertutup
  - [ ] Data baru muncul di tabel

#### Edit Santri
- [ ] **Open Edit Modal**
  - [ ] Click "Edit" pada santri test
  - [ ] Modal edit muncul
  - [ ] Data ter-populate di form

- [ ] **Update Data**
  - [ ] Ubah nama menjadi `Test Santri Updated`
  - [ ] Click "Simpan"
  - [ ] Success message muncul
  - [ ] Data terupdate di tabel

#### Delete Santri
- [ ] **Delete**
  - [ ] Click "Hapus" pada santri test
  - [ ] Confirmation dialog muncul
  - [ ] Click "OK"
  - [ ] Success message muncul
  - [ ] Data hilang dari tabel

**Screenshot:** 📸 Ambil screenshot santri list & modal

---

### 👨‍🏫 Guru Management

**URL:** `http://localhost:3000` → Click "Guru"

#### View List
- [ ] **Table Display**
  - [ ] Tabel guru muncul
  - [ ] Data guru terload
  - [ ] Kolom: NIP, Nama, Mata Pelajaran, Jabatan, No HP, Status
  - [ ] Tidak ada error di console

#### Create Guru
- [ ] **Open Modal**
  - [ ] Click "Tambah Guru"
  - [ ] Modal muncul

- [ ] **Fill Form**
  - [ ] NIP: `TEST123` (optional)
  - [ ] Nama: `Test Guru Manual` (required)
  - [ ] Mata Pelajaran: Pilih salah satu (required)
  - [ ] Jabatan: Pilih salah satu (required)
  - [ ] No HP: `081234567890` (required)
  - [ ] Alamat: `Jl. Test No. 456` (required)
  - [ ] Status: Pilih "Aktif" (required)

- [ ] **Submit**
  - [ ] Click "Simpan"
  - [ ] Success message muncul
  - [ ] Data baru muncul di tabel

#### Edit & Delete
- [ ] **Edit** guru test → Update nama → Save
- [ ] **Delete** guru test → Confirm → Success

**Screenshot:** 📸 Ambil screenshot guru list

---

### 📚 Kelas Management

**URL:** `http://localhost:3000` → Click "Kelas"

#### View List
- [ ] **Table Display**
  - [ ] Tabel kelas muncul
  - [ ] Data kelas terload
  - [ ] Kolom: Jenis, Nama
  - [ ] Tidak ada error di console

#### Create Kelas
- [ ] **Open Modal**
  - [ ] Click "Tambah Kelas"
  - [ ] Modal muncul

- [ ] **Fill Form**
  - [ ] Jenis: Pilih "Diniyah" atau "Sekolah" (required)
  - [ ] Nama: `Test Kelas Manual` (required)

- [ ] **Submit**
  - [ ] Click "Simpan"
  - [ ] Success message muncul
  - [ ] Data baru muncul di tabel

#### Edit & Delete
- [ ] **Edit** kelas test → Update nama → Save
- [ ] **Delete** kelas test → Confirm → Success

**Screenshot:** 📸 Ambil screenshot kelas list

---

### 🏠 Kamar Management

**URL:** `http://localhost:3000` → Click "Kamar"

#### View List
- [ ] **Table Display**
  - [ ] Tabel kamar muncul
  - [ ] Data kamar terload
  - [ ] Kolom: Nama, Gedung, Lantai, Kapasitas, Terisi, Jenis, Status
  - [ ] Tidak ada error di console

#### Create Kamar
- [ ] **Open Modal**
  - [ ] Click "Tambah Kamar"
  - [ ] Modal muncul

- [ ] **Fill Form**
  - [ ] Nama: `Test Kamar Manual` (required)
  - [ ] Gedung: `A`
  - [ ] Lantai: `1`
  - [ ] Kapasitas: `10` (required)
  - [ ] Terisi: `0`
  - [ ] Jenis: Pilih "Putra" atau "Putri" (required)
  - [ ] Status: `Tersedia`
  - [ ] Fasilitas: `AC, Lemari`
  - [ ] Keterangan: `Test kamar`

- [ ] **Submit**
  - [ ] Click "Simpan"
  - [ ] Success message muncul
  - [ ] Data baru muncul di tabel

#### Edit & Delete
- [ ] **Edit** kamar test → Update kapasitas → Save
- [ ] **Delete** kamar test → Confirm → Success

**Screenshot:** 📸 Ambil screenshot kamar list

---

### 📅 Tahun Ajaran Management

**URL:** `http://localhost:3000` → Click "Tahun Ajaran"

#### View List
- [ ] **Table Display**
  - [ ] Tabel tahun ajaran muncul
  - [ ] Data tahun ajaran terload
  - [ ] Kolom: Kode, Nama, Tanggal Mulai, Tanggal Selesai, Status
  - [ ] Tidak ada error di console

- [ ] **Active Indicator**
  - [ ] Tahun ajaran aktif ditandai dengan badge/highlight
  - [ ] Hanya ada 1 tahun ajaran aktif

**Screenshot:** 📸 Ambil screenshot tahun ajaran list

---

### ⚠️ Pelanggaran Management

**URL:** `http://localhost:3000` → Click "Pelanggaran"

#### View List
- [ ] **Table Display**
  - [ ] Tabel pelanggaran muncul
  - [ ] Data pelanggaran terload (jika ada)
  - [ ] Kolom: Santri, Tanggal, Jenis, Poin, Keterangan
  - [ ] Tidak ada error di console

#### Create Pelanggaran (if applicable)
- [ ] **Open Modal**
  - [ ] Click "Tambah Pelanggaran"
  - [ ] Modal muncul

- [ ] **Fill Form**
  - [ ] Santri: Pilih dari dropdown
  - [ ] Tanggal: Pilih tanggal
  - [ ] Jenis: Input jenis pelanggaran
  - [ ] Poin: Input poin
  - [ ] Keterangan: Input keterangan

- [ ] **Submit**
  - [ ] Click "Simpan"
  - [ ] Success message muncul
  - [ ] Data baru muncul di tabel

**Screenshot:** 📸 Ambil screenshot pelanggaran list

---

### 🏆 Prestasi Management

**URL:** `http://localhost:3000` → Click "Prestasi"

#### View List
- [ ] **Table Display**
  - [ ] Tabel prestasi muncul
  - [ ] Data prestasi terload (jika ada)
  - [ ] Kolom: Santri, Tanggal, Nama Prestasi, Tingkat, Keterangan
  - [ ] Tidak ada error di console

#### Create Prestasi (if applicable)
- [ ] **Open Modal**
  - [ ] Click "Tambah Prestasi"
  - [ ] Modal muncul

- [ ] **Fill Form**
  - [ ] Santri: Pilih dari dropdown
  - [ ] Tanggal: Pilih tanggal
  - [ ] Nama Prestasi: Input nama
  - [ ] Tingkat: Pilih tingkat
  - [ ] Keterangan: Input keterangan

- [ ] **Submit**
  - [ ] Click "Simpan"
  - [ ] Success message muncul
  - [ ] Data baru muncul di tabel

**Screenshot:** 📸 Ambil screenshot prestasi list

---

### 🎓 Alumni Management

**URL:** `http://localhost:3000` → Click "Alumni"

#### View List
- [ ] **Table Display**
  - [ ] Tabel alumni muncul
  - [ ] Data alumni terload
  - [ ] Kolom: NIS, Nama, Tahun Lulus, Pekerjaan, Status
  - [ ] Tidak ada error di console

- [ ] **Search & Filter**
  - [ ] Search box berfungsi
  - [ ] Filter tahun lulus berfungsi
  - [ ] Reset filter berfungsi

#### Create Alumni (Manual)
- [ ] **Open Modal**
  - [ ] Click "Tambah Alumni"
  - [ ] Tab "Manual" aktif
  - [ ] Modal muncul

- [ ] **Fill Form**
  - [ ] NIS: `TEST789012` (required, 6-20 digits)
  - [ ] Nama: `Test Alumni Manual` (required)
  - [ ] Tahun Lulus: `2025` (required)
  - [ ] Email: `test@alumni.com` (optional, valid format)
  - [ ] No HP: `081234567890` (optional, valid format)
  - [ ] Pekerjaan: `Software Engineer`
  - [ ] Alamat Sekarang: `Jakarta`

- [ ] **Validation Test**
  - [ ] Try invalid NIS (123) → Should show error
  - [ ] Try invalid email (test) → Should show error
  - [ ] Try valid data → Should success

- [ ] **Submit**
  - [ ] Click "Simpan"
  - [ ] Loading indicator muncul
  - [ ] Success message muncul
  - [ ] Data baru muncul di tabel

#### Migrate Santri to Alumni
- [ ] **Open Modal**
  - [ ] Click "Tambah Alumni"
  - [ ] Tab "Migrasi Santri" aktif

- [ ] **Fill Form**
  - [ ] Santri: Pilih dari dropdown (autocomplete)
  - [ ] Tahun Lulus: `2025`
  - [ ] Keterangan: `Lulus dengan baik`

- [ ] **Submit**
  - [ ] Click "Simpan"
  - [ ] Success message muncul
  - [ ] Data baru muncul di tabel alumni
  - [ ] Santri hilang dari list santri aktif

#### View Detail
- [ ] **Open Detail Modal**
  - [ ] Click "Detail" pada alumni
  - [ ] Modal detail muncul
  - [ ] Tab "Identitas" menampilkan data lengkap
  - [ ] Tab "Riwayat" menampilkan history (jika ada)

#### Edit & Delete
- [ ] **Edit** alumni test → Update data → Save
- [ ] **Delete** alumni test → Confirm → Success

**Screenshot:** 📸 Ambil screenshot alumni list & detail modal

---

## 🔍 Cross-Feature Testing

### Navigation
- [ ] **Menu Navigation**
  - [ ] Click setiap menu → Halaman berubah
  - [ ] URL berubah sesuai menu
  - [ ] Tidak ada error saat navigasi
  - [ ] Back button browser berfungsi

### Responsive Design
- [ ] **Desktop View** (1920x1080)
  - [ ] Layout rapi
  - [ ] Semua elemen terlihat
  - [ ] Tidak ada overflow

- [ ] **Tablet View** (768x1024)
  - [ ] Layout menyesuaikan
  - [ ] Menu masih accessible
  - [ ] Table scrollable jika perlu

- [ ] **Mobile View** (375x667)
  - [ ] Layout mobile-friendly
  - [ ] Menu hamburger (jika ada)
  - [ ] Touch-friendly buttons

### Performance
- [ ] **Page Load Time**
  - [ ] Dashboard: < 3 detik
  - [ ] Santri list: < 3 detik
  - [ ] Alumni list: < 3 detik

- [ ] **API Response Time**
  - [ ] GET requests: < 1 detik
  - [ ] POST requests: < 2 detik
  - [ ] No timeout errors

### Error Handling
- [ ] **Network Error**
  - [ ] Stop server
  - [ ] Try to load data
  - [ ] Error message muncul (user-friendly)
  - [ ] No console errors

- [ ] **Validation Error**
  - [ ] Submit form dengan data invalid
  - [ ] Error message muncul (Indonesian)
  - [ ] Form tidak submit
  - [ ] User bisa correct dan retry

---

## 📊 Test Results Summary

### Overall Status
- [ ] **All Features Working** - Semua fitur berfungsi tanpa error
- [ ] **No Console Errors** - Tidak ada error di browser console
- [ ] **Validation Working** - Validasi form berfungsi dengan baik
- [ ] **Performance Good** - Loading time acceptable
- [ ] **Responsive Design** - Tampilan baik di berbagai ukuran layar

### Issues Found
**List any issues found during testing:**

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Screenshots Collected
- [ ] Dashboard
- [ ] Santri list & modal
- [ ] Guru list
- [ ] Kelas list
- [ ] Kamar list
- [ ] Tahun Ajaran list
- [ ] Pelanggaran list
- [ ] Prestasi list
- [ ] Alumni list & detail modal

---

## ✅ Sign-off

**Tested By:** _________________  
**Date:** _________________  
**Status:** [ ] PASS  [ ] FAIL  
**Notes:** _________________________________________________

---

## 📝 Next Steps After Testing

1. **If PASS:**
   - Update AGENT_NOTES.md with test results
   - Commit titik stabil
   - Move to Prioritas 4

2. **If FAIL:**
   - Document all issues found
   - Create fix plan
   - Fix issues
   - Re-test

---

**Testing Time Estimate:** 30-45 minutes  
**Recommended:** Test with fresh eyes, take breaks between features
