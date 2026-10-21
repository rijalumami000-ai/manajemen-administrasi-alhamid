# MASTER UI/UX REDESIGN & TYPESCRIPT MIGRATION GUIDELINES
## Pondok Pesantren Al-Hamid (Sekolah-Info)
### Standar Arsitektur, Desain Kaca Apple (Option A), Keamanan API, dan Protokol AI Agent

---

## 1. Latar Belakang & Konteks Ekosistem

Aplikasi **Sekolah-Info** merupakan sistem informasi inti (core operational system) Pondok Pesantren Al-Hamid yang telah berjalan matang (*mature*) di lingkungan production. Ekosistem ini tidak berdiri sendiri, melainkan terhubung langsung dengan beberapa komponen kritis:

1. **Aplikasi Mobile Flutter (`mobile_absensi/`)**:
   - Digunakan oleh santri, wali santri, dan dewan asatidz untuk absensi kehadiran, monitoring hafalan, dan perizinan.
   - Mengonsumsi endpoint REST API yang sama dari backend web (`server.js`, `/api/...`).
2. **Desktop Scanner (`desktop-scanner/`)**:
   - Integrasi perangkat keras pemindai kartu santri (barcode/RFID) untuk absensi gerbang dan makan.
3. **Sistem Keuangan & Akademik Pesantren**:
   - Transaksi kas, SPP santri, penilaian ujian, pencetakan rapor, dan buku induk.

### Maksud & Tujuan Rombak Tampilan (UI/UX Redesign)
User menginginkan perubahan total tampilan antarmuka web menjadi sangat modern, berkelas tinggi, dan memukau melalui konsep **Option A: Apple macOS Sequoia & VisionOS Liquid Glass (Modern Tactile UI)**. Namun, karena sistem telah beroperasi secara aktif di production, **seluruh perubahan tampilan HARUS dilakukan dengan sangat hati-hati, terukur, dan tidak boleh mengganggu logika data, API, maupun stabilitas aplikasi mobile**.

---

## 2. Prinsip Sakral: Zero-Breakage Policy (Keamanan API & Produksi)

Setiap pengembang maupun AI Agent **WAJIB** tunduk pada prinsip keamanan berikut:

### A. Kebijakan "Pure Frontend Scope"
- **DILARANG KERAS** memodifikasi logika backend, routing, middleware auth, maupun struktur database pada:
  - `server.js`
  - `src/routes/`
  - `src/controllers/`
  - `src/database/` & `sql/`
- **DILARANG MENGAKSES LIVE VPS / LIVE DATABASE PRODUCTION**:
  - Seluruh informasi mengenai skema database (`sql/init.sql`, `sql/keuangan_schema.sql`, dsb.), relasi tabel, model data, dan kontrak API sudah tersedia 100% secara lokal di dalam repositori ini.
  - Pemeriksaan payload dan query dapat dilakukan langsung dengan membaca file backend lokal, sehingga **TIDAK ADA RISIKO** menyentuh atau merusak database production.

### B. Proteksi Kontrak API (API Contract Immutability)
1. **URL Route & HTTP Method Tetap Sama**:
   - Jangan pernah mengubah URL endpoint (contoh: `/api/guru`, `/api/kelas`, `/api/santri`) atau metode HTTP-nya (`GET`, `POST`, `PUT`, `DELETE`).
2. **Format Response JSON Tidak Boleh Berubah**:
   - Backend mengembalikan struktur baku: `{ success: boolean, data: ..., message: string }` atau paginasi `{ data: [...], total: ... }`. Frontend baru harus mengonsumsi data sesuai struktur ini tanpa meminta perubahan backend.
3. **Payload Form & Query Parameter Tetap Valid**:
   - Parameter pencarian, paginasi (`page`, `limit`), filter status, dan multipart upload foto/TTD harus dikirimkan persis sesuai ekspektasi controller backend.

---

## 3. Master Design System: Option A (Apple macOS Sequoia & VisionOS Liquid Glass)

