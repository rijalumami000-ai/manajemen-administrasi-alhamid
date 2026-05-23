-- PENTING: Jangan jalankan DROP TABLE di production!
-- DROP TABLE hanya untuk development/testing
-- Uncomment baris di bawah HANYA jika ingin reset database

-- DROP TABLE IF EXISTS pelanggaran CASCADE;
-- DROP TABLE IF EXISTS prestasi CASCADE;
-- DROP TABLE IF EXISTS santri CASCADE;
-- DROP TABLE IF EXISTS orangtua CASCADE;
-- DROP TABLE IF EXISTS kelas CASCADE;
-- DROP TABLE IF EXISTS guru CASCADE;
-- DROP TABLE IF EXISTS mata_pelajaran CASCADE;
-- DROP TABLE IF EXISTS jabatan CASCADE;
-- DROP TABLE IF EXISTS kamar CASCADE;
-- DROP TABLE IF EXISTS alumni CASCADE;

CREATE TABLE IF NOT EXISTS kelas (
  id SERIAL PRIMARY KEY,
  jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('Diniyah', 'Sekolah')),
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (jenis, nama)
);

CREATE TABLE IF NOT EXISTS kamar (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  gedung VARCHAR(100),
  lantai INTEGER,
  kapasitas INTEGER NOT NULL DEFAULT 1,
  terisi INTEGER NOT NULL DEFAULT 0,
  jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('Putra', 'Putri')),
  status VARCHAR(20) NOT NULL DEFAULT 'Tersedia' CHECK (status IN ('Tersedia', 'Penuh', 'Maintenance')),
  fasilitas TEXT,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orangtua (
  id SERIAL PRIMARY KEY,
  nama_ayah VARCHAR(150),
  nama_ibu VARCHAR(150),
  pekerjaan_ayah VARCHAR(120),
  pekerjaan_ibu VARCHAR(120),
  no_hp_ayah VARCHAR(60),
  no_hp_ibu VARCHAR(60),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS santri (
  id SERIAL PRIMARY KEY,
  nis VARCHAR(50) NOT NULL UNIQUE,
  nik VARCHAR(50),
  nama VARCHAR(150) NOT NULL,
  jenis_kelamin VARCHAR(20),
  kelas_diniyah_id INTEGER REFERENCES kelas(id),
  kelas_sekolah_id INTEGER REFERENCES kelas(id),
  kamar_id INTEGER REFERENCES kamar(id),
  tempat_lahir VARCHAR(120),
  tanggal_lahir DATE,
  alamat TEXT,
  orangtua_id INTEGER REFERENCES orangtua(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mata_pelajaran (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(120) NOT NULL UNIQUE,
  jenis VARCHAR(50) DEFAULT 'Reguler',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jabatan (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guru (
  id SERIAL PRIMARY KEY,
  nip VARCHAR(50) UNIQUE,
  nama VARCHAR(150) NOT NULL,
  mata_pelajaran_id INTEGER NOT NULL REFERENCES mata_pelajaran(id) ON DELETE RESTRICT,
  jabatan_id INTEGER NOT NULL REFERENCES jabatan(id) ON DELETE RESTRICT,
  no_hp VARCHAR(60) NOT NULL,
  alamat TEXT NOT NULL,
  status VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pelanggaran (
  id SERIAL PRIMARY KEY,
  santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE RESTRICT,
  jenis VARCHAR(150) NOT NULL,
  tanggal DATE NOT NULL,
  deskripsi TEXT,
  sanksi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pelanggaran_santri_id ON pelanggaran(santri_id);
CREATE INDEX IF NOT EXISTS idx_pelanggaran_tanggal ON pelanggaran(tanggal DESC);

CREATE TABLE IF NOT EXISTS prestasi (
  id SERIAL PRIMARY KEY,
  santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE RESTRICT,
  jenis VARCHAR(150) NOT NULL,
  tanggal DATE NOT NULL,
  deskripsi TEXT,
  penghargaan VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prestasi_santri_id ON prestasi(santri_id);
CREATE INDEX IF NOT EXISTS idx_prestasi_tanggal ON prestasi(tanggal DESC);

CREATE TABLE IF NOT EXISTS alumni (
  id SERIAL PRIMARY KEY,
  nis VARCHAR(50) NOT NULL,
  nik VARCHAR(50),
  nama VARCHAR(150) NOT NULL,
  tempat_lahir VARCHAR(120),
  tanggal_lahir DATE,
  tahun_masuk INTEGER,
  tahun_lulus INTEGER NOT NULL,
  kelas_terakhir VARCHAR(100),
  alamat TEXT,
  no_hp VARCHAR(60),
  email VARCHAR(150),
  pekerjaan VARCHAR(150),
  instansi VARCHAR(200),
  prestasi_utama TEXT,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alumni_nama ON alumni(nama);
CREATE INDEX IF NOT EXISTS idx_alumni_tahun_lulus ON alumni(tahun_lulus DESC);
CREATE INDEX IF NOT EXISTS idx_alumni_nis ON alumni(nis);

-- Tambah kolom santri_id ke tabel alumni untuk link ke data santri
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS santri_id INTEGER REFERENCES santri(id);
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS status_pernikahan VARCHAR(40);
ALTER TABLE alumni ADD COLUMN IF NOT EXISTS alamat_sekarang TEXT;
ALTER TABLE santri ADD COLUMN IF NOT EXISTS kamar_id INTEGER REFERENCES kamar(id);
ALTER TABLE santri ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20);

-- Tabel untuk tracking history kelas santri
CREATE TABLE IF NOT EXISTS santri_kelas_history (
  id SERIAL PRIMARY KEY,
  santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  kelas_diniyah_id INTEGER REFERENCES kelas(id),
  kelas_sekolah_id INTEGER REFERENCES kelas(id),
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_santri_kelas_history_santri ON santri_kelas_history(santri_id);
CREATE INDEX IF NOT EXISTS idx_santri_kelas_history_tanggal ON santri_kelas_history(tanggal_mulai DESC);

-- Tabel untuk tracking history kamar santri
CREATE TABLE IF NOT EXISTS santri_kamar_history (
  id SERIAL PRIMARY KEY,
  santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  kamar_id INTEGER NOT NULL REFERENCES kamar(id),
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_santri_kamar_history_santri ON santri_kamar_history(santri_id);
CREATE INDEX IF NOT EXISTS idx_santri_kamar_history_tanggal ON santri_kamar_history(tanggal_mulai DESC);

-- Tahun ajaran dan snapshot data santri per periode
CREATE TABLE IF NOT EXISTS tahun_ajaran (
  id SERIAL PRIMARY KEY,
  kode VARCHAR(9) NOT NULL UNIQUE,
  tahun_mulai INTEGER NOT NULL,
  tahun_selesai INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'arsip' CHECK (status IN ('arsip', 'berjalan', 'draft')),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (tahun_selesai = tahun_mulai + 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tahun_ajaran_active_once ON tahun_ajaran(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_tahun_ajaran_kode ON tahun_ajaran(kode);

CREATE TABLE IF NOT EXISTS santri_tahun_ajaran (
  id SERIAL PRIMARY KEY,
  tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
  santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  kelas_diniyah_id INTEGER REFERENCES kelas(id),
  kelas_sekolah_id INTEGER REFERENCES kelas(id),
  kamar_id INTEGER REFERENCES kamar(id),
  status VARCHAR(30) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'draft', 'lulus', 'alumni', 'pindah', 'keluar', 'tidak_naik')),
  catatan TEXT,
  nis VARCHAR(50) NOT NULL,
  nik VARCHAR(50),
  nama VARCHAR(150) NOT NULL,
  jenis_kelamin VARCHAR(20),
  tempat_lahir VARCHAR(120),
  tanggal_lahir DATE,
  alamat TEXT,
  nama_ayah VARCHAR(150),
  nama_ibu VARCHAR(150),
  pekerjaan_ayah VARCHAR(120),
  pekerjaan_ibu VARCHAR(120),
  no_hp_ayah VARCHAR(60),
  no_hp_ibu VARCHAR(60),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tahun_ajaran_id, santri_id)
);

CREATE INDEX IF NOT EXISTS idx_santri_tahun_ajaran_tahun ON santri_tahun_ajaran(tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_santri_tahun_ajaran_santri ON santri_tahun_ajaran(santri_id);
CREATE INDEX IF NOT EXISTS idx_santri_tahun_ajaran_status ON santri_tahun_ajaran(status);

INSERT INTO tahun_ajaran (kode, tahun_mulai, tahun_selesai, status, is_active)
VALUES
  ('2016-2017', 2016, 2017, 'arsip', FALSE),
  ('2017-2018', 2017, 2018, 'arsip', FALSE),
  ('2018-2019', 2018, 2019, 'arsip', FALSE),
  ('2019-2020', 2019, 2020, 'arsip', FALSE),
  ('2020-2021', 2020, 2021, 'arsip', FALSE),
  ('2021-2022', 2021, 2022, 'arsip', FALSE),
  ('2022-2023', 2022, 2023, 'arsip', FALSE),
  ('2023-2024', 2023, 2024, 'arsip', FALSE),
  ('2024-2025', 2024, 2025, 'arsip', FALSE),
  ('2025-2026', 2025, 2026, 'arsip', FALSE),
  ('2026-2027', 2026, 2027, 'arsip', FALSE),
  ('2027-2028', 2027, 2028, 'arsip', FALSE),
  ('2028-2029', 2028, 2029, 'arsip', FALSE),
  ('2029-2030', 2029, 2030, 'arsip', FALSE)
ON CONFLICT (kode) DO NOTHING;

UPDATE tahun_ajaran
SET status = 'berjalan', is_active = TRUE
WHERE kode = '2025-2026'
  AND NOT EXISTS (SELECT 1 FROM tahun_ajaran WHERE is_active = TRUE);

INSERT INTO santri_tahun_ajaran (
  tahun_ajaran_id, santri_id, kelas_diniyah_id, kelas_sekolah_id, kamar_id, status,
  nis, nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat,
  nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu
)
SELECT
  ta.id, s.id, s.kelas_diniyah_id, s.kelas_sekolah_id, s.kamar_id, 'aktif',
  s.nis, s.nik, s.nama, s.jenis_kelamin, s.tempat_lahir, s.tanggal_lahir, s.alamat,
  o.nama_ayah, o.nama_ibu, o.pekerjaan_ayah, o.pekerjaan_ibu, o.no_hp_ayah, o.no_hp_ibu
FROM santri s
JOIN tahun_ajaran ta ON ta.is_active = TRUE
LEFT JOIN orangtua o ON s.orangtua_id = o.id
WHERE NOT EXISTS (SELECT 1 FROM alumni a WHERE a.santri_id = s.id)
ON CONFLICT (tahun_ajaran_id, santri_id) DO NOTHING;

-- Tabel kategori_evaluasi
CREATE TABLE IF NOT EXISTS kategori_evaluasi (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(150) NOT NULL UNIQUE,
  jenis VARCHAR(50) NOT NULL CHECK (jenis IN ('Semester', 'Harian', 'Khusus')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel setting_kriteria_nilai
CREATE TABLE IF NOT EXISTS setting_kriteria_nilai (
  id SERIAL PRIMARY KEY,
  kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  mata_pelajaran_id INTEGER NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  tipe_input VARCHAR(20) NOT NULL CHECK (tipe_input IN ('Angka', 'Teks')),
  konfigurasi JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (kelas_id, mata_pelajaran_id)
);

-- Tabel nilai_santri
CREATE TABLE IF NOT EXISTS nilai_santri (
  id SERIAL PRIMARY KEY,
  santri_id INTEGER NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  mata_pelajaran_id INTEGER NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
  kategori_evaluasi_id INTEGER REFERENCES kategori_evaluasi(id) ON DELETE SET NULL,
  nilai_angka NUMERIC(6,2),
  predikat VARCHAR(50),
  capaian VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (santri_id, mata_pelajaran_id, tahun_ajaran_id, kategori_evaluasi_id)
);

-- Insert default kategori_evaluasi
INSERT INTO kategori_evaluasi (nama, jenis) VALUES
('Semester Ganjil', 'Semester'),
('Semester Genap', 'Semester'),
('Harian / Tugas', 'Harian')
ON CONFLICT (nama) DO NOTHING;
