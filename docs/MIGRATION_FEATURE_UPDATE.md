# Update Fitur Migrasi Tahun Ajaran & Tambah Santri

**Tanggal:** 2 Mei 2026  
**Status:** ✅ Selesai

## 📋 Ringkasan Perubahan

Implementasi perbaikan untuk 3 masalah utama:

1. ✅ **Tombol "Tambah Santri" sekarang berfungsi di semua tahun ajaran** (tidak hanya tahun berjalan)
2. ✅ **Fungsi "Migrasi Tahun Ajaran" dengan validasi dan pemilihan santri**
3. ✅ **Setiap tahun ajaran dapat menambahkan santri baru**

---

## 🎯 Masalah yang Diperbaiki

### Masalah 1 & 3: Tambah Santri di Tahun Ajaran Arsip
**Sebelumnya:**
- Tombol "Tambah Santri" hanya aktif di tahun ajaran berjalan
- Tidak bisa menambah santri ke tahun ajaran arsip (misal: 2019-2020)

**Sekarang:**
- ✅ Tombol "Tambah Santri" aktif di semua tahun ajaran
- ✅ Santri yang ditambahkan akan masuk ke tahun ajaran yang sedang dipilih
- ✅ Alert informatif menunjukkan bahwa data akan ditambahkan ke tahun ajaran yang dipilih

### Masalah 2: Migrasi Tahun Ajaran
**Sebelumnya:**
- Migrasi gagal dengan pesan error
- Tidak ada validasi untuk santri yang tidak naik kelas
- Tidak ada UI untuk memilih santri secara individual

**Sekarang:**
- ✅ Modal dialog interaktif untuk proses migrasi
- ✅ Daftar lengkap santri dengan checkbox untuk memilih
- ✅ Validasi santri yang naik/tidak naik kelas
- ✅ Summary statistik migrasi
- ✅ Santri yang tidak dipilih akan ditandai sebagai "tidak_naik"

---

## 🔧 Perubahan Teknis

### Backend Changes

#### 1. **src/services/tahunAjaranService.js**
```javascript
// Fungsi baru untuk sync ke tahun ajaran spesifik
async function syncSantriToSpecificTahunAjaran(santriId, tahunAjaranId, options = {}, client = db)

// Refactor fungsi existing
async function syncSantriToActiveTahunAjaran(santriId, options = {}, client = db)
```

**Fitur:**
- Mendukung penambahan santri ke tahun ajaran spesifik (bukan hanya tahun aktif)
- Reusable function untuk sync data santri

#### 2. **src/routes/santriRoutes.js**
```javascript
app.post('/api/santri', async (req, res) => {
  // Tambahan parameter: tahun_ajaran_id
  const { tahun_ajaran_id, ...otherData } = req.body;
  
  // Sync ke tahun ajaran spesifik atau aktif
  if (tahun_ajaran_id) {
    await syncSantriToSpecificTahunAjaran(santriId, tahun_ajaran_id, options);
  } else {
    await syncSantriToActiveTahunAjaran(santriId, options);
  }
}
```

**Fitur:**
- Support parameter `tahun_ajaran_id` untuk menambah santri ke tahun ajaran tertentu
- Backward compatible (jika tidak ada tahun_ajaran_id, gunakan tahun aktif)

#### 3. **src/routes/tahunAjaranRoutes.js**
```javascript
app.post('/api/tahun-ajaran/migrate', async (req, res) => {
  const excludedSantriIds = req.body.excluded_santri_ids || [];
  
  // Query dengan exclusion condition
  WHERE sta.tahun_ajaran_id = $1
    AND sta.status IN ('aktif', 'draft', 'tidak_naik')
    AND sta.santri_id NOT IN (...)
    
  // Mark excluded santri as "tidak_naik"
  UPDATE santri_tahun_ajaran
  SET status = 'tidak_naik',
      catatan = CONCAT(COALESCE(catatan, ''), ' - Tidak naik ke ...')
  WHERE santri_id = ANY($2::int[])
}
```