Konsep visual yang diadopsi adalah estetika kaca cair generasi baru dari Apple macOS Sequoia dan VisionOS, dipadukan dengan sensasi fisik-taktil (*New Skeuomorphism / Tactile Glass*).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AURORA MESH GRADIENT BACKGROUND                       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🍏 FLOATING GLASS HEADER DOCK                                         │  │
│  │ [Judul Halaman] [Segmented Control Pills: Guru 21 | Mapel 43] [+ Btn] │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 🔍 INSET FROSTED FILTER BAR                                           │  │
│  │ [ 🔎 Inset Search Pill ]  [ CustomSelect Dropdown ▼ ]  [ Status ▼ ]   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 💎 VISIONOS LIQUID GLASS TABLE CONTAINER                              │  │
│  │  - Sticky Frosted Header with Specular Highlights                     │  │
│  │  - 3D Spherical Lens Avatars                                          │  │
│  │  - Frosted Status Pills (Aktif / Cuti / Pensiun)                      │  │
│  │  - Frosted Capsule Action Buttons (Edit, Foto, TTD, Hapus)            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Karakteristik Visual Utama

#### 1. Translucency & Refraction (Efek Kaca Cair)
- Menggunakan `backdrop-filter: blur(20px)` hingga `blur(32px)`.
- Background material semi-transparan: `rgba(255, 255, 255, 0.55)` hingga `rgba(255, 255, 255, 0.75)`.

#### 2. Specular Edge Highlight (Kilauan Cahaya Kaca)
Setiap panel kaca memiliki pencahayaan tepi atas yang tajam menirukan pantulan cahaya fisik:
```scss
border: 1px solid rgba(255, 255, 255, 0.70);
border-top: 1.5px solid rgba(255, 255, 255, 0.95);
```

#### 3. Optical Depth & Layered Shadows (Kedalaman Optik)
Kombinasi bayangan ambient halus dan bayangan kontak tajam:
```scss
box-shadow: 
  0 20px 40px -12px rgba(15, 23, 42, 0.08),
  0 1px 3px rgba(15, 23, 42, 0.04),
  inset 0 1px 1px rgba(255, 255, 255, 0.85);
```

#### 4. Palet Warna Terkurasi (Harmonious & Professional)
- **Kanvas / Background**: Aurora mesh gradient lembut (`#f8fafc` ke `#e2e8f0` dengan glowing ambient orbs `#dbeafe`, `#ede9fe`, `#fce7f3`).
- **Teks Utama**: Deep Charcoal / Slate 900 (`#0f172a`, `#1e293b`) — memiliki kontras rasio tajam di atas kaca.
- **Teks Sekunder**: Slate 500 (`#64748b`).
- **Aksen Utama**: Apple System Blue (`#2563eb` - `#1d4ed8`).
- **Status Semantic**:
  - *Aktif / Sukses*: Emerald (`#059669`, surface `rgba(16, 185, 129, 0.12)`, border `rgba(110, 231, 183, 0.6)`).
  - *Cuti / Peringatan*: Amber (`#d97706`, surface `rgba(245, 158, 11, 0.12)`, border `rgba(252, 211, 77, 0.6)`).
  - *Pensiun / Bahaya*: Rose (`#e11d48`, surface `rgba(244, 63, 94, 0.12)`, border `rgba(253, 164, 175, 0.6)`).
  - *Mata Pelajaran*: Sapphire Blue (`#2563eb`, surface `rgba(37, 99, 235, 0.12)`).
  - *Jabatan Struktural*: Amethyst Purple (`#7c3aed`, surface `rgba(124, 58, 237, 0.12)`).

#### 5. Aturan Anti "AI Slop"
- **Dilarang** menyematkan widget grafik, kartu metrik tiruan, atau angka palsu yang tidak ada dasarnya di database.
- **Dilarang** menggunakan warna neon berlebihan, efek border pelangi berputar, atau animasi alay yang mengganggu fokus kerja.
- **Dilarang** menghilangkan fitur eksisting (tombol Export Excel, Cetak PDF, Filter, Pagination, dsb.).

---

## 4. Master Design Consistency Specification (Standar Konsistensi Desain)

