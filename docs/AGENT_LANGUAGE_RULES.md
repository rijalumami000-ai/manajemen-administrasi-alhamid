# 🇮🇩 ATURAN BAHASA UNTUK SEMUA AGENT

**Tanggal Dibuat:** 2 Mei 2026  
**Status:** ✅ Aktif  
**Prioritas:** 🔴 WAJIB

---

## 📋 RINGKASAN

**SEMUA AGENT WAJIB MENGGUNAKAN BAHASA INDONESIA** dalam setiap respons, jawaban, dokumentasi, komentar kode, commit message, dan komunikasi apapun dengan pengguna atau agent lain.

---

## 🎯 TUJUAN

1. **Konsistensi Komunikasi**: Memastikan semua komunikasi dalam proyek menggunakan bahasa yang sama
2. **Kemudahan Pemahaman**: Memudahkan tim yang berbahasa Indonesia untuk memahami dokumentasi dan kode
3. **Profesionalisme**: Menunjukkan profesionalisme dengan konsistensi bahasa
4. **Aksesibilitas**: Membuat proyek lebih mudah diakses oleh developer Indonesia

---

## ✅ ATURAN WAJIB

### **1. Respons Agent**
- ✅ **WAJIB**: Semua respons agent harus dalam Bahasa Indonesia
- ✅ **WAJIB**: Penjelasan teknis harus dalam Bahasa Indonesia
- ✅ **WAJIB**: Instruksi dan panduan harus dalam Bahasa Indonesia
- ❌ **DILARANG**: Menggunakan bahasa Inggris untuk respons utama

**Contoh Benar:**
```
Saya akan melanjutkan migrasi halaman Alumni ke Ant Design. 
Pertama, saya akan membaca file yang diperlukan...
```

**Contoh Salah:**
```
I will continue migrating the Alumni page to Ant Design.
First, I will read the required files...
```

---

### **2. Dokumentasi**
- ✅ **WAJIB**: Semua file dokumentasi (.md) harus dalam Bahasa Indonesia
- ✅ **WAJIB**: Judul, subjudul, dan konten harus dalam Bahasa Indonesia
- ✅ **WAJIB**: Penjelasan fitur dan cara penggunaan dalam Bahasa Indonesia
- ⚠️ **PENGECUALIAN**: Istilah teknis yang tidak memiliki padanan Indonesia boleh menggunakan bahasa Inggris (contoh: "component", "props", "state")

**Contoh Benar:**
```markdown
# Panduan Migrasi Komponen

## Langkah-langkah Migrasi
1. Baca file komponen yang akan dimigrasi
2. Identifikasi dependencies yang diperlukan
3. Implementasikan dengan Ant Design
```

**Contoh Salah:**
```markdown
# Component Migration Guide

## Migration Steps
1. Read the component file to be migrated
2. Identify required dependencies
3. Implement with Ant Design
```

---

### **3. Komentar Kode**
- ✅ **WAJIB**: Komentar dalam kode harus Bahasa Indonesia
- ✅ **WAJIB**: Dokumentasi fungsi/method dalam Bahasa Indonesia
- ✅ **WAJIB**: TODO comments dalam Bahasa Indonesia
- ⚠️ **PENGECUALIAN**: Nama variabel, fungsi, dan class tetap menggunakan bahasa Inggris (best practice programming)

**Contoh Benar:**
```javascript
// Memuat data alumni dari server
const loadAlumni = async () => {
  try {
    // Panggil API untuk mendapatkan data
    const data = await alumniService.fetchAlumni();
    setAlumniList(data);
  } catch (error) {
    // Tampilkan pesan error jika gagal
    console.error('Gagal memuat data alumni:', error);
  }
};
```

**Contoh Salah:**
```javascript
// Load alumni data from server
const loadAlumni = async () => {
  try {
    // Call API to get data
    const data = await alumniService.fetchAlumni();
    setAlumniList(data);
  } catch (error) {
    // Show error message if failed
    console.error('Failed to load alumni data:', error);
  }
};
```

---

### **4. Commit Messages**
- ✅ **WAJIB**: Commit message harus dalam Bahasa Indonesia
- ✅ **WAJIB**: Deskripsi perubahan dalam Bahasa Indonesia
- ✅ **WAJIB**: Breaking changes dijelaskan dalam Bahasa Indonesia

**Contoh Benar:**
```
feat: Migrasi halaman Alumni ke Ant Design

- Migrasi AlumniCard ke Ant Design Card
- Tambahkan AlumniFilters dengan Select dan Input
- Implementasi AlumniDetailModal dengan Tabs
- Tambahkan loading dan error states
```

**Contoh Salah:**
```
feat: Migrate Alumni page to Ant Design

- Migrate AlumniCard to Ant Design Card
- Add AlumniFilters with Select and Input
- Implement AlumniDetailModal with Tabs
- Add loading and error states
```

---

### **5. Pesan Error dan Notifikasi**
- ✅ **WAJIB**: Pesan error untuk user dalam Bahasa Indonesia
- ✅ **WAJIB**: Notifikasi sukses dalam Bahasa Indonesia
- ✅ **WAJIB**: Pesan validasi dalam Bahasa Indonesia
- ✅ **WAJIB**: Alert dan warning dalam Bahasa Indonesia

**Contoh Benar:**
```javascript
message.success('Data alumni berhasil disimpan');
message.error('Gagal memuat data alumni');
message.warning('Harap isi semua field yang wajib');
```

**Contoh Salah:**
```javascript
message.success('Alumni data saved successfully');
message.error('Failed to load alumni data');
message.warning('Please fill all required fields');
```

---

