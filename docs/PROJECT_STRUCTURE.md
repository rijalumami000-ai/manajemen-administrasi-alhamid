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
    alumniRoutes.js         ← Refactored (374 → 141 lines)
    kelasRoutes.js
    kamarRoutes.js
    prestasiRoutes.js
    pelanggaranRoutes.js
  services/
    tahunAjaranService.js
    alumniService.js        ← NEW (363 lines, business logic)
  utils/
    normalizers.js
    databaseErrors.js
```

- `routes`: alamat API per fitur (HTTP handling only).
- `services`: logika bisnis yang dipakai lebih dari satu route, atau logic yang kompleks.
- `utils`: fungsi kecil yang tidak bergantung ke tampilan atau route.
- `database`: persiapan database saat server menyala.

**Note:** Alumni routes sudah di-refactor dengan service layer pattern untuk separation of concerns.

## Frontend

Frontend masih memakai HTML, CSS, dan JavaScript biasa. File `public/script.js` masih menjadi pengendali halaman utama, tetapi fungsi umum mulai dipindah ke folder `public/js`.

```text
public/
  index.html
  alumni.html               ← Alumni page
  script.js
  alumni_script.js          ← Refactored (821 → 83 lines)
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
      alumniFeature.js      ← NEW (151 lines, orchestrator)
    utils/
      formatters.js
      forms.js
      messages.js
      pagination.js
      santriAutocomplete.js
      alumniDisplay.js      ← NEW (147 lines, display & rendering)
      alumniModal.js        ← NEW (193 lines, modal management)
      alumniCrud.js         ← NEW (212 lines, CRUD operations)
      alumniDetail.js       ← NEW (205 lines, detail view & tabs)
```

- `config`: data tetap atau konfigurasi frontend.
- `css`: pecahan styling dari `styles.css`; file `styles.css` tetap menjadi pintu masuk utama.
- `features`: logika fitur yang sudah dipisahkan dari `script.js` dan `alumni_script.js`.
- `utils`: fungsi bantu yang bisa dipakai ulang.
- `script.js`: alur utama halaman dashboard.
- `alumni_script.js`: entry point untuk halaman alumni (sudah modular).

**Note:** Alumni feature sudah di-refactor menjadi modular dengan 5 util modules untuk better organization.

## Arah Berikutnya

1. ✅ **Alumni feature sudah di-refactor** (Frontend & Backend) - DONE
2. Pecah `public/script.js` per fitur: santri, guru, kelas, kamar, pelanggaran, prestasi (ikuti pola alumni).
3. Extract service layer untuk routes lain (santriRoutes, guruRoutes, dll) - ikuti pola alumniService.
4. Pecah `public/styles.css` per area tampilan jika ukurannya makin sulit dibaca.
5. Pertimbangkan React/Vite hanya kalau kebutuhan tampilan sudah makin kompleks.

## Pola Refactor (Alumni Pattern)

Alumni feature bisa dijadikan template untuk refactor fitur lain:

### Frontend Pattern:
```
[feature]_script.js (entry point, ~80-100 lines)
  ↓ imports
js/features/[feature]Feature.js (orchestrator, ~150 lines)
  ↓ imports
js/utils/[feature]Display.js (display, ~150 lines)
js/utils/[feature]Modal.js (modals, ~200 lines)
js/utils/[feature]Crud.js (CRUD, ~200 lines)
js/utils/[feature]Detail.js (detail view, ~200 lines)
```

### Backend Pattern:
```
routes/[feature]Routes.js (HTTP routes, ~150 lines)
  ↓ calls
services/[feature]Service.js (business logic, ~350 lines)
  ↓ uses
utils/normalizers.js, databaseErrors.js
```

**Benefits:**
- Modular & maintainable
- Easy to test
- Clear separation of concerns
- Consistent across features
