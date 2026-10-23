# 📚 Pusat Dokumentasi Proyek (Documentation Hub)
### Pondok Pesantren Al-Hamid (Sekolah-Info)

Selamat datang di pusat dokumentasi resmi ekosistem **Sekolah-Info / Pondok Pesantren Al-Hamid**. Direktori ini menyimpan seluruh panduan arsitektur, spesifikasi desain, kontrak REST API, panduan pengembang, serta runbook operasional server produksi.

---

## 🧭 Panduan Cepat Navigasi Dokumentasi

Jika Anda mencari informasi spesifik, silakan gunakan tautan berikut:

### 1. 🏗️ Arsitektur & Perencanaan Sistem
- **[ROADMAP.md](./ROADMAP.md)** — Rencana jangka panjang, milestone terkini, dan riwayat fase pengembangan sistem.
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Topologi menyeluruh sistem, lapisan aplikasi, model keamanan dual-token JWT, biometrik wajah, dan integrasi hardware scanner.

### 2. 🔌 Kontrak & Integrasi API
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** — Daftar lengkap 30+ router REST API, payload request/response JSON, dan skema otorisasi Role-Based Access Control (RBAC).

### 3. 🎨 Standar Visual & Desain UI/UX
- **[MASTER_UI_UX_REDESIGN_GUIDELINES.md](./MASTER_UI_UX_REDESIGN_GUIDELINES.md)** — Panduan implementasi antarmuka kaca Apple macOS Sequoia & VisionOS Liquid Glass (Option A), specular edge highlights, inset shadows, dan larangan "AI Slop".

### 4. 💻 Panduan Pengembang (Development)
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** — Langkah instalasi lingkungan lokal, konvensi penulisan kode, penambahan rute dan halaman baru, serta pedoman migrasi database PostgreSQL.

### 5. ☁️ Panduan Deployment VPS Produksi
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** — Runbook operasional untuk provisioning server Ubuntu 24.04 LTS, konfigurasi Nginx reverse proxy, PM2 process management, sertifikat SSL Let's Encrypt, dan backup database otomatis.

### 6. 🗂️ Indeks Lengkap
- **[INDEX.md](./INDEX.md)** — Indeks pencarian cepat topik berdasarkan peran (Developer, DevOps, QA, UI Designer).

---

## 📁 Dokumentasi Sub-Modul Proyek

Selain dokumentasi tingkat sistem di folder ini, masing-masing sub-proyek memiliki dokumentasi teknis spesifik di foldernya:
- 🌐 **[Frontend React 19 Web App](../frontend/README.md)**
- 💰 **[Modul Keuangan Pesantren](../keuangan/README.md)**
- 📱 **[Aplikasi Mobile Alhamid One](../mymustahiq/README.md)**
- 🤳 **[Aplikasi Mobile Absensi Biometrik](../mobile_absensi/README.md)**
- 🖨️ **[Aplikasi Desktop OMR Scanner](../desktop-scanner/README.md)**

---

## ⚠️ Pedoman Penting untuk Kontributor & AI Agent

1. **Zero-Breakage Policy**: Backend dan API adalah kontrak publik yang aktif dikonsumsi oleh aplikasi mobile Flutter dan desktop scanner di production. Dilarang mengubah struktur response tanpa persetujuan arsitek sistem.
2. **TypeScript Integrity**: Seluruh penambahan kode frontend dan backend wajib memiliki interface yang jelas di `types/` dan lolos pengujian `npm run build` tanpa error.
3. **Pembaruan Dokumentasi**: Setiap penambahan rute baru atau perubahan alur data wajib dicatat pada `API_DOCUMENTATION.md` dan `ROADMAP.md`.

---

**Terakhir Diperbarui:** 23 Oktober 2026  
**Tim Pengembang:** IT & Digitalisasi Pondok Pesantren Al-Hamid Cintamulya
