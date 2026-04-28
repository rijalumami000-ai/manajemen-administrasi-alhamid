# Sekolah Info - Sistem Informasi Internal Pesantren

Sistem informasi internal dengan frontend dashboard dan backend Node.js + PostgreSQL.

## Fitur
- Dashboard data internal
- Manajemen data santri dan guru
- Form input data santri dan guru
- Tabel daftar data
- API sederhana dengan Express
- Koneksi PostgreSQL

## Setup
1. Salin `.env.example` menjadi `.env`.
2. Isi kredensial PostgreSQL di `.env`.
3. Buat database PostgreSQL bernama sesuai `PGDATABASE`.
4. Jalankan:

```bash
npm install
npm start
```

5. Buka `http://localhost:3000`.

## Struktur data
- `santri`: `nis`, `nama`, `kelas`, `jenjang`, `tempat_lahir`, `tanggal_lahir`, `alamat`, `no_hp`, `email`, `status`
- `guru`: `nip`, `nama`, `mata_pelajaran`, `jabatan`, `alamat`, `no_hp`, `email`, `status`
