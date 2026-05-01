# 🚀 Quick Reference - Multi-Agent Workflow

Panduan cepat untuk koordinasi multi-agent.

---

## 📖 Dokumen Penting

| Dokumen | Fungsi |
|---------|--------|
| `AGENT_NOTES.md` | **CEK DULU!** Status LOCK/UNLOCK real-time |
| `AGENT_AGREEMENT.md` | Kesepakatan & aturan main |
| `AGENT_NOTES_TEMPLATE.md` | Template format LOCK/UNLOCK |
| `ROADMAP.md` | Prioritas task |
| `DEVELOPMENT_GUIDE.md` | Panduan development |
| `PROJECT_STRUCTURE.md` | Struktur proyek |

---

## ⚡ Workflow Cepat

### 1️⃣ Sebelum Mulai

```bash
# 1. Baca AGENT_NOTES.md
# 2. Cek apakah area yang mau dikerjakan sudah di-LOCK?
#    - Jika LOCKED → Pilih task lain atau tunggu
#    - Jika UNLOCKED → Lanjut ke step 3
# 3. Pull latest (jika ada git)
# 4. LOCK area di AGENT_NOTES.md
# 5. Notify user: "Mulai kerja [task], estimasi [waktu]"
```

### 2️⃣ Saat Kerja

```bash
# 1. Fokus pada task yang di-LOCK
# 2. Boleh sentuh file lain jika diperlukan (dalam scope task)
# 3. Test setiap perubahan
# 4. Update progress jika task lama (>2 jam)
```

### 3️⃣ Setelah Selesai

```bash
# 1. Test: node --check [files]
# 2. Test manual fitur
# 3. UNLOCK di AGENT_NOTES.md
# 4. Commit dengan message jelas
# 5. Notify user: "Task [nama] selesai"
```

---

## 🔒 Format LOCK (Copy-Paste)

```markdown
## 🔒 LOCKED - 2026-05-01 16:00 - [Agent Name]

Area:
- Fitur: [Nama Fitur]
- Scope: [Backend / Frontend / UI / Full-Stack]
- Files: 
  - [file1.js]
  - [file2.html]

Task:
- [Task 1]
- [Task 2]

Estimasi: [waktu]
Status: 🔄 IN PROGRESS
```

---

## ✅ Format UNLOCK (Copy-Paste)

```markdown
## ✅ UNLOCKED - 2026-05-01 18:00 - [Agent Name]

Area:
- Fitur: [Nama Fitur]
- Scope: [Backend / Frontend / UI / Full-Stack]

Perubahan:
- ✅ [Perubahan 1]
- ✅ [Perubahan 2]

Tes:
- [Test yang dijalankan]

Files Changed:
- [file1.js] - [deskripsi]

Catatan lanjut:
- [Catatan untuk agent lain]

Status: ✅ DONE & UNLOCKED
```

---

## 🎯 Scope Options

- **Backend** - API, database, business logic
- **Frontend** - JavaScript, event handlers, fetch
- **UI** - HTML, CSS, layout, styling
- **Full-Stack** - Backend + Frontend + UI
- **Database** - Schema, migrations, queries
- **Testing** - Tests
- **Docs** - Documentation

---

## 🚨 Red Flags

| Situasi | Action |
|---------|--------|
| Area sudah LOCKED | Pilih task lain atau tunggu |
| Merge conflict | Stop, koordinasi |
| Fitur rusak | Investigate, rollback |
| Tidak jelas status | Baca AGENT_NOTES atau tanya |
| User minta stop | Stop immediately |

---

## ✅ Checklist Commit

- [ ] Code di-test (`node --check`)
- [ ] Manual test jalan
- [ ] No console.log debug
- [ ] Import path benar
- [ ] Error handling ada
- [ ] AGENT_NOTES updated (UNLOCKED)
- [ ] Commit message jelas
- [ ] User di-notify

---

## 💡 Tips

1. **Cek AGENT_NOTES dulu** sebelum mulai
2. **LOCK area** sebelum kerja
3. **UNLOCK segera** setelah selesai
4. **Jika blocker, UNLOCK** agar agent lain bisa bantu
5. **Commit sering** untuk safety
6. **Komunikasi jelas** dengan user

---

## 🎓 Contoh Cepat

### Kiro mau kerja Export Alumni:

```markdown
## 🔒 LOCKED - 2026-05-01 16:00 - Kiro
Area: Export Alumni (Full-Stack)
Files: alumniRoutes.js, alumni_script.js, alumni.css
Task: Backend API + Frontend button + UI loading
Estimasi: 2 jam
Status: 🔄 IN PROGRESS
```

### 2 jam kemudian:

```markdown
## ✅ UNLOCKED - 2026-05-01 18:00 - Kiro
Area: Export Alumni
Perubahan:
- ✅ Backend: /api/alumni/export
- ✅ Frontend: Export button
- ✅ UI: Loading spinner
Tes: Manual test 100 alumni → OK
Status: ✅ DONE & UNLOCKED
```

---

## 📞 Need Help?

- Baca: `AGENT_AGREEMENT.md` (detail lengkap)
- Template: `AGENT_NOTES_TEMPLATE.md`
- Tanya user jika tidak jelas

---

**Remember:** Semua agent = full-stack capable. Koordinasi = kunci sukses! 🚀
