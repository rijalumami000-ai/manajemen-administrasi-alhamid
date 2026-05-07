# Panduan Struktur Dokumentasi Proyek

## Tujuan
Dokumen ini mengatur standar peletakan dan organisasi dokumentasi proyek agar terstruktur, mudah ditemukan, dan tidak bercampur aduk.

## Prinsip Dasar

1. **Satu Topik, Satu Tempat** - Setiap jenis dokumentasi memiliki lokasi yang jelas
2. **Hierarki yang Jelas** - Gunakan folder untuk mengelompokkan dokumen terkait
3. **Penamaan Konsisten** - Ikuti konvensi penamaan yang telah ditetapkan
4. **Arsip Terpisah** - Dokumentasi lama dipindahkan ke folder archive

---

## Struktur Folder Utama

```
docs/
├── guides/              # Panduan penggunaan dan tutorial
├── reports/             # Laporan implementasi dan verifikasi
├── alumni/              # Dokumentasi khusus modul alumni
├── archive/             # Dokumentasi lama yang tidak aktif
└── [root files]         # Dokumentasi tingkat proyek
```

---

## Aturan Peletakan Berdasarkan Jenis Dokumen

### 1. Dokumentasi Fase/Milestone (`docs/`)

**Lokasi:** Root folder `docs/`

**Format Nama:** `FASE_[NOMOR]_COMPLETE.md`

**Contoh:**
- `FASE_8_COMPLETE.md`
- `FASE_9_COMPLETE.md`
- `FASE_10_COMPLETE.md`

**Isi:**
- Ringkasan pencapaian fase
- Fitur yang diselesaikan
- Perubahan yang dilakukan
- Status dan next steps

**Kapan Digunakan:**
- Setelah menyelesaikan fase besar dalam roadmap
- Untuk milestone proyek yang signifikan

---

### 2. Laporan Implementasi & Verifikasi (`docs/reports/`)

**Lokasi:** `docs/reports/`

**Format Nama:**
- Implementasi: `[NAMA_FITUR]_IMPLEMENTATION_SUMMARY.md`
- Verifikasi: `[NAMA_FITUR]_VERIFICATION_REPORT.md`
- Rencana: `[NAMA_FITUR]_PLAN.md`
- Selesai: `[NAMA_FITUR]_COMPLETE.md`

**Contoh:**
- `TASK_10_IMPLEMENTATION_SUMMARY.md`
- `TASK_10_VERIFICATION.md`
- `PRIORITAS_1_COMPLETE.md`
- `ALUMNI_REFACTOR_PLAN.md`

**Isi:**
- Detail teknis implementasi
- Hasil testing
- Bug fixes
- Perubahan kode spesifik

**Kapan Digunakan:**
- Untuk task/prioritas spesifik
- Laporan detail implementasi fitur
- Dokumentasi refactoring
- Hasil testing dan verifikasi

---

### 3. Panduan Pengguna & Tutorial (`docs/guides/`)

**Lokasi:** `docs/guides/`

**Format Nama:** `[TOPIK]_GUIDE.md` atau `[TOPIK]_CHECKLIST.md`

**Contoh:**
- `QUICK_START_GUIDE.md`
- `MOBILE_ACCESS_GUIDE.md`
- `VALIDATION_PATTERN_GUIDE.md`
- `MANUAL_TESTING_CHECKLIST.md`

**Isi:**
- Langkah-langkah penggunaan
- Best practices
- Checklist
- Tutorial step-by-step

**Kapan Digunakan:**
- Panduan untuk developer
- Panduan untuk pengguna
- Checklist operasional
- Pattern dan konvensi koding

---

### 4. Dokumentasi Modul Spesifik (`docs/[nama-modul]/`)

**Lokasi:** `docs/[nama-modul]/`

**Contoh:** `docs/alumni/`

