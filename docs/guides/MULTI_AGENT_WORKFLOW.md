# Multi-Agent Workflow

Dokumen ini adalah aturan kerja bersama saat proyek dikerjakan bergantian oleh beberapa Agent, misalnya Codex, GitHub Copilot, dan Kiro.

Tujuannya sederhana: setiap Agent boleh membantu, tetapi arah perubahan tetap satu, tidak saling menimpa, dan tidak membuat struktur proyek bercabang tanpa sadar.

**Last Updated:** 2026-05-03 | **Version:** 3.0.0 (React + Premium UI)

## Prinsip Utama

1. Satu Agent mengerjakan satu tugas yang jelas.
2. Jangan dua Agent mengubah file atau area fitur yang sama dalam satu sesi kerja.
3. Setiap Agent wajib membaca dokumentasi utama sebelum mengubah kode.
4. Setelah satu tahap stabil, buat commit sebelum pindah ke Agent lain.
5. Jika ada perubahan besar pada struktur, update dokumentasi.
6. **NEW:** Untuk perubahan UI/styling, koordinasi dengan design system yang ada.

## Dokumen Yang Wajib Dibaca

Sebelum Agent mulai bekerja, baca dokumen berikut:

### Core Documentation
- `docs/DEVELOPMENT_GUIDE.md` - Development guidelines
- `docs/PROJECT_STRUCTURE.md` - Project structure
- `docs/ROADMAP.md` - Roadmap & priorities
- `docs/AGENT_NOTES.md` - Activity log
- `docs/PROJECT_STATUS.md` - Current status

### UI/UX Documentation (NEW!)
- `CARA_TESTING_UI_BARU.md` - UI testing guide
- `UI_UPGRADE_MODERN_SUMMARY.md` - UI upgrade details
- `docs/frontend/DESIGN_SYSTEM.md` - Design tokens
- `docs/frontend/STYLING_GUIDE.md` - SCSS best practices

## Pembagian Area Aman

Pembagian ini bukan aturan kaku, tetapi patokan agar pekerjaan tidak bertabrakan.

### Backend

Area:

```text
server.js
db.js
src/database/
src/routes/
src/services/
src/middleware/
src/utils/
database/
tests/api/
```

Cocok untuk:

- API endpoint
- Query database
- Validasi data backend
- Migrasi database
- Test API
- Business logic

### Frontend Components (React)

Area:

```text
frontend/src/components/
  ├── common/      # Reusable components
  ├── features/    # Feature-specific components
  └── layout/      # Layout components
frontend/src/pages/
frontend/src/hooks/
frontend/src/context/
frontend/src/services/
frontend/src/utils/
```

Cocok untuk:

- React components
- Custom hooks
- Context providers
- API services
- Utility functions
- Component logic

### UI Styling & Design (NEW!)

Area:

```text
frontend/src/styles/
  ├── variables.scss          # Design tokens
  ├── mixins.scss             # Reusable patterns
  ├── global.scss             # Global styles
  ├── animations.scss         # Animation library
  ├── responsive.scss         # Responsive utilities
  ├── antd-theme.scss         # Ant Design customization
  └── premium-components.scss # Premium components
frontend/src/components/**/*.scss  # Component styles
frontend/src/pages/**/*.scss       # Page styles
```

Cocok untuk:

- SCSS styling
- Design system updates
- Component styling
- Responsive design
- Animations & transitions
- Theme customization

**⚠️ IMPORTANT:** 
- Always use existing design tokens from `variables.scss`
- Follow mixins from `mixins.scss`
- Don't create inline styles
- Maintain consistency with design system

### HTML & Static Assets

Area:

```text
frontend/index.html
frontend/public/
public/ (legacy - archived)
```

Cocok untuk:

- HTML templates
- Static assets (images, icons)
- Favicon
- Meta tags

### Dokumentasi

Area:

```text
README.md
CHANGELOG.md
docs/
  ├── guides/
  ├── reports/
  ├── frontend/
  └── alumni/
```

Cocok untuk:

- catatan keputusan
- roadmap
- panduan kerja
- ringkasan perubahan

## Aturan Sebelum Mulai

Sebelum menjalankan Agent:

1. Cek status file yang berubah.
2. Baca `docs/AGENT_NOTES.md`.
3. Tentukan area kerja yang jelas.
4. Hindari menyentuh file yang sedang menjadi area Agent lain.
5. Jika perubahan sebelumnya belum dites, tes dulu sebelum lanjut.

## Aturan Saat Bekerja

- Jangan melakukan refactor besar sambil menambah fitur besar dalam tugas yang sama.
- Jangan memindahkan file tanpa memperbarui import dan dokumentasi.
- Jangan mengubah API response tanpa mengecek frontend yang memakainya.
- Jangan mengubah SQL tanpa mengecek endpoint terkait.
- Jangan menghapus file lama sebelum yakin tidak dipakai.

## Aturan Setelah Selesai

Setelah Agent selesai:

1. Jalankan pengecekan yang relevan.
2. Tes manual fitur yang disentuh.
3. Update `docs/AGENT_NOTES.md`.
4. Update `docs/PROJECT_STRUCTURE.md` jika struktur berubah.
5. Commit jika tahap sudah stabil.

## Format Catatan Agent

Gunakan format ini di `docs/AGENT_NOTES.md`:

```markdown
## YYYY-MM-DD HH:mm - Agent

Area:
- public/js/features/santriFeature.js

Perubahan:
- Memindahkan logika tabel santri ke modul fitur.

Tes:
- node --check public/script.js
- Tes manual Data Santri di browser

Catatan lanjut:
- Validasi form santri masih bisa diperkuat.
```

## Red Flag

Berhenti dulu dan rapikan koordinasi jika terjadi:

- Banyak konflik saat merge.
- Fitur yang sudah aman tiba-tiba rusak setelah Agent lain bekerja.
- Ada dua pola kode berbeda untuk hal yang sama.
- Dokumentasi tidak lagi cocok dengan struktur repo.
- Agent tidak tahu perubahan terakhir yang terjadi.

## Rekomendasi Alur Harian

1. Buka `docs/AGENT_NOTES.md`.
2. Pilih satu tugas dari `docs/ROADMAP.md`.
3. Kerjakan hanya area yang relevan.
4. Tes.
5. Update catatan.
6. Commit saat stabil.
