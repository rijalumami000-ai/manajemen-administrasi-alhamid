# GEMINI.md — Master Directives for Google Gemini / Antigravity Agent

Dokumen ini memuat direktif utama pengembangan frontend dan UI/UX untuk repositori **Sekolah-Info**.

Lihat panduan lengkap pada:
- **Directives Utama**: [AGENTS.md](file:///d:/source/sekolah-info/AGENTS.md)
- **Master Spesifikasi UI/UX & Migrasi**: [MASTER_UI_UX_REDESIGN_GUIDELINES.md](file:///d:/source/sekolah-info/docs/MASTER_UI_UX_REDESIGN_GUIDELINES.md)
- **Rules Agent**: [.agents/rules/ui-ux-design-system.md](file:///d:/source/sekolah-info/.agents/rules/ui-ux-design-system.md)

### Ringkasan Prinsip:
1. **Sistem Produksi & VPS**: Jaga kontrak publik API backend (`server.js`, `src/routes/`), skema DB (`sql/`), dan response JSON agar aplikasi mobile (`mobile_absensi/`) selalu kompatibel. Akses dan sinkronisasi server VPS production diperbolehkan sesuai instruksi pengguna.
2. **Desain Option A**: Apple macOS Sequoia & VisionOS Liquid Glass (translucency, specular highlights, depth, aurora mesh, 3D lens orbs).
3. **No AI Slop**: Jangan menambahkan elemen fiktif/metrik palsu; pertahankan 100% logika dan fitur bisnis asli.
4. **Incremental TypeScript**: Buat interface di `frontend/src/types/`, migrasi per halaman, dan verifikasi selalu dengan `npm run build`.
5. **Konsistensi Desain Baku**: Header halaman **DILARANG** menggunakan ikon orb di samping judul (`.tactile-page-header`), judul murni teks `h2.page-title` (25px bold) & `p.page-subtitle` (13.5px). Ikon hanya pada tombol aksi, tab, cell tabel, dan status badge. Ikuti spesifikasi Bagian 4 di [MASTER_UI_UX_REDESIGN_GUIDELINES.md](file:///d:/source/sekolah-info/docs/MASTER_UI_UX_REDESIGN_GUIDELINES.md).