### **6. Label dan Teks UI**
- ✅ **WAJIB**: Label form dalam Bahasa Indonesia
- ✅ **WAJIB**: Teks tombol dalam Bahasa Indonesia
- ✅ **WAJIB**: Placeholder dalam Bahasa Indonesia
- ✅ **WAJIB**: Judul halaman dan section dalam Bahasa Indonesia

**Contoh Benar:**
```jsx
<Form.Item label="Nama Lengkap" name="nama">
  <Input placeholder="Masukkan nama lengkap" />
</Form.Item>
<Button type="primary">Simpan Data</Button>
```

**Contoh Salah:**
```jsx
<Form.Item label="Full Name" name="nama">
  <Input placeholder="Enter full name" />
</Form.Item>
<Button type="primary">Save Data</Button>
```

---

## ⚠️ PENGECUALIAN

### **Boleh Menggunakan Bahasa Inggris:**

1. **Nama Variabel, Fungsi, Class**
   ```javascript
   const fetchAlumni = async () => { ... }  // ✅ OK
   const ambilAlumni = async () => { ... }  // ❌ Tidak disarankan
   ```

2. **Istilah Teknis Tanpa Padanan**
   - Component, Props, State, Hook
   - API, REST, GraphQL
   - Frontend, Backend
   - Database, Query
   - Build, Deploy

3. **Library dan Framework Names**
   - React, Ant Design, Sass
   - Express, Node.js
   - MySQL, PostgreSQL

4. **File dan Folder Names**
   ```
   components/     ✅ OK
   services/       ✅ OK
   utils/          ✅ OK
   ```

5. **Import Statements**
   ```javascript
   import { useState } from 'react';  // ✅ OK
   ```

---

## 📝 TEMPLATE RESPONS AGENT

### **Template Standar:**
```
Baik, saya akan [aksi yang akan dilakukan].

[Penjelasan singkat tentang apa yang akan dikerjakan]

[Langkah-langkah jika diperlukan]

[Hasil atau kesimpulan]
```

### **Contoh Implementasi:**
```
Baik, saya akan melanjutkan migrasi halaman Alumni ke Ant Design.

Saya akan migrasi komponen-komponen berikut:
1. AlumniCard - Migrasi ke Ant Design Card
2. AlumniFilters - Migrasi ke Ant Design Select dan Input
3. AlumniDetailModal - Migrasi ke Ant Design Modal dengan Tabs
4. AlumniEditModal - Migrasi ke Ant Design Modal dengan Form

Mari saya mulai dengan membaca file yang diperlukan...
```

---

## 🔍 CHECKLIST SEBELUM SUBMIT

Sebelum mengirim respons atau membuat perubahan, pastikan:

- [ ] Semua respons dalam Bahasa Indonesia
- [ ] Dokumentasi dalam Bahasa Indonesia
- [ ] Komentar kode dalam Bahasa Indonesia
- [ ] Commit message dalam Bahasa Indonesia
- [ ] Pesan error/sukses dalam Bahasa Indonesia
- [ ] Label UI dalam Bahasa Indonesia
- [ ] Placeholder dalam Bahasa Indonesia
- [ ] Penjelasan teknis dalam Bahasa Indonesia

---

## 🎯 CONTOH KASUS

### **Kasus 1: Membuat Fitur Baru**

**❌ Salah:**
```
I will create a new feature for alumni management.
First, I'll create the component...
```

**✅ Benar:**
```
Saya akan membuat fitur baru untuk manajemen alumni.
Pertama, saya akan membuat komponen...
```

---

### **Kasus 2: Menjelaskan Error**

**❌ Salah:**
```
The build failed because of a missing dependency.
You need to install the package first.
```

**✅ Benar:**
```
Build gagal karena ada dependency yang hilang.
Anda perlu menginstall package terlebih dahulu.
```

---

### **Kasus 3: Dokumentasi API**

**❌ Salah:**
```markdown
## API Endpoints

### Get Alumni List
Returns a list of all alumni.
```

**✅ Benar:**
```markdown
## Endpoint API

### Ambil Daftar Alumni
Mengembalikan daftar semua alumni.
```

---

## 📚 REFERENSI

### **Istilah Teknis yang Umum Digunakan:**

| Bahasa Inggris | Bahasa Indonesia |
|----------------|------------------|
| Load | Memuat |
| Fetch | Mengambil |
| Save | Menyimpan |
| Update | Memperbarui |
| Delete | Menghapus |
| Create | Membuat |
| Edit | Mengedit |
| Submit | Mengirim |
| Cancel | Batal |
| Success | Berhasil |
| Failed | Gagal |
| Error | Error/Kesalahan |
| Warning | Peringatan |
| Loading | Memuat |
| Empty | Kosong |
| Required | Wajib |
| Optional | Opsional |

---

## 🚨 SANKSI PELANGGARAN

Jika agent tidak mengikuti aturan ini:

1. **Peringatan Pertama**: Reminder untuk menggunakan Bahasa Indonesia
2. **Peringatan Kedua**: Permintaan revisi respons
3. **Pelanggaran Berulang**: Evaluasi konfigurasi agent

---

## ✅ KESIMPULAN

**INGAT**: Bahasa Indonesia adalah bahasa utama untuk semua komunikasi dalam proyek ini. Konsistensi bahasa sangat penting untuk profesionalisme dan kemudahan kolaborasi tim.

**PRINSIP UTAMA**: 
> "Jika ragu, gunakan Bahasa Indonesia. Istilah teknis yang tidak memiliki padanan boleh menggunakan bahasa Inggris."

---

**Dibuat oleh:** AI Agent  
**Terakhir Diperbarui:** 2 Mei 2026  
**Status:** ✅ Aktif dan Wajib Diikuti
