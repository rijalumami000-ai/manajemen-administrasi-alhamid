-- Tambah kolom 'jenis' ke tabel mata_pelajaran
ALTER TABLE mata_pelajaran ADD COLUMN IF NOT EXISTS jenis VARCHAR(50) DEFAULT 'Reguler';

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
