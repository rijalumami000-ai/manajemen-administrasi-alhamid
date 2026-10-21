# AGENTS.md — Sekolah-Info Autonomous AI Agent Directives

Selamat datang di repositori **Sekolah-Info / Pondok Pesantren Al-Hamid**.

Repositori ini memuat sistem informasi akademik, keuangan, dan kesiswaan pesantren yang **aktif digunakan di lingkungan production**, serta terintegrasi langsung dengan aplikasi mobile Flutter (`mobile_absensi/`) dan desktop scanner.

---

## ⚠️ 1. ATURAN EMAS (THE GOLDEN RULES)

1. **JANGAN MERUSAK SISTEM PRODUKSI & MOBILE APP**:
   - Backend API (`server.js`, `src/routes/apiRoutes.js`), skema database (`sql/`, `src/database/`), dan struktur response JSON adalah **CONTRACT PUBLIK**.
   - Dilarang mengubah nama route, method HTTP, query param, payload body, atau field JSON yang dikembalikan oleh backend.
   - Jangan menyentuh atau meminta akses ke live server / live VPS production. Seluruh kode backend dan skema database sudah ada di workspace lokal ini untuk dianalisis secara aman.
2. **LINGKUP TUGAS UI/UX ADALAH PURE FRONTEND**:
   - Seluruh perubahan desain, styling, dan migrasi TypeScript HANYA dilakukan di dalam folder `frontend/`.
   - Logika bisnis, validasi form, hak akses (RBAC), kalkulasi nilai, dan flow data harus dipertahankan 100%.
3. **KONSEP DESAIN: OPTION A (APPLE LIQUID GLASS / macOS SEQUOIA & VisionOS)**:
   - Desain wajib menggunakan konsep **Option A**: Translucent Liquid Glass, Specular Edge Highlights (`border-top: 1.5px solid rgba(255,255,255,0.95)`), Inset Shadows, 3D Spherical Lens Orbs, Soft Elevation, dan Aurora Mesh Background.
   - Hindari "AI Slop": Dilarang membuat widget buatan, kartu data fiktif, animasi berlebihan, atau warna neon yang tidak selaras.
4. **MIGRASI TYPESCRIPT INKREMENTAL & AMAN**:
   - Konversi `.jsx` ke `.tsx` dan `.js` ke `.ts` dilakukan bertahap per halaman/fitur.
   - Wajib mendefinisikan interface di `frontend/src/types/<feature>.ts` terlebih dahulu.
   - Wajib menjalankan `npm run build` di `frontend/` dan memastikan `0 errors` pada setiap penyelesaian tugas.
5. **KONSISTENSI DESAIN & TIPOGRAFI BAKU**:
   - Header Halaman (`.tactile-page-header`): **DILARANG** menggunakan ikon orb/lensa di samping judul; teks judul murni `h2.page-title` (25px bold) dan `p.page-subtitle` (13.5px).
   - Ikon hanya digunakan pada tombol aksi, tab/segmented control, cell tabel, dan status badge.
   - Wajib mengikuti standar baku konsistensi tombol, modal, inline edit, dropdown, tabel, dan warna sesuai Bagian 4 di [MASTER_UI_UX_REDESIGN_GUIDELINES.md](file:///d:/source/sekolah-info/docs/MASTER_UI_UX_REDESIGN_GUIDELINES.md).

---

## 📚 2. DOKUMENTASI LENGKAP & REFERENSI
- Master Panduan Desain & Migrasi: [MASTER_UI_UX_REDESIGN_GUIDELINES.md](file:///d:/source/sekolah-info/docs/MASTER_UI_UX_REDESIGN_GUIDELINES.md)
- Rules Spesifik Agent: [.agents/rules/ui-ux-design-system.md](file:///d:/source/sekolah-info/.agents/rules/ui-ux-design-system.md)
- Indeks Dokumentasi Proyek: [INDEX.md](file:///d:/source/sekolah-info/docs/INDEX.md)