**Fitur:**
- Parameter baru: `excluded_santri_ids` (array of santri IDs yang tidak naik)
- Santri yang tidak dipilih akan ditandai sebagai "tidak_naik" di tahun ajaran sumber
- Pesan error lebih informatif jika tahun ajaran target belum dibuat

### Frontend Changes

#### 4. **frontend/src/components/features/MigrationModal.jsx** (NEW)
Komponen modal baru untuk proses migrasi dengan fitur:

**UI Components:**
- ✅ Table dengan checkbox untuk setiap santri
- ✅ "Pilih Semua" checkbox di header
- ✅ Summary statistik (Total, Naik Kelas, Tidak Naik)
- ✅ Alert peringatan tentang proses migrasi
- ✅ Row highlighting (hijau = naik, merah = tidak naik)
- ✅ Pagination untuk daftar santri

**Validasi:**
- ✅ Minimal 1 santri harus dipilih untuk migrasi
- ✅ Konfirmasi sebelum proses migrasi
- ✅ Loading state saat proses migrasi

#### 5. **frontend/src/pages/Santri.jsx**
```javascript
// State baru untuk migration modal
const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
const [isMigrating, setIsMigrating] = useState(false);

// Fungsi handleAddClick - TIDAK ADA validasi canEdit lagi
const handleAddClick = () => {
  setEditingData(null);
  setModalError('');
  setIsModalOpen(true);
};

// Fungsi handleMigrateClick - Buka modal
const handleMigrateClick = async () => {
  setIsMigrationModalOpen(true);
};

// Fungsi baru untuk konfirmasi migrasi
const handleMigrationConfirm = async (excludedSantriIds) => {
  const result = await santriService.migrateTahunAjaran(nextKode, excludedSantriIds);
  // ...
};

// handleModalSubmit - Tambahkan tahun_ajaran_id
const submitData = {
  ...data,
  tahun_ajaran_id: selectedTahunAjaranId || activeTahunAjaran.id
};
```

**Perubahan:**
- ✅ Tombol "Tambah Santri" selalu aktif (tidak ada `disabled={!canEdit}`)
- ✅ Alert mode arsip diubah: "Data yang ditambahkan akan masuk ke tahun ajaran ini"
- ✅ Migrasi menggunakan modal interaktif
- ✅ Data santri dikirim dengan `tahun_ajaran_id`

#### 6. **frontend/src/services/santriService.js**
```javascript
async migrateTahunAjaran(targetKode, excludedSantriIds = []) {
  body: JSON.stringify({ 
    target_kode: targetKode,
    excluded_santri_ids: excludedSantriIds 
  })
}
```

**Perubahan:**
- Parameter baru: `excludedSantriIds` untuk santri yang tidak naik

---

## 📊 Flow Diagram

### Flow Tambah Santri (Semua Tahun Ajaran)

```
User memilih tahun ajaran (misal: 2019-2020)
    ↓
Klik "Tambah Santri"
    ↓
Modal terbuka (tidak ada validasi tahun ajaran)
    ↓
User mengisi form santri
    ↓
Submit → POST /api/santri dengan tahun_ajaran_id
    ↓
Backend: syncSantriToSpecificTahunAjaran(santriId, tahunAjaranId)
    ↓
Data santri masuk ke santri_tahun_ajaran untuk tahun yang dipilih
    ↓
Success: "Data santri berhasil disimpan"
```

### Flow Migrasi Tahun Ajaran (Dengan Validasi)