**Format Nama:**
- `[MODUL]_README.md` - Overview modul
- `[MODUL]_DATABASE_DOCUMENTATION.md` - Dokumentasi database
- `[MODUL]_IMPLEMENTATION_SUMMARY.md` - Ringkasan implementasi
- `[MODUL]_TROUBLESHOOTING.md` - Panduan troubleshooting
- `[MODUL]_UPGRADE_PLAN.md` - Rencana upgrade

**Isi:**
- Dokumentasi lengkap satu modul
- Semua aspek terkait modul tersebut
- Riwayat perubahan modul

**Kapan Digunakan:**
- Untuk modul besar yang kompleks
- Ketika dokumentasi modul sangat banyak
- Untuk memisahkan concern yang berbeda

---

### 5. Dokumentasi Proyek Utama (`docs/`)

**Lokasi:** Root folder `docs/`

**File Standar:**
- `PROJECT_STATUS.md` - Status terkini proyek
- `PROJECT_STRUCTURE.md` - Struktur kode proyek
- `ROADMAP.md` - Rencana pengembangan
- `DEPLOYMENT_GUIDE.md` - Panduan deployment
- `DEVELOPMENT_GUIDE.md` - Panduan development
- `TESTING_CHECKLIST.md` - Checklist testing
- `CHANGELOG.md` - Riwayat perubahan (di root proyek)

**Isi:**
- Informasi tingkat proyek
- Dokumentasi yang sering direferensi
- Panduan setup dan deployment

**Kapan Digunakan:**
- Dokumentasi yang berlaku untuk seluruh proyek
- Informasi yang perlu diakses cepat

---

### 6. Arsip Dokumentasi Lama (`docs/archive/`)

**Lokasi:** `docs/archive/`

**Struktur:**
```
docs/archive/
├── public/              # File HTML lama
├── [tahun]/             # Arsip berdasarkan tahun (opsional)
└── [versi]/             # Arsip berdasarkan versi (opsional)
```

**Contoh:**
- `docs/archive/public/alumni_v1.html`
- `docs/archive/public/alumni_backup.html`

**Kapan Memindahkan ke Archive:**
- Dokumentasi sudah tidak relevan
- Digantikan oleh versi baru
- Untuk referensi historis saja
- File backup atau versi lama

---

## Konvensi Penamaan File

### Format Umum
```
[KATEGORI]_[DESKRIPSI]_[TIPE].md
```

### Kategori
- `FASE` - Milestone fase
- `TASK` - Task spesifik
- `PRIORITAS` - Prioritas implementasi
- `[NAMA_MODUL]` - Nama modul (ALUMNI, SANTRI, dll)

### Tipe
- `COMPLETE` - Dokumentasi selesai
- `SUMMARY` - Ringkasan
- `REPORT` - Laporan
- `PLAN` - Rencana
- `GUIDE` - Panduan
- `CHECKLIST` - Daftar periksa
- `README` - Overview/pengenalan

### Aturan Penamaan
1. Gunakan UPPERCASE untuk kata kunci utama
2. Gunakan underscore `_` sebagai pemisah
3. Gunakan ekstensi `.md` untuk Markdown
4. Hindari spasi dalam nama file
5. Gunakan bahasa yang konsisten (Indonesia atau Inggris)

**Contoh Baik:**
- ✅ `FASE_10_COMPLETE.md`
- ✅ `ALUMNI_IMPLEMENTATION_SUMMARY.md`
- ✅ `QUICK_START_GUIDE.md`

**Contoh Buruk:**
- ❌ `fase 10 selesai.md` (ada spasi, lowercase)
- ❌ `alumni-summary.txt` (ekstensi salah)
- ❌ `Summary.md` (tidak deskriptif)

---

## Workflow Dokumentasi

### 1. Memulai Task Baru

```
1. Buat file di docs/reports/
   Format: TASK_[N]_IMPLEMENTATION_SUMMARY.md

2. Isi dengan:
   - Tujuan task
   - Rencana implementasi
   - Checklist yang harus diselesaikan
```

### 2. Selama Pengerjaan

```
1. Update file implementation summary secara berkala
2. Catat perubahan penting
3. Dokumentasikan keputusan teknis
```

### 3. Setelah Selesai

```
1. Buat verification report jika diperlukan
   Format: TASK_[N]_VERIFICATION.md

2. Update PROJECT_STATUS.md

3. Jika task adalah bagian dari fase:
   - Update atau buat FASE_[N]_COMPLETE.md
```

### 4. Untuk Modul Besar

```
1. Buat folder khusus: docs/[nama-modul]/

2. Buat file-file standar:
   - [MODUL]_README.md
   - [MODUL]_IMPLEMENTATION_SUMMARY.md
   - [MODUL]_TROUBLESHOOTING.md

3. Simpan semua dokumentasi terkait di folder tersebut
```

---

## Template Dokumentasi

### Template Implementation Summary

```markdown
# [Nama Task/Fitur] - Implementation Summary

## Overview
[Deskripsi singkat apa yang diimplementasikan]

## Objectives
- [ ] Objective 1
- [ ] Objective 2

## Implementation Details

### 1. [Aspek 1]
[Detail implementasi]

### 2. [Aspek 2]
[Detail implementasi]

## Changes Made
- File yang diubah
- Fungsi yang ditambahkan
- Database changes (jika ada)

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Issues & Solutions
| Issue | Solution |
|-------|----------|
| [Issue] | [Solution] |

## Next Steps
- [ ] Step 1
- [ ] Step 2

## Status
**Status:** [In Progress / Completed / Blocked]
**Last Updated:** [Tanggal]
```

### Template Verification Report

```markdown
# [Nama Task/Fitur] - Verification Report

## Test Summary
- **Total Tests:** X
- **Passed:** Y
- **Failed:** Z
- **Date:** [Tanggal]

## Test Cases

### 1. [Test Case Name]
- **Status:** ✅ Pass / ❌ Fail
- **Description:** [Deskripsi]
- **Steps:** [Langkah-langkah]
- **Expected:** [Hasil yang diharapkan]
- **Actual:** [Hasil aktual]

## Issues Found
| ID | Description | Severity | Status |
|----|-------------|----------|--------|
| 1  | [Issue]     | High     | Fixed  |

## Conclusion
[Kesimpulan hasil verifikasi]

## Sign-off
- **Verified by:** [Nama]
- **Date:** [Tanggal]
```

### Template Fase Complete

```markdown
# Fase [N] - Complete

## Overview
[Ringkasan fase ini]

## Completed Features
1. [Fitur 1]
2. [Fitur 2]

## Key Changes
- [Perubahan penting 1]
- [Perubahan penting 2]

## Statistics
- Files changed: X
- Lines added: Y
- Lines removed: Z

## Testing Results
- All tests passing: ✅ / ❌
- Manual testing: ✅ / ❌

## Known Issues
- [Issue 1]
- [Issue 2]

## Next Phase
[Rencana untuk fase berikutnya]

## Date Completed
[Tanggal]
```

---

## Checklist Sebelum Commit Dokumentasi

- [ ] File ditempatkan di folder yang benar
- [ ] Nama file mengikuti konvensi penamaan
- [ ] Format Markdown valid
- [ ] Tanggal dan status diupdate
- [ ] Link ke file terkait berfungsi
- [ ] Tidak ada informasi sensitif (password, token, dll)
- [ ] Bahasa konsisten (Indonesia atau Inggris)
- [ ] PROJECT_STATUS.md diupdate jika perlu

---

## Maintenance Dokumentasi

### Bulanan
- [ ] Review dokumentasi yang sudah tidak relevan
- [ ] Pindahkan dokumentasi lama ke archive
- [ ] Update PROJECT_STATUS.md

### Per Fase
- [ ] Buat FASE_[N]_COMPLETE.md
- [ ] Update ROADMAP.md
- [ ] Review dan cleanup docs/reports/

