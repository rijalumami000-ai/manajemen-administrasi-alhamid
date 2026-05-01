# 📚 Alumni Database - Quick Start Guide

## Akses Cepat

🌐 **URL:** http://localhost:3000/alumni.html

## Fitur Utama

✅ Tambah, Edit, Hapus data alumni  
✅ Pencarian berdasarkan nama/NIS  
✅ Filter berdasarkan tahun kelulusan  
✅ Dashboard statistik alumni  
✅ Desain responsif (mobile-friendly)

## Data yang Disimpan

### Wajib Diisi:
- NIS
- Nama Lengkap
- Tahun Lulus

### Opsional:
- NIK, Tempat/Tanggal Lahir
- Tahun Masuk, Kelas Terakhir
- Alamat, No. HP, Email
- Pekerjaan, Instansi
- Prestasi Utama
- Keterangan

## Cara Menggunakan

### 1. Tambah Alumni Baru
```
1. Klik tombol "+ Tambah Alumni"
2. Isi form (minimal: NIS, Nama, Tahun Lulus)
3. Klik "Simpan"
```

### 2. Cari Alumni
```
- Ketik nama/NIS di search bar, atau
- Pilih tahun dari dropdown filter
- Klik "Reset" untuk menampilkan semua
```

### 3. Edit Alumni
```
1. Klik tombol "Edit" pada card alumni
2. Ubah data yang diperlukan
3. Klik "Simpan"
```

### 4. Hapus Alumni
```
1. Klik tombol "Hapus" pada card alumni
2. Konfirmasi penghapusan
```

## API Endpoints

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/alumni` | Ambil semua alumni |
| POST | `/api/alumni` | Tambah alumni baru |
| PUT | `/api/alumni/:id` | Update alumni |
| DELETE | `/api/alumni/:id` | Hapus alumni |
| GET | `/api/alumni/search?q=...&tahun=...` | Cari alumni |

## Testing

Jalankan test untuk memverifikasi API:

```bash
node test_alumni_api.js
```

## Dokumentasi Lengkap

📖 Lihat `ALUMNI_DATABASE_DOCUMENTATION.md` untuk:
- Struktur database detail
- API documentation lengkap
- Security & validation
- Troubleshooting guide

📋 Lihat `ALUMNI_IMPLEMENTATION_SUMMARY.md` untuk:
- Status implementasi
- File yang dibuat/dimodifikasi
- Test results
- Future enhancements

## Quick Tips

💡 **Tip 1:** Gunakan search bar untuk mencari alumni dengan cepat  
💡 **Tip 2:** Filter berdasarkan tahun untuk melihat alumni per angkatan  
💡 **Tip 3:** Statistik dashboard menampilkan ringkasan data alumni  
💡 **Tip 4:** Semua field kecuali NIS, Nama, dan Tahun Lulus bersifat opsional

## Troubleshooting

### Halaman tidak muncul?
- Pastikan server berjalan: `npm start`
- Akses: http://localhost:3000/alumni.html

### Data tidak tersimpan?
- Cek console browser untuk error
- Pastikan field wajib (NIS, Nama, Tahun Lulus) sudah diisi

### Server error?
- Pastikan PostgreSQL berjalan
- Cek file `.env` sudah dikonfigurasi
- Pastikan tabel `alumni` sudah dibuat (jalankan `sql/init.sql`)

## Support

Untuk bantuan lebih lanjut, lihat dokumentasi lengkap atau hubungi tim pengembang.

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready
