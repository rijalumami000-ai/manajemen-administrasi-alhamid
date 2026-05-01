# Multi-Agent Workflow

Dokumen ini adalah aturan kerja bersama saat proyek dikerjakan bergantian oleh beberapa Agent, misalnya Codex, GitHub Copilot, dan Kiro.

Tujuannya sederhana: setiap Agent boleh membantu, tetapi arah perubahan tetap satu, tidak saling menimpa, dan tidak membuat struktur proyek bercabang tanpa sadar.

## Prinsip Utama

1. Satu Agent mengerjakan satu tugas yang jelas.
2. Jangan dua Agent mengubah file atau area fitur yang sama dalam satu sesi kerja.
3. Setiap Agent wajib membaca dokumentasi utama sebelum mengubah kode.
4. Setelah satu tahap stabil, buat commit sebelum pindah ke Agent lain.
5. Jika ada perubahan besar pada struktur, update dokumentasi.

## Dokumen Yang Wajib Dibaca

Sebelum Agent mulai bekerja, baca dokumen berikut:

- `docs/DEVELOPMENT_GUIDE.md`
- `docs/PROJECT_STRUCTURE.md`
- `docs/ROADMAP.md`
- `docs/AGENT_NOTES.md`

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
src/utils/
sql/
tests/api/
```

Cocok untuk:

- API endpoint
- query database
- validasi data backend
- migrasi database
- test API

### Frontend Feature Logic

Area:

```text
public/script.js
public/js/features/
public/js/utils/
public/js/config/
tests/frontend/
```

Cocok untuk:

- event handler
- fetch API
- render tabel/kartu
- form submit
- filter, search, pagination

### UI, HTML, dan Styling

Area:

```text
public/index.html
public/alumni.html
public/styles.css
public/css/
```

Cocok untuk:

- layout
- modal
- responsive design
- visual polish
- perbaikan CSS

### Dokumentasi

Area:

```text
README.md
docs/
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