### Per Release
- [ ] Update CHANGELOG.md
- [ ] Archive dokumentasi versi lama
- [ ] Update semua panduan yang terpengaruh

---

## Contoh Struktur Lengkap

```
docs/
├── guides/
│   ├── QUICK_START_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── TESTING_GUIDE.md
│   └── VALIDATION_PATTERN_GUIDE.md
│
├── reports/
│   ├── TASK_10_IMPLEMENTATION_SUMMARY.md
│   ├── TASK_10_VERIFICATION.md
│   ├── PRIORITAS_1_COMPLETE.md
│   └── FIXES_SUMMARY.md
│
├── alumni/
│   ├── ALUMNI_README.md
│   ├── ALUMNI_DATABASE_DOCUMENTATION.md
│   ├── ALUMNI_IMPLEMENTATION_SUMMARY.md
│   ├── ALUMNI_TROUBLESHOOTING.md
│   └── ALUMNI_UPGRADE_PLAN.md
│
├── archive/
│   ├── public/
│   │   ├── alumni_v1.html
│   │   └── alumni_backup.html
│   └── 2024/
│       └── old_documentation.md
│
├── FASE_8_COMPLETE.md
├── FASE_9_COMPLETE.md
├── FASE_10_COMPLETE.md
├── PROJECT_STATUS.md
├── PROJECT_STRUCTURE.md
├── ROADMAP.md
├── DEPLOYMENT_GUIDE.md
├── DEVELOPMENT_GUIDE.md
└── TESTING_CHECKLIST.md
```

---

## Tips & Best Practices

### 1. Dokumentasi Harus Hidup
- Update dokumentasi bersamaan dengan kode
- Jangan menunda dokumentasi sampai akhir
- Review dokumentasi secara berkala

### 2. Gunakan Link Relatif
```markdown
<!-- Baik -->
[Lihat panduan deployment](./DEPLOYMENT_GUIDE.md)

<!-- Buruk -->
[Lihat panduan deployment](C:/Users/project/docs/DEPLOYMENT_GUIDE.md)
```

### 3. Gunakan Table of Contents untuk Dokumen Panjang
```markdown
## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
```

### 4. Sertakan Metadata
```markdown
---
Title: Implementation Summary
Author: [Nama]
Date: 2026-05-02
Status: Complete
---
```

### 5. Gunakan Diagram Jika Perlu
- Flowchart untuk alur proses
- ERD untuk struktur database
- Architecture diagram untuk sistem

---

## FAQ

**Q: Dimana saya harus meletakkan dokumentasi API?**
A: Buat folder `docs/api/` dan gunakan format `API_[MODUL]_DOCUMENTATION.md`

**Q: Bagaimana dengan dokumentasi kode (code comments)?**
A: Code comments tetap di dalam kode. Dokumentasi di `docs/` adalah untuk level yang lebih tinggi.

**Q: Kapan harus membuat folder baru untuk modul?**
A: Ketika dokumentasi modul sudah lebih dari 3-4 file atau sangat kompleks.

**Q: Apakah boleh menggunakan bahasa Indonesia dan Inggris campur?**
A: Sebaiknya konsisten per file. Untuk proyek ini, gunakan Indonesia untuk dokumentasi internal, Inggris untuk dokumentasi teknis.

**Q: Bagaimana dengan dokumentasi sementara/draft?**
A: Buat folder `docs/drafts/` untuk dokumentasi yang masih dalam pengerjaan.

---

## Referensi

- [Markdown Guide](https://www.markdownguide.org/)
- [Documentation Best Practices](https://documentation.divio.com/)
- PROJECT_STRUCTURE.md - Struktur kode proyek
- DEVELOPMENT_GUIDE.md - Panduan development

---

**Last Updated:** 2026-05-02
**Version:** 1.0
**Maintainer:** Development Team
