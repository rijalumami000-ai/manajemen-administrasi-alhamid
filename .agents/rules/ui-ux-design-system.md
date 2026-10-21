---
description: Mandatory rules and architectural constraints for frontend UI/UX overhaul and TypeScript migration in Sekolah-Info
globs: frontend/**/*
---

# MANDATORY AGENT RULES: FRONTEND UI/UX OVERHAUL & TYPESCRIPT MIGRATION

> **IMPORTANT**: Dokumen ini merupakan hukum mutlak bagi setiap AI Agent yang bekerja pada repositori `sekolah-info`. Kegagalan mengikuti panduan ini dapat memutus koneksi aplikasi mobile di production dan merusak sistem operasional sekolah/pesantren.

---

## 1. Zero-Touch Backend & API Contract Policy (Prinsip Sakral)

1. **PRODUKSI & APLIKASI MOBILE SEDANG AKTIF**:
   - Terdapat aplikasi Flutter mobile di folder `mobile_absensi/` yang aktif digunakan di production dan mengonsumsi API backend yang sama (`server.js`, `/api/...`).
   - Terdapat integrasi desktop scanner (`desktop-scanner/`) dan sistem keuangan yang berjalan real-time.
2. **LARANGAN KERAS PADA BACKEND & DATABASE**:
   - **JANGAN PERNAH** mengubah signature endpoint API: URL route, HTTP Method (GET/POST/PUT/DELETE), query parameters, maupun path parameters.
   - **JANGAN PERNAH** mengubah struktur response JSON dari backend (nama key, tipe data, status code, format paginasi, format wrapper `{ success, data, message }`).
   - **JANGAN PERNAH** memodifikasi kolom/tabel database yang berpotensi merusak kompatibilitas mundur.
   - **JANGAN PERNAH** mengakses atau mengubah konfigurasi live VPS atau database production secara langsung. Seluruh skema, route, dan model sudah terdokumentasi lengkap dan tersimpan secara lokal di:
     - `server.js` & `src/routes/`
     - `src/database/` & `sql/`
     - `mobile_absensi/lib/`
3. **FRONTEND-ONLY UI/UX OVERHAUL**:
   - Seluruh perubahan tampilan HANYA dilakukan di dalam direktori `frontend/`.
   - Logika bisnis, payload form data, urutan dispatching, validasi input, state management, dan pemanggilan API service di frontend **HARUS 100% PRESERVED (DIPERTAHANKAN)**.

---

## 2. Design System: Option A (Apple macOS Sequoia & VisionOS Liquid Glass)

Seluruh halaman dan komponen yang dirombak **WAJIB** mengikuti identitas visual **Option A**:

### Karakteristik Visual Utama
- **Translucency & Blurs**: Menggunakan `backdrop-filter: blur(20px)` hingga `blur(32px)` dengan `rgba(255, 255, 255, 0.45 - 0.75)`.
- **Specular Highlights (Gleam of Glass)**: Setiap card, table header, pill, dan modal wajib memiliki border atas berkarakter kaca:
  ```scss
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-top: 1.5px solid rgba(255, 255, 255, 0.95);
  ```
- **Depth & Soft Elevation**: Menggunakan layered box-shadows lembut berkarakter modern tactile:
  ```scss
  box-shadow: 
    0 20px 40px -12px rgba(15, 23, 42, 0.08),
    0 1px 3px rgba(15, 23, 42, 0.04),
    inset 0 1px 1px rgba(255, 255, 255, 0.8);
  ```
- **Dynamic Background**: Aurora mesh gradient yang dinamis dan halus, dengan ambient light orbs yang tidak mengalihkan fokus dari data.
- **Micro-tactile Feel**: Hover states yang halus (`transform: translateY(-1.5px)`), active state tactile (`transform: scale(0.98)`).

### Palet Warna Terkurasi (No Generic / AI Slop Colors)
- **Background**: Soft lavender-blue ambient Aurora mesh (`#f1f5f9` ke `#e2e8f0` dengan gradient orbs `#dbeafe`, `#ede9fe`, `#fce7f3`).
- **Primary Text**: Deep Charcoal / Slate 900 (`#0f172a`, `#1e293b`).
- **Secondary / Muted Text**: Slate 500 (`#64748b`).
- **Accent Primary**: Apple System Blue (`#2563eb` - `#1d4ed8`).
- **Status Semantic**:
  - Success/Aktif: Emerald (`#059669`, surface `rgba(16, 185, 129, 0.12)`, border `rgba(110, 231, 183, 0.6)`).
  - Warning/Cuti: Amber (`#d97706`, surface `rgba(245, 158, 11, 0.12)`, border `rgba(252, 211, 77, 0.6)`).
  - Destructive/Pensiun/Hapus: Rose (`#e11d48`, surface `rgba(244, 63, 94, 0.12)`, border `rgba(253, 164, 175, 0.6)`).
  - Info/Mapel: Sapphire Blue (`#2563eb`, surface `rgba(37, 99, 235, 0.12)`).
  - Structural/Jabatan: Amethyst Purple (`#7c3aed`, surface `rgba(124, 58, 237, 0.12)`).

