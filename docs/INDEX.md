# 🗂️ Indeks Lengkap Dokumentasi (Quick Navigation)
### Pondok Pesantren Al-Hamid (Sekolah-Info)

Indeks ini dirancang untuk memudahkan developer, teknisi DevOps, pimpinan pesantren, dan AI Agent menemukan dokumen yang relevan secara cepat.

---

## 🚀 1. Dokumen Utama & Arsitektur

| Dokumen | Tautan | Deskripsi | Target Pembaca |
|---|---|---|---|
| **Master Readme** | [README.md](../README.md) | Ikhtisar menyeluruh ekosistem Al-Hamid, arsitektur, quickstart, dan daftar modul. | Semua Role |
| **Roadmap Sistem** | [ROADMAP.md](./ROADMAP.md) | Rencana strategis, riwayat fase pengembangan, fase aktif, dan milestone masa depan. | PM, Developer |
| **Arsitektur & Topologi** | [ARCHITECTURE.md](./ARCHITECTURE.md) | Diagram topologi sistem, security model, biometrik, scanner OMR, dan aliran data. | Software Architect, DevOps |
| **Master Kontrak REST API** | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Daftar lengkap endpoint, payload request, respons JSON, dan hak akses RBAC. | Backend & Mobile Dev |
| **Panduan Pengembang** | [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | Langkah-langkah setup lokal, konvensi kode, panduan TypeScript, dan checklist pre-commit. | Developer Baru |
| **Panduan Deployment VPS** | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Runbook instalasi Ubuntu 24.04, Nginx, PM2, PostgreSQL, SSL Certbot, dan backup harian. | DevOps, SysAdmin |
| **Master UI/UX Design System** | [MASTER_UI_UX_REDESIGN_GUIDELINES.md](./MASTER_UI_UX_REDESIGN_GUIDELINES.md) | Panduan standar desain kaca Apple macOS Sequoia & VisionOS Liquid Glass (Option A). | Frontend Designer / Dev |

---

## 📱 2. Dokumentasi Sub-Sistem & Klien

| Sub-Sistem | Lokasi Dokumen | Deskripsi |
|---|---|---|
| **Web Frontend (React 19 + Vite)** | [frontend/README.md](../frontend/README.md) | SPA web dengan 40+ halaman operasional, styling SCSS Liquid Glass, dan struktur komponen. |
| **Submodul Keuangan (TS)** | [keuangan/README.md](../keuangan/README.md) | Sub-service TypeScript untuk kas pesantren, SPP, daftar ulang, tagihan, dan kwitansi berseri. |
| **Alhamid One Mobile App** | [mymustahiq/README.md](../mymustahiq/README.md) | Aplikasi Flutter terpadu untuk dewan asatidz dan wali santri (buku induk, nilai, hafalan, chat). |
| **Mobile Absensi Biometrik** | [mobile_absensi/README.md](../mobile_absensi/README.md) | Presensi sholat berjamaah berbasis *Face Recognition* lokal, *Liveness Detection*, dan dual camera. |
| **Desktop OMR Scanner** | [desktop-scanner/README.md](../desktop-scanner/README.md) | Aplikasi desktop Windows WPF C# .NET untuk membaca LJK ujian madrasah secara otomatis. |

---

## 🤖 3. Direktif & Aturan AI Agent

| Dokumen | Lokasi Dokumen | Deskripsi |
|---|---|---|
| **Agent Directives** | [AGENTS.md](../AGENTS.md) | Aturan sakral AI Agent: Zero-Breakage Policy, Option A Design, TypeScript bertahap, dan izin sinkronisasi VPS. |
| **Gemini Master Rules** | [GEMINI.md](../GEMINI.md) | Ringkasan prinsip dan arahan operasional Google Gemini / Antigravity Agent. |

---

## 🔍 4. Panduan Pencarian Cepat Berdasarkan Kebutuhan

### Ingin Memulai Pengembangan Lokal?
1. Baca [README.md](../README.md) untuk ikhtisar ekosistem.
2. Ikuti [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) langkah demi langkah.
3. Jalankan `npm run dev:all` untuk menyalakan backend dan frontend secara bersamaan.

### Ingin Mengetahui Struktur API atau Memperbaiki Integrasi Mobile?
1. Buka [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) untuk memeriksa format endpoint dan response JSON.
2. Pelajari [ARCHITECTURE.md](./ARCHITECTURE.md) untuk memahami aliran otentikasi dual-token JWT.

### Ingin Mendesain atau Memperbarui Halaman Web?
1. Pelajari [MASTER_UI_UX_REDESIGN_GUIDELINES.md](./MASTER_UI_UX_REDESIGN_GUIDELINES.md) untuk aturan Liquid Glass.
2. Pastikan tidak menambahkan "AI Slop" dan patuhi larangan ikon orb pada header halaman.
3. Selalu jalankan `npm run build` di folder `frontend/` untuk memastikan tidak ada error TypeScript.

### Ingin Melakukan Deployment atau Pembaruan di VPS?
1. Ikuti prosedur "Safe Sync" di [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
2. Periksa skrip instalasi awal di [`setup-vps.sh`](../setup-vps.sh).
3. Pastikan migrasi database dijalankan dengan `npm run migrate`.

---

**Terakhir Diperbarui:** 23 Oktober 2026  
**Status Ekosistem:** Production Ready & Mature 🚀
