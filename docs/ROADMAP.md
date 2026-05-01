# Roadmap

Roadmap ini membantu semua Agent memilih pekerjaan berikutnya tanpa saling bertabrakan.

## Status Fondasi

Selesai:

- Backend dipisah ke `src/routes`, `src/services`, `src/utils`, dan `src/database`.
- Frontend utama dipisah ke `public/js/features`.
- CSS dipisah ke `public/css`.
- `server.js`, `public/script.js`, dan `public/styles.css` sudah menjadi file pintu masuk yang lebih kecil.

## Prioritas 1 - Stabilkan Setelah Refactor

- Tes manual semua fitur utama:
  - Dashboard
  - Santri
  - Tahun Ajaran
  - Kelas
  - Kamar
  - Guru
  - Pelanggaran
  - Prestasi
  - Alumni
- Commit titik stabil refactor.
- Catat hasil tes di `docs/AGENT_NOTES.md`.

## Prioritas 2 - Rapikan Alumni

Alumni belum ikut direfactor penuh.

Area kemungkinan:

```text
public/alumni.html
public/alumni_script.js
src/routes/alumniRoutes.js
docs/alumni/
```

Target:

- Pisahkan `alumni_script.js` jika sudah besar.
- Samakan pola UI dengan dashboard utama.
- Cek migrasi santri ke alumni.
- Cek detail alumni dan riwayat.

## Prioritas 3 - Validasi dan Error Handling

Target:

- Validasi form frontend lebih jelas.
- Pesan error backend lebih konsisten.
- Cegah submit ganda.
- Tambahkan state loading sederhana.

## Prioritas 4 - Test Otomatis Ringan

Target:

- Test API utama:
  - summary
  - santri
  - guru
  - kelas
  - kamar
  - pelanggaran
  - prestasi
  - alumni
- Test frontend smoke sederhana untuk halaman utama.

## Prioritas 5 - Fitur Baru

Kandidat:

- Login dan role pengguna.
- Export data.
- Backup database.
- Import data santri/guru.
- Audit log perubahan data.

## Yang Sebaiknya Ditunda

- Migrasi ke React/Vite.
- Redesign UI besar-besaran.
- Perubahan schema database besar.

Tunda sampai fondasi sekarang sudah dites dan dibuat commit stabil.
