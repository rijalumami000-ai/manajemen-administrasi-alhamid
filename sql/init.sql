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