```
User di tahun ajaran berjalan (misal: 2024-2025)
    ↓
Klik "Migrasi Tahun Ajaran"
    ↓
Modal terbuka dengan daftar semua santri
    ↓
User review dan uncheck santri yang tidak naik
    ↓
Summary menampilkan:
  - Total Santri: 150
  - Akan Naik Kelas: 145
  - Tidak Naik Kelas: 5
    ↓
User klik "Proses Migrasi"
    ↓
POST /api/tahun-ajaran/migrate
  body: {
    target_kode: "2025-2026",
    excluded_santri_ids: [12, 45, 78, 90, 123]
  }
    ↓
Backend:
  1. Copy 145 santri ke tahun 2025-2026 (status: aktif)
  2. Update 5 santri di tahun 2024-2025 (status: tidak_naik)
  3. Set 2024-2025 → arsip (is_active: false)
  4. Set 2025-2026 → berjalan (is_active: true)
    ↓
Success: "Migrasi berhasil. 145 santri naik kelas, 5 santri tidak naik."
```

---

## 🎨 UI/UX Improvements

### Migration Modal Features

1. **Visual Feedback**
   - Row hijau muda: Santri yang akan naik kelas
   - Row merah muda: Santri yang tidak naik kelas
   - Opacity berkurang untuk santri yang tidak dipilih

2. **Summary Statistics**
   - Total Santri (hitungan keseluruhan)
   - Akan Naik Kelas (warna hijau)
   - Tidak Naik Kelas (warna merah)

3. **Alert & Warnings**
   - Warning alert dengan icon di bagian atas
   - Penjelasan lengkap tentang proses migrasi
   - Error alert jika tidak ada santri yang dipilih

4. **Table Features**
   - Checkbox "Pilih Semua" di header
   - Indeterminate state untuk partial selection
   - Pagination dengan 10 items per page
   - Scroll vertical untuk daftar panjang
   - Kolom: Checkbox, NIS, Nama, Kelas Diniyah, Kelas Sekolah, Status

---

## 🧪 Testing Checklist

### Test Case 1: Tambah Santri di Tahun Ajaran Arsip
- [ ] Pilih tahun ajaran arsip (misal: 2019-2020)
- [ ] Klik "Tambah Santri"
- [ ] Modal terbuka tanpa error
- [ ] Isi form dan submit
- [ ] Santri muncul di daftar tahun ajaran 2019-2020
- [ ] Santri TIDAK muncul di tahun ajaran berjalan

### Test Case 2: Tambah Santri di Tahun Ajaran Berjalan
- [ ] Pilih tahun ajaran berjalan
- [ ] Klik "Tambah Santri"
- [ ] Isi form dan submit
- [ ] Santri muncul di daftar tahun ajaran berjalan
- [ ] Data tersimpan di tabel `santri` dan `santri_tahun_ajaran`

### Test Case 3: Migrasi Semua Santri
- [ ] Di tahun ajaran berjalan, klik "Migrasi Tahun Ajaran"
- [ ] Modal terbuka dengan daftar santri
- [ ] Semua checkbox tercentang (default)
- [ ] Summary: Akan Naik = Total Santri, Tidak Naik = 0
- [ ] Klik "Proses Migrasi"
- [ ] Semua santri pindah ke tahun ajaran baru
- [ ] Tahun ajaran lama menjadi arsip

### Test Case 4: Migrasi dengan Santri Tidak Naik
- [ ] Di tahun ajaran berjalan, klik "Migrasi Tahun Ajaran"
- [ ] Uncheck 3 santri (misal: Ahmad, Budi, Citra)
- [ ] Summary: Tidak Naik = 3
- [ ] Klik "Proses Migrasi"
- [ ] Santri yang dicentang pindah ke tahun baru
- [ ] Ahmad, Budi, Citra tetap di tahun lama dengan status "tidak_naik"
- [ ] Catatan santri diupdate: "Tidak naik ke 2025-2026"

### Test Case 5: Migrasi Tanpa Santri (Edge Case)
- [ ] Uncheck semua santri
- [ ] Summary: Akan Naik = 0
- [ ] Tombol "Proses Migrasi" disabled
- [ ] Error alert muncul: "Tidak ada santri yang akan dimigrasi"

