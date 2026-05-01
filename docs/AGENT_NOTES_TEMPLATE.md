# Agent Notes - Template

Template ini untuk memudahkan agent update status di `docs/AGENT_NOTES.md`.

---

## 🔒 Template LOCK (Mulai Kerja)

Copy template ini ke **bagian paling atas** `AGENT_NOTES.md` saat mulai kerja:

```markdown
## 🔒 LOCKED - YYYY-MM-DD HH:mm - [Agent Name]

Area:
- Fitur: [Nama Fitur / Task]
- Scope: [Backend / Frontend / UI / Full-Stack / Database / Testing / Docs]
- Files: 
  - [file1.js]
  - [file2.html]
  - [file3.css]

Task:
- [Deskripsi task 1]
- [Deskripsi task 2]
- [Deskripsi task 3]

Estimasi: [waktu, contoh: 2 jam]
Status: 🔄 IN PROGRESS
```

**Contoh:**

```markdown
## 🔒 LOCKED - 2026-05-01 16:00 - Kiro

Area:
- Fitur: Export Alumni ke Excel
- Scope: Full-Stack (Backend + Frontend + UI)
- Files:
  - src/routes/alumniRoutes.js
  - src/services/alumniService.js
  - public/alumni_script.js
  - public/css/alumni.css

Task:
- Backend: API endpoint /api/alumni/export dengan Excel generation
- Frontend: Tombol export + download handler
- UI: Loading state + success message

Estimasi: 2 jam
Status: 🔄 IN PROGRESS
```

---

## 🔄 Template UPDATE (Progress - Opsional)

Jika task lama (>2 jam), update progress dengan **edit** entry LOCKED:

```markdown
## 🔒 LOCKED - YYYY-MM-DD HH:mm - [Agent Name]

Area: [Nama Fitur]
Scope: [Backend / Frontend / UI / Full-Stack]
Status: 🔄 IN PROGRESS

Progress Update (HH:mm):
- ✅ Backend selesai
- 🔄 Sedang kerja frontend (60% done)
- ⏳ UI belum mulai

Estimasi selesai: [waktu]
Blocker: [Tidak ada / Ada masalah X]
```

---

## ✅ Template UNLOCK (Selesai Kerja)

**Ganti** entry 🔒 LOCKED dengan template ini saat selesai:

```markdown
## ✅ UNLOCKED - YYYY-MM-DD HH:mm - [Agent Name]

Area:
- Fitur: [Nama Fitur]
- Scope: [Backend / Frontend / UI / Full-Stack / Database / Testing / Docs]

Perubahan:
- ✅ [Perubahan 1]
- ✅ [Perubahan 2]
- ✅ [Perubahan 3]

Tes:
- [Test yang dijalankan]
- [Hasil test]

Files Changed:
- [file1.js] - [deskripsi perubahan]
- [file2.html] - [deskripsi perubahan]

Catatan lanjut:
- [Catatan untuk agent lain]
- [Kandidat improvement]
- [Known issues jika ada]

Status: ✅ DONE & UNLOCKED
```

**Contoh:**

```markdown
## ✅ UNLOCKED - 2026-05-01 18:00 - Kiro

Area:
- Fitur: Export Alumni ke Excel
- Scope: Full-Stack

Perubahan:
- ✅ Backend: Endpoint /api/alumni/export dengan Excel generation (library: exceljs)
- ✅ Frontend: Tombol export terintegrasi, download otomatis
- ✅ UI: Loading spinner + toast notification success/error

Tes:
- node --check semua file yang diubah
- Test manual export 100 alumni → berhasil, file 45KB
- Test di mobile → responsive, tombol tidak double-click
- Test error handling → pesan error jelas

Files Changed:
- src/routes/alumniRoutes.js - Tambah endpoint GET /api/alumni/export
- src/services/alumniService.js - Tambah generateExcel()
- public/alumni_script.js - Tambah handleExport()
- public/css/alumni.css - Tambah loading spinner style

Catatan lanjut:
- Area alumni sekarang UNLOCKED, agent lain boleh lanjut
- Kandidat improvement: tambah filter (tahun lulus, jurusan) sebelum export
- Known issues: Tidak ada

Status: ✅ DONE & UNLOCKED
```

---

## 🚫 Template BLOCKED (Ada Masalah)

Jika ada blocker dan tidak bisa lanjut, **ganti** LOCKED dengan BLOCKED:

```markdown
## 🚫 BLOCKED - YYYY-MM-DD HH:mm - [Agent Name]

Area:
- Fitur: [Nama Fitur]
- Scope: [Backend / Frontend / UI / Full-Stack]

Progress:
- ✅ [Yang sudah selesai]
- 🚫 [Yang terblokir]

Blocker:
- [Deskripsi masalah]
- [Kenapa tidak bisa lanjut]

Need Help:
- [Apa yang dibutuhkan untuk lanjut]

Status: 🚫 BLOCKED - Area UNLOCKED (agent lain bisa bantu)
```

**Contoh:**

```markdown
## 🚫 BLOCKED - 2026-05-01 17:30 - Codex

Area:
- Fitur: Import Santri dari Excel
- Scope: Backend

Progress:
- ✅ File upload endpoint sudah jalan
- 🚫 Excel parsing error untuk format tertentu

Blocker:
- Library exceljs tidak bisa parse file Excel dari user
- Format Excel user berbeda dengan yang diexpect
- Perlu sample file Excel dari user untuk debug

Need Help:
- Sample file Excel yang akan diimport
- Atau spesifikasi format Excel yang diinginkan

Status: 🚫 BLOCKED - Area UNLOCKED (agent lain bisa bantu)
```

---

## 📋 Quick Reference

### Status Icons:
- 🔒 **LOCKED** - Sedang dikerjakan, agent lain jangan sentuh
- 🔄 **IN PROGRESS** - Masih dalam proses
- ✅ **UNLOCKED** - Selesai, area bebas untuk agent lain
- 🚫 **BLOCKED** - Ada masalah, butuh bantuan
- ⏸️ **PAUSED** - Ditunda sementara

### Scope Options:
- **Backend** - API, database, business logic
- **Frontend** - JavaScript, event handlers, fetch API
- **UI** - HTML, CSS, layout, styling
- **Full-Stack** - Backend + Frontend + UI
- **Database** - Schema, migrations, queries
- **Testing** - API tests, frontend tests, integration tests
- **Docs** - Documentation, guides, comments

### Estimasi Waktu:
- **Quick** - < 30 menit
- **Short** - 30 menit - 1 jam
- **Medium** - 1-2 jam
- **Long** - 2-4 jam
- **Very Long** - > 4 jam (sebaiknya dipecah jadi task lebih kecil)

---

## 💡 Tips

1. **Selalu LOCK sebelum mulai** - Cegah konflik dengan agent lain
2. **Update progress jika task lama** - Agar agent lain tahu status
3. **UNLOCK segera setelah selesai** - Jangan block area terlalu lama
4. **Jika ada blocker, UNLOCK** - Agar agent lain bisa bantu
5. **Commit setelah UNLOCK** - Pastikan perubahan tersimpan
6. **Notify user** - Beri tahu user saat mulai dan selesai