### Aturan Anti "AI Slop"
- **DILARANG** menambahkan widget grafik palsu, counter statistik tiruan, atau badge angka acak yang tidak didukung data riil dari backend.
- **DILARANG** menggunakan warna neon berlebihan, border pelangi, animasi putar yang konstan dan mengganggu produktivitas.
- **DILARANG** menghilangkan atau menyembunyikan tombol fitur (Export Excel, Cetak PDF, Filter, Pagination, dsb.). Tampilan baru harus lebih fungsional dan intuitif, bukan sekadar riasan.

---

## 3. Komponen Standar (Design Anatomy)

Setiap AI Agent harus menggunakan atau menyesuaikan komponen standar berikut:

1. **Floating Glass Header Dock**:
   - Header berbentuk floating capsule (`border-radius: 20px`), judul tegas, subtitle informatif, terintegrasi dengan segmented control pills dan action button utama.
2. **Apple Segmented Control**:
   - Desain rounded pill capsule inset (`border-radius: 9999px`) dengan badge counter count pill pada tiap tab yang aktif dan inaktif.
3. **Liquid Glass Table**:
   - Inset glass container dengan rounded corners (`border-radius: 20px`).
   - Sticky frosted header.
   - 3D spherical lens avatars (untuk guru, santri, user).
   - Frosted status pills & action button capsules.
4. **Master Cards Grid**:
   - Kartu liquid glass dengan 3D lens orb icon (sapphire/amethyst/emerald).
   - Label kode/Arabic subtitle tag.
   - Action buttons (Edit & Hapus) dalam frosted capsule di sisi kanan/bawah.
5. **Modals & Dialogs**:
   - Glass modal card (`.tactile-glass-modal`) dengan backdrop blur pekat (`backdrop-filter: blur(16px)`).
   - Inset form controls (`.tactile-input`, `.tactile-select`).
   - Primary action pill button (`.tactile-modal-btn.primary`) dan soft cancel pill (`.tactile-modal-btn.secondary`).
6. **Alerts & Confirm Dialogs**:
   - Dialog konfirmasi hapus bergaya Apple VisionOS: icon halo merah lembut, pesan konfirmasi eksplisit dengan nama entitas, tombol batal dan hapus yang taktil.
7. **Loading & Skeleton**:
   - Dilarang spinner murah. Gunakan shimmer wave skeleton table (`.tactile-skeleton-table`) dengan gradient translusen.

---

## 4. Migrasi Bertahap JSX -> TSX & JS -> TS

Migrasi ke TypeScript harus dilakukan secara **inkremental, presisi, dan aman**:

1. **Jangan Sekaligus (One Feature at a Time)**:
   - Migrasi dilakukan per halaman dan modul (misalnya: `Kelas` -> `Guru` -> `Santri` -> dsb.).
   - Frontend mengaktifkan `"allowJs": true` di `tsconfig.json`, sehingga `.jsx` dan `.tsx` dapat hidup berdampingan secara harmonis tanpa konflik.
2. **Wajib Buat Interface Terlebih Dahulu**:
   - Setiap halaman/fitur harus memiliki file tipe di `frontend/src/types/<feature>.ts` (contoh: `guru.ts`, `kelas.ts`, `santri.ts`).
   - Interface wajib mencerminkan payload riil dari backend (lihat response di `server.js` atau controller terkait).
   - Hindari penggunaan type `any` tanpa alasan jelas. Gunakan `unknown` jika payload dinamis, lalu berikan type narrowing.
3. **Validasi Wajib Setiap Perubahan**:
   - Setiap kali menyelesaikan refactor satu halaman/komponen:
     1. Jalankan `npm run build` di folder `frontend/`.
     2. Pastikan exit code = 0 (zero errors).
     3. Verifikasi rendering live di dev server (`http://localhost:3001/`).

---

## 5. SOP Alur Kerja AI Agent

Saat diminta merombak sebuah halaman/fitur:
1. **Fase 1 (Audit)**: Buka file halaman `.jsx`, identifikasi semua state, props, modal, pemanggilan API, tombol aksi, dan dialog konfirmasi.
2. **Fase 2 (Contract Verification)**: Periksa service API di `frontend/src/services/` dan route backend di `src/routes/` untuk memastikan payload tidak diubah.
3. **Fase 3 (Type Creation)**: Buat `frontend/src/types/<fitur>.ts` dengan tipe data yang presisi.
4. **Fase 4 (Styling)**: Buat atau update stylesheet SCSS dengan token Liquid Glass (Option A).
5. **Fase 5 (Refactor Component & Page)**: Konversi `.jsx` ke `.tsx`, pasang styling baru, pastikan seluruh handler (`onClick`, `onSubmit`, `onFilter`, dsb.) terhubung 1:1.
6. **Fase 6 (Build & Regression Check)**: Eksekusi `npm run build` dan pastikan tidak ada regresi.
