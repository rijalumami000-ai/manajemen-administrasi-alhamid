# Struktur Proyek

Dokumen ini menjelaskan arah penataan proyek `sekolah-info`.

## Backend

Backend tetap memakai Node.js dan Express. File utama `server.js` sekarang hanya bertugas menyiapkan aplikasi, memasang route, melayani file frontend, dan menjalankan server.

```text
src/
  database/
    initDatabase.js
  routes/
    apiRoutes.js
    santriRoutes.js
    guruRoutes.js
    alumniRoutes.js
    kelasRoutes.js
    kamarRoutes.js
    prestasiRoutes.js
    pelanggaranRoutes.js
  services/
    tahunAjaranService.js
  utils/
    normalizers.js
    databaseErrors.js
```

- `routes`: alamat API per fitur.
- `services`: logika yang dipakai lebih dari satu route.
- `utils`: fungsi kecil yang tidak bergantung ke tampilan atau route.
- `database`: persiapan database saat server menyala.

## Frontend

Frontend masih memakai HTML, CSS, dan JavaScript biasa. File `public/script.js` masih menjadi pengendali halaman utama, tetapi fungsi umum mulai dipindah ke folder `public/js`.

```text
public/
  index.html
  script.js
  styles.css
  css/
    base.css
    layout.css
    components.css
    modals.css
    features-kelas.css
    features-guru.css
    features-extra.css
  js/
    config/
      tahunAjaran.js
    features/
      guruFeature.js
      kelasFeature.js
      kamarFeature.js
      pelanggaranPrestasiFeature.js
      santriFeature.js
    utils/
      formatters.js
      forms.js
      messages.js
      pagination.js
      santriAutocomplete.js
```

- `config`: data tetap atau konfigurasi frontend.
- `css`: pecahan styling dari `styles.css`; file `styles.css` tetap menjadi pintu masuk utama.
- `features`: logika fitur yang sudah dipisahkan dari `script.js`.
- `utils`: fungsi bantu yang bisa dipakai ulang.
- `script.js`: alur utama halaman dashboard.

## Arah Berikutnya

1. Pecah `public/script.js` per fitur: santri, guru, kelas, kamar, pelanggaran, prestasi.
2. Pecah `public/styles.css` per area tampilan jika ukurannya makin sulit dibaca.
3. Pertimbangkan React/Vite hanya kalau kebutuhan tampilan sudah makin kompleks.
