# Arsip Dokumentasi

Folder ini berisi dokumentasi lama yang sudah tidak aktif digunakan, tetapi disimpan untuk referensi historis.

## 📦 Struktur Arsip

### 📊 [phases/](./phases/)
Dokumentasi fase-fase yang sudah selesai:
- FASE_2_SELESAI.md
- FASE_3_COMPLETE.md
- FASE_4_COMPLETE.md
- FASE_5_COMPLETE.md
- FASE_6_COMPLETE.md
- FASE_7_COMPLETE.md

**Fase Aktif** (tidak di-archive):
- FASE_8_COMPLETE.md
- FASE_9_COMPLETE.md
- FASE_10_COMPLETE.md

### 📝 [reports/](./reports/)
Laporan implementasi lama yang sudah digantikan:
- IMPLEMENTASI_SELESAI.md
- [Laporan lama lainnya]

### 🌐 [public/](./public/)
File HTML backup dan versi lama:
- alumni_v1.html
- alumni_backup.html
- alumni_complete.html

## 🔍 Kapan Dokumentasi Di-archive?

Dokumentasi dipindahkan ke archive ketika:

1. **Sudah Tidak Relevan**
   - Informasi sudah outdated
   - Digantikan oleh versi baru
   - Tidak lagi digunakan dalam development

2. **Fase Sudah Selesai Lama**
   - Fase yang sudah selesai > 2 fase yang lalu
   - Contoh: Jika fase aktif adalah Fase 10, maka Fase 2-7 di-archive

3. **Dokumentasi Duplikat**
   - Ada versi yang lebih baru dan lengkap
   - Backup atau draft yang sudah tidak diperlukan

4. **File Backup**
   - File HTML lama
   - Backup sebelum refactoring
   - Versi lama sebelum migrasi

## ⚠️ Penting

- **JANGAN HAPUS** file di archive tanpa persetujuan
- File di archive tetap di-track oleh Git untuk history
- Gunakan archive untuk referensi jika perlu melihat implementasi lama
- Jika perlu "menghidupkan" kembali dokumentasi, copy (jangan move) dari archive

## 📋 Maintenance Archive

### Setiap 3 Bulan
- [ ] Review dokumentasi di archive
- [ ] Hapus file yang benar-benar tidak diperlukan (dengan persetujuan)
- [ ] Compress file besar jika perlu

### Setiap Release Major
- [ ] Pindahkan fase lama ke archive
- [ ] Pindahkan laporan yang sudah tidak relevan
- [ ] Update README ini

## 🔄 Restore dari Archive

Jika perlu menggunakan kembali dokumentasi dari archive:

1. **Copy** (jangan move) file dari archive
2. Update konten sesuai kebutuhan saat ini
3. Tempatkan di folder yang sesuai
4. Update tanggal dan status

```bash
# Contoh restore
cp docs/archive/phases/FASE_5_COMPLETE.md docs/reference/
```

## 📚 Referensi Historis

Archive ini berguna untuk:
- Melihat bagaimana fitur diimplementasikan di masa lalu
- Memahami keputusan desain yang diambil
- Referensi untuk troubleshooting
- Dokumentasi untuk audit

---

**Last Updated:** 2026-05-02
**Archive Policy:** Keep for 2 years, then review for deletion