### Test Case 6: Migrasi ke Tahun yang Belum Ada
- [ ] Tahun ajaran target belum dibuat di database
- [ ] Klik "Migrasi Tahun Ajaran"
- [ ] Error: "Tahun ajaran 2025-2026 belum tersedia. Silakan buat tahun ajaran baru terlebih dahulu."

---

## 🔐 Database Schema

### Tabel: `santri_tahun_ajaran`

```sql
CREATE TABLE santri_tahun_ajaran (
  id SERIAL PRIMARY KEY,
  tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
  santri_id INTEGER REFERENCES santri(id),
  status VARCHAR(20) DEFAULT 'aktif', -- 'aktif', 'draft', 'tidak_naik', 'alumni'
  catatan TEXT,
  -- ... kolom lainnya
  UNIQUE(tahun_ajaran_id, santri_id)
);
```

**Status Values:**
- `aktif`: Santri aktif di tahun ajaran ini
- `draft`: Santri dalam status draft
- `tidak_naik`: Santri tidak naik kelas (tetap di tahun ajaran ini)
- `alumni`: Santri sudah lulus

---

## 📝 API Documentation

### POST /api/santri
**Request Body:**
```json
{
  "nis": "12345",
  "nama": "Ahmad Zaki",
  "tahun_ajaran_id": 5,  // NEW: Optional, jika tidak ada gunakan tahun aktif
  "kelas_diniyah_id": 10,
  "kelas_sekolah_id": 15,
  // ... field lainnya
}
```

**Response:**
```json
{
  "id": 123,
  "nis": "12345",
  "nama": "Ahmad Zaki",
  // ...
}
```

### POST /api/tahun-ajaran/migrate
**Request Body:**
```json
{
  "target_kode": "2025-2026",
  "excluded_santri_ids": [12, 45, 78]  // NEW: Array of santri IDs yang tidak naik
}
```

**Response:**
```json
{
  "message": "Migrasi ke tahun ajaran 2025-2026 berhasil.",
  "source": { "id": 5, "kode": "2024-2025" },
  "target": { "id": 6, "kode": "2025-2026" },
  "migrated": 145,  // Jumlah santri yang naik
  "excluded": 5     // Jumlah santri yang tidak naik
}
```

---

## 🚀 Deployment Notes

### Prerequisites
1. Pastikan tabel `santri_tahun_ajaran` sudah ada
2. Pastikan kolom `status` di `santri_tahun_ajaran` support value 'tidak_naik'

### Migration Steps
1. Backup database
2. Deploy backend changes
3. Deploy frontend changes
4. Test di environment staging
5. Deploy ke production

### Rollback Plan
Jika ada masalah:
1. Revert backend ke versi sebelumnya
2. Revert frontend ke versi sebelumnya
3. Restore database dari backup

---

## 💡 Future Enhancements

1. **Bulk Edit Kelas saat Migrasi**
   - Tambah fitur untuk mengubah kelas santri saat migrasi
   - Misal: Kelas 1 → Kelas 2 otomatis

2. **Export Report Migrasi**
   - Export daftar santri yang naik/tidak naik ke Excel/PDF
   - Include statistik lengkap

3. **History Migrasi**
   - Log semua proses migrasi
   - Tampilkan riwayat migrasi di UI

4. **Notifikasi**
   - Email/SMS ke wali santri yang tidak naik
   - Notifikasi ke admin setelah migrasi berhasil

5. **Validasi Kelas**
   - Warning jika santri sudah di kelas tertinggi
   - Suggest untuk dijadikan alumni

---

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Check dokumentasi ini
2. Review kode di file yang disebutkan
3. Test di environment development
4. Hubungi tim development

---

**Dibuat oleh:** Kiro AI Assistant  
**Tanggal:** 2 Mei 2026  
**Versi:** 1.0.0