Untuk mencegah ketidakkonsistenan visual antar halaman (seperti perbedaan font, ukuran teks, munculnya ikon liar, atau tombol dengan gaya berbeda), seluruh halaman aplikasi **WAJIB MENGIKUTI STANDAR BAKU BERIKUT**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                             KONSISTENSI UI / UX MATRIX                                  │
├──────────────────────┬──────────────────────────────────────────┬───────────────────────┤
│ Elemen UI            │ Spesifikasi Desain Baku                  │ Aturan Konsistensi    │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────┤
│ Header Halaman       │ .tactile-page-header (blur 36px, r:24px) │ ❌ DILARANG IKON ORB   │
│ Judul Halaman        │ h2.page-title (25px, w:800, c:#0f172a)   │ Wajib font 25px bold  │
│ Sub-Judul            │ p.page-subtitle (13.5px, c:#64748b)      │ Wajib di bawah judul  │
│ Latar Belakang       │ Aurora mesh gradient (5 radial orbs)     │ Mesh light & dark     │
│ Tombol Utama         │ .primary-pill (gradient biru, r:9999px)  │ Ikon 15px + Teks 13px │
│ Tombol Aksi Tabel    │ .btn-table-act (bulat 32px, frosted)     │ Hover scale 1.1x      │
│ Inline Edit Modal    │ .modal-inline-edit-input + Check & X btn │ Kapsul hijau & merah  │
│ Dropdown / Select    │ CustomSelect / Inset Glass Select        │ Rounded 12px, frosted │
│ Dialog Hapus         │ Apple VisionOS Halo merah + AlertTriangle│ Dua tombol taktil     │
└──────────────────────┴──────────────────────────────────────────┴───────────────────────┘
```

---

### 4.1 Standar Header Halaman & Aturan Sakral "NO HEADER ICON"
Header setiap halaman utama harus mengikuti layout **Apple Floating Dock Header**:

```tsx
{/* STRUKTUR BAKU HEADER HALAMAN */}
<header className="tactile-page-header">
  <div className="header-text-block">
    <h2 className="page-title">{judulHalaman}</h2>
    <p className="page-subtitle">{deskripsiHalaman}</p>
  </div>

  <div className="header-actions-row">
    {/* Segmented Controls / Dropdown / Tombol Aksi */}
  </div>
</header>
```

> [!CAUTION]
> **ATURAN SAKRAL HEADER**:
> 1. **DILARANG** menambahkan ikon orb, bola lensa, avatar, atau logo di sebelah kiri judul pada area `.header-text-block`! Area teks judul harus bersih, tegas, dan lapang seperti pada halaman `Manajemen Data Guru` dan `Manajemen Data Kelas`.
> 2. `.header-text-block` berorientasi vertikal (kolom blok biasa), **DILARANG** diberi `display: flex; gap: 16px` yang merusak susunan teks.
> 3. Ikon **HANYA BOLEH** digunakan pada:
>    - Tombol segmented control / tab navigasi.
>    - Tombol aksi (misal: `<Plus size={15} /> Tambah Data`, `<RefreshCw size={14} /> Segarkan`).
>    - Sel tabel data (avatar, kontak telepon/alamat).
>    - Badge/Chip status.

---

### 4.2 Standar Hirarki Tipografi (Typography Scale)
Setiap teks dalam antarmuka harus menggunakan token tipografi yang konsisten:

| Elemen | Tag HTML / Selector | Font Size | Font Weight | Letter Spacing | Line Height | Warna (Light / Dark) |
|---|---|---|---|---|---|---|
| **Judul Halaman** | `h2.page-title` | `25px` | `800` (Bold) | `-0.5px` | `1.2` | `#0f172a` / `#f8fafc` |
| **Sub-Judul Halaman** | `p.page-subtitle` | `13.5px` | `400` (Regular) | `normal` | `1.4` | `#64748b` / `#94a3b8` |
| **Judul Card / Seksi** | `h3.section-main-title` | `17px - 18px` | `800` (Bold) | `-0.2px` | `1.3` | `#0f172a` / `#f8fafc` |
| **Judul Modal** | `.modal-title` | `18px` | `800` (Bold) | `-0.3px` | `1.25` | `#0f172a` / `#f8fafc` |
| **Header Tabel (TH)** | `th` | `12px` | `700` (Bold) | `0.5px` (Uppercase) | `1.2` | `#475569` / `#94a3b8` |
| **Nama Utama Tabel** | `.person-text-name` | `13.5px` | `700` (Bold) | `normal` | `1.25` | `#0f172a` / `#f8fafc` |
| **Teks Tabel Biasa** | `td`, `.table-desc-text` | `13px` | `500` (Medium) | `normal` | `1.4` | `#334155` / `#cbd5e1` |
| **Sub-Label / Metadata** | `.person-nis-sub`, `.sub-meta` | `11px - 11.5px` | `500` (Medium) | `normal` | `1.3` | `#64748b` / `#94a3b8` |
| **Badge / Pill Tag** | `.table-badge-*`, `.status-pill` | `11.5px - 12px` | `700` (Bold) | `0.3px` | `1` | Sesuai aksen semantik |
| **Teks Tombol Pill** | `.action-pill-btn`, `button` | `13px - 13.5px` | `700` (Bold) | `normal` | `1` | Putih / Slate `#475569` |

---

### 4.3 Standar Latar Belakang (Aurora Mesh Wallpaper)
Latar belakang kanvas wajib menggunakan **Dynamic Multi-Point Aurora Mesh**:
* **Light Mode (Default)**:
  ```scss
  background: 
    radial-gradient(circle at 12% 12%, rgba(56, 189, 248, 0.28) 0%, transparent 45%),
    radial-gradient(circle at 88% 18%, rgba(139, 92, 246, 0.24) 0%, transparent 42%),
    radial-gradient(circle at 45% 50%, rgba(244, 114, 182, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 82% 82%, rgba(168, 85, 247, 0.20) 0%, transparent 48%),
    radial-gradient(circle at 18% 85%, rgba(45, 212, 191, 0.18) 0%, transparent 42%),
    linear-gradient(180deg, #f8fafc 0%, #f1f5f9 55%, #edf2f7 100%);
  ```
* **Dark Mode (`html[data-theme="dark"]`)**:
  ```scss
  background: 
    radial-gradient(circle at 15% 15%, rgba(30, 58, 138, 0.25) 0%, transparent 45%),
    radial-gradient(circle at 85% 20%, rgba(88, 28, 135, 0.22) 0%, transparent 45%),
    linear-gradient(135deg, #0b0f17 0%, #0f172a 50%, #1e293b 100%);
  ```
* **Specular Edge Glint**: Garis sorot cahaya fisik di tepi atas kanvas dan dock:
  ```scss
  linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 30%, rgba(255, 255, 255, 0.2) 80%, transparent 100%);
  ```

---

### 4.4 Standar Tombol & Kapsul Aksi (Button Matrix)
Seluruh tombol dalam aplikasi dibagi menjadi 4 varian baku:

1. **Primary Action Pill (`.action-pill-btn.primary-pill`, `.modal-btn-submit`)**:
   - Bentuk kapsul penuh (`border-radius: 9999px`), tinggi `38px - 40px`, padding `0 18px`.
   - Latar belakang: Gradien Apple Blue `linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)`.
   - Border: `1px solid rgba(255, 255, 255, 0.35)`, tepi atas `border-top: 1.5px solid rgba(255, 255, 255, 0.70)`.
   - Bayangan: `box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35)`.
   - Hover: Transform `translateY(-1px)`, gradien lebih pekat `#2563eb` ke `#1d4ed8`.

2. **Secondary / Neutral Action Pill (`.action-pill-btn`, `.modal-btn-cancel`)**:
   - Bentuk kapsul penuh (`border-radius: 9999px`), tinggi `36px - 38px`.
   - Latar belakang: Frosted glass `rgba(255, 255, 255, 0.75)`, border `rgba(203, 213, 225, 0.8)`.
   - Warna teks: `#475569`, hover: `#0f172a` dengan background solid `#ffffff`.

3. **Circular Action Buttons Tabel (`.btn-table-act`, `.mini-btn`)**:
   - Bentuk lingkaran murni (`width: 32px`, `height: 32px`, `border-radius: 9999px`).
   - Latar belakang: Kaca frosted `rgba(255, 255, 255, 0.85)`, `backdrop-filter: blur(8px)`.
   - Border: `1px solid rgba(203, 213, 225, 0.75)`, `border-top: 1.5px solid rgba(255, 255, 255, 0.95)`.
   - Varian Edit: Warna `#2563eb`, hover background `rgba(37, 99, 235, 0.12)`, scale `1.1x`.
   - Varian Hapus: Warna `#e11d48`, hover background `rgba(225, 29, 72, 0.12)`, scale `1.1x`.

4. **Inline Edit Action Buttons (`.modal-icon-btn`)**:
   - Tombol Simpan (`.btn-save`): Lingkaran 30px, gradien emerald `#10b981` ke `#059669`, ikon centang putih (`Check size={14}`).
   - Tombol Batal (`.btn-cancel`): Lingkaran 30px, soft rose/slate `rgba(241, 245, 249, 0.9)`, ikon silang (`X size={14}`).

---

### 4.5 Standar Dropdown, Select, & Search Bar
1. **Pill Search Bar (`.search-input-wrapper`)**:
   - Bentuk pill inset kapsul (`border-radius: 9999px`), tinggi `42px`, padding `0 16px`.
   - Background: `rgba(255, 255, 255, 0.65)`, blur `16px`.
   - Inset shadow: `box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03)`.
   - Dilengkapi ikon `Search` di sebelah kiri dan tombol `X` clear search di sebelah kanan.

2. **Apple CustomSelect Dropdown (`CustomSelect`)**:
   - Kapsul kaca mengambang dengan trigger pill halus.
   - Menu popover: `backdrop-filter: blur(24px)`, rounded `16px`, elevasi `box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.14)`.
   - Item dropdown: Hover aksen biru transparan `rgba(37, 99, 235, 0.08)`.

3. **Form Modal Input & Select**:
   - Input field: Tinggi `38px - 40px`, rounded `12px`, background `rgba(255, 255, 255, 0.85)`, border `1px solid rgba(203, 213, 225, 0.8)`.
   - Focus state: Border biru `#3b82f6` dengan ring halus `box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15)`.

---

### 4.6 Standar Modal & Inline Edit
1. **Modal Container (`CustomModal`)**:
   - Backdrop: `rgba(15, 23, 42, 0.35)` dengan `backdrop-filter: blur(16px)`.
   - Card Modal: Rounded `24px`, background `rgba(255, 255, 255, 0.85)`, border specular `border-top: 1.5px solid rgba(255, 255, 255, 1)`.
   - Header: Judul `18px` bold, tombol close `X` bulat di sudut kanan.
   - Banner Sub-Tab: Kotak info biru muda `.modal-subtab-banner` penunjuk kategori aktif.

2. **Inline Edit Row (`.modal-inline-edit-wrap`)**:
   - Digunakan saat mengedit nama item kategori/jabatan langsung di baris list modal.
   - Input inline: Tinggi `36px`, rounded `9px`, background solid putih/kaca dengan ring fokus biru.
   - Tombol Simpan & Batal: Kapsul bulat `.btn-save` (hijau) dan `.btn-cancel` (slate/merah).
   - Aksesibilitas: Wajib mendukung `Enter` untuk menyimpan dan `Escape` untuk membatalkan.

---

### 4.7 Standar Dialog Konfirmasi Hapus (Destructive Dialog)
Dialog konfirmasi aksi kritis (seperti menghapus personel, kategori, atau guru) **DILARANG MENGGUNAKAN `window.confirm` BAWAAN BROWSER**. Wajib menggunakan modal konfirmasi taktil Apple VisionOS:
* **Icon Halo**: Lingkaran bulat 60px warna merah translusen (`rgba(225, 29, 72, 0.1)`), border `rgba(253, 164, 175, 0.6)`, berisi ikon `AlertTriangle size={24}` warna merah `#e11d48`.
* **Teks Eksplisit**: Menyebutkan secara jelas nama data dan posisi yang akan dihapus.
* **Tombol Aksi**: Tombol Batal di kiri dan tombol "Ya, Hapus" di kanan dengan gradien merah crimson `linear-gradient(180deg, #f43f5e, #e11d48)`.

---

### 4.8 Standar Liquid Glass Table Container & Cells
* **Card Container (`.struktur-table-card`, `.table-view-container`)**:
  - `backdrop-filter: blur(24px)`.
  - Sudut membulat: `border-radius: 20px`.
  - Border highlight: `border-top: 1.5px solid rgba(255, 255, 255, 0.98)`.
  - Elevasi: `box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.85)`.
* **Header Baris (`thead tr`)**:
  - Background: `rgba(248, 250, 252, 0.75)`, padding `14px 18px`, teks `12px` bold uppercase.
* **Baris Data (`tbody tr`)**:
  - Hover row highlight: `background: rgba(255, 255, 255, 0.85)`.
  - Cell Personel: Menggabungkan avatar inisial/foto lingkaran 38px + nama tebal 13.5px + badge NIS/NIP 11px.
  - Cell Kontak: Ikon `MapPin` dan `Phone` berwarna cerah berukuran 11px.
  - Cell Aksi: Dua tombol kapsul bulat 32px (`.btn-table-act`).
* **Table Footer Bar (`.table-footer-bar`)**:
  - Menampilkan ringkasan total entitas terdaftar di baris bawah tabel.

---

### 4.9 Standar Warna Semantik & Dark Mode
* **Status / Aksen Semantik**:
  - *Aktif / Sukses*: Emerald (`#059669`, surface `rgba(16, 185, 129, 0.12)`, border `rgba(110, 231, 183, 0.6)`).
  - *Cuti / Peringatan*: Amber (`#d97706`, surface `rgba(245, 158, 11, 0.12)`, border `rgba(252, 211, 77, 0.6)`).
  - *Pensiun / Bahaya*: Rose (`#e11d48`, surface `rgba(244, 63, 94, 0.12)`, border `rgba(253, 164, 175, 0.6)`).
  - *Jabatan*: Sapphire Blue (`#2563eb`, surface `rgba(37, 99, 235, 0.08)`).
  - *Kategori*: Slate Netral (`#475569`, surface `rgba(100, 116, 139, 0.08)`).
* **Mode Gelap (`html[data-theme="dark"]`)**:
  - Teks utama berubah menjadi `#f8fafc`.
  - Teks sekunder berubah menjadi `#94a3b8`.
  - Background kaca menjadi `rgba(15, 23, 42, 0.65 - 0.75)`.
  - Border kaca menjadi `rgba(255, 255, 255, 0.08)`.


---

## 5. Strategi Migrasi Bertahap (Incremental TypeScript Migration)

Migrasi dari JavaScript (`.jsx`/`.js`) ke TypeScript (`.tsx`/`.ts`) harus dilakukan secara **inkremental dan terukur**:

```
Fase 1: Tinjau Kontrak API Backend  ───>  Fase 2: Buat types/*.ts (Interface)
                 │                                        │
                 ▼                                        ▼
Fase 4: Verifikasi Build & HMR      <───  Fase 3: Refactor ke .tsx & Styling SCSS
```

### Aturan Teknis Migrasi
1. **Koeksistensi Harmonis (`allowJs: true`)**:
   - `frontend/tsconfig.json` telah dikonfigurasi dengan `"allowJs": true`. File `.jsx` dan `.tsx` dapat berjalan berdampingan tanpa error.
   - **JANGAN** mengubah semua file sekaligus. Refactor dilakukan modul demi modul.
2. **Definisi Interface Presisi (`src/types/`)**:
   - Setiap entitas wajib memiliki interface TypeScript terpisah di `frontend/src/types/<feature>.ts` (contoh: `guru.ts`, `kelas.ts`, `santri.ts`, `nilai.ts`).
   - Interface harus mencakup tipe item data, filter state, form data, dan response paginasi.
   - Hindari penggunaan type `any`. Gunakan `unknown` atau union types jika tipe dinamis.
3. **Preservasi 100% Logika Bisnis**:
   - Seluruh state React (`useState`, `useEffect`, `useMemo`, `useCallback`), kalkulasi paginasi, debounce pencarian, dan pemanggilan service API harus dipertahankan secara utuh.
4. **Verifikasi Build Wajib**:
   - Setiap kali satu halaman/komponen selesai dimigrasi, jalankan:
     ```bash
     cd frontend
     npm run build
     ```
   - Build **WAJIB** menghasilkan exit code 0 (`✓ built in ...s`) tanpa peringatan TypeScript yang memblokir.

---

## 6. Peta Jalan & Katalog Halaman (Refactoring Roadmap)

| Modul | Halaman / Fitur | Status Migrasi | Keterangan |
|---|---|---|---|
| **Akademik** | Data Guru (`/guru`) | ✅ Selesai (TSX) | Option A Liquid Glass, Tabs Guru, Mapel, Jabatan |
| **Akademik** | Data Kelas (`/kelas`) | ✅ Selesai (TSX) | Liquid Glass, Tab Kelas & Wali Kelas |
| **Akademik Diniyah** | Struktur Madrasah Diniyah (`/struktur-organisasi`) | ✅ Selesai (TSX) | Option A Liquid Glass, 10 Main Tabs, Categories, 3D Avatars, Section Groups |
| **Akademik** | Jadwal Pelajaran (`/jadwal-pelajaran`) | ✅ Selesai (TSX) | Matrix Jadwal Mingguan, Filter Kelas/Hari, Option A Liquid Glass |
| **Akademik** | Silabus Pembelajaran (`/silabus-pembelajaran`) | ✅ Selesai (TSX) | Dokumen Silabus, RPP, Upload Materi, Option A Liquid Glass |
| **Akademik Diniyah** | Pengaturan & Jadwal (`/nilai-pengaturan`) | ✅ Selesai (TSX) | Option A Liquid Glass, Specular Edge Glints, TSX |
| **Akademik Diniyah** | Informasi Ujian (`/informasi-ujian`) | ✅ Selesai (TSX) | Jadwal Ujian, Pengawas, Tata Tertib, Option A Liquid Glass |
| **Akademik Diniyah** | Monitoring Setoran Hafalan (`/monitoring-setoran`) | ✅ Selesai (TSX) | Option A Liquid Glass, 3D Spherical Orbs, TSX |
| **Akademik Diniyah** | Manajemen Nilai & Rekap (`/nilai`, `/nilai-rekap`) | ✅ Selesai (TSX) | Option A Liquid Glass, Sub-Tabs 4 Bagian (Muhafadzoh Akbar, Qiroatul Kitab, Taftisyul Kutub, Ujian Tulis), Popup Modal Grid 4 Kolom Kelas |
| **Akademik** | Data Santri (`/santri`) | ⏳ Siap Dikerjakan | Tabel Santri, Filter Kamar/Kelas, Modal Santri |
| **Akademik** | Pelanggaran & Prestasi (`/pelanggaran-prestasi`) | ⏳ Antrean | Tab Pelanggaran, Prestasi, Kategori Poin |
| **Ujian** | Lembar Ujian (`/lembar-ujian`) | ⏳ Antrean | Generator Lembar Soal & Jawaban |
| **Ujian** | Kartu Ujian (`/kartu-ujian`) | ⏳ Antrean | Cetak Kartu Ujian Berfoto & Barcode |
| **Ujian** | Scan Nilai (`/scan-nilai`) | ⏳ Antrean | OCR / Barcode Scanner Lembar Nilai |
| **Keuangan** | Dashboard Keuangan | ⏳ Antrean | Ringkasan Arus Kas, Statistik Penerimaan |
| **Keuangan** | Tagihan Santri (`/tagihan-santri`) | ⏳ Antrean | Invoice SPP, Daftar Tagihan, Status Lunas |
| **Keuangan** | Buku Kas (`/buku-kas`) | ⏳ Antrean | Arus Kas Masuk & Keluar, Jurnal Umum |
| **Keuangan** | Cetak Kwitansi (`/cetak-kwitansi`) | ⏳ Antrean | Template Cetak Pembayaran Resmi |
| **Master** | Data Kamar (`/kamar`) | ⏳ Antrean | Asrama, Kapasitas Santri, Penempatan |
| **Master** | Data Alumni (`/alumni`) | ⏳ Antrean | Database Lulusan, Tracer Study |
| **Master** | Manajemen Users (`/users`) | ⏳ Antrean | Akun Pengguna, Role & Hak Akses |

---

## 7. Standard Operating Procedure (SOP) untuk AI Agent

Saat menerima tugas merombak halaman baru, ikuti urutan langkah berikut:

1. **Langkah 1: Audit & Discovery**:
   - Baca file halaman eksisting (misal `frontend/src/pages/Santri.jsx`) dan komponen pendukungnya.
   - Catat semua state, query parameter, service API yang dipanggil, modal yang terbuka, dan handler tombol.
2. **Langkah 2: Verifikasi Kontrak API**:
   - Periksa file service terkait di `frontend/src/services/` dan controller backend di `src/routes/`.
   - Pastikan tidak ada payload atau URL endpoint yang diubah.
3. **Langkah 3: Definisikan TypeScript Types**:
   - Buat file `frontend/src/types/<feature>.ts`.
   - Definisikan interface lengkap untuk entity, form data, modal props, dan filter state.
4. **Langkah 4: Desain Styling SCSS (Option A)**:
   - Buat atau perbarui file SCSS terkait (misal `Santri.scss`).
   - Terapkan token Liquid Glass: floating dock header, segmented controls, glass table container, 3D avatars, frosted pills.
5. **Langkah 5: Konversi Komponen & Halaman ke `.tsx`**:
   - Konversi file halaman dan modal ke `.tsx`.
   - Pasang TypeScript types pada state dan props.
   - Pastikan seluruh class name terhubung dengan benar dan tidak ada class clash (seperti kasus `display: none`).
6. **Langkah 6: Build Verification & Smoke Test**:
   - Jalankan `npm run build` di `frontend/` dan pastikan hasil build exit code 0.
   - Periksa tampilan di browser lokal untuk memastikan interaksi, modal, dan filter berfungsi 100%.
