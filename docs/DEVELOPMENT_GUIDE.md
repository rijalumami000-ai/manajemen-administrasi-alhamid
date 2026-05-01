# Development Guide

Panduan ini adalah pintu masuk utama untuk pengembangan proyek `sekolah-info`.

## Tujuan Proyek

`sekolah-info` adalah sistem informasi internal pesantren berbasis:

- Backend: Node.js, Express, PostgreSQL
- Frontend: HTML, CSS, JavaScript module tanpa framework
- Database schema: `sql/init.sql`

## Struktur Saat Ini

Ringkasan struktur utama:

```text
server.js
db.js
src/
  database/
  routes/
  services/
  utils/
public/
  index.html
  alumni.html
  script.js
  alumni_script.js
  styles.css
  css/
  js/
    config/
    features/
    utils/
sql/
tests/
docs/
```

Detail struktur ada di `docs/PROJECT_STRUCTURE.md`.

## Arsitektur Singkat

`server.js` hanya menyalakan Express, static file, route API, dan database init.

Route backend dipisah per fitur di `src/routes/`.

Frontend utama memakai `public/script.js` sebagai pengatur halaman, lalu logika fitur besar berada di `public/js/features/`.

Styling tetap dimuat dari `public/styles.css`, tetapi isi CSS sudah dipecah ke `public/css/`.

## Aturan Perubahan

### Backend

- Tambahkan endpoint baru di route fitur yang sesuai.
- Letakkan helper umum di `src/utils/`.
- Letakkan logika reusable di `src/services/`.
- Jangan ubah bentuk response API tanpa mengecek frontend.

### Frontend

- Untuk fitur besar, buat atau lanjutkan file di `public/js/features/`.
- Untuk helper kecil, gunakan `public/js/utils/`.
- Jangan menaruh banyak logika baru langsung di `public/script.js` kecuali hanya penghubung.
- Jika menambah module baru, pastikan import path relatif benar.

### CSS

- Jangan menambah styling besar langsung ke `styles.css`.
- Gunakan file CSS di `public/css/`.
- `styles.css` hanya menjadi pintu masuk import.

### Database

- Perubahan schema dilakukan di `sql/init.sql`.
- Setelah ubah schema, cek endpoint yang membaca/menulis tabel terkait.
- Hindari rename kolom tanpa migration plan.

## Pengecekan Minimal

Untuk perubahan JavaScript:

```bash
node --check server.js
node --check public/script.js
```

Jika menyentuh banyak file JS:

```bash
Get-ChildItem -Path public\js -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
Get-ChildItem -Path src -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Untuk perubahan UI:

- reload browser
- cek sidebar
- cek tabel
- cek modal tambah/edit
- cek submit form
- cek tampilan mobile bila relevan

## Pola Commit

Gunakan commit kecil dan jelas:

```text
refactor: split frontend features
feat: add alumni export
fix: handle empty tahun ajaran
docs: add multi-agent workflow
```

Jangan campur refactor besar dengan fitur baru dalam commit yang sama.

## Untuk Agent

Sebelum mengubah kode:

1. Baca `docs/AGENT_NOTES.md`.
2. Baca `docs/ROADMAP.md`.
3. Pastikan area kerja jelas.
4. Setelah selesai, update `docs/AGENT_NOTES.md`.
