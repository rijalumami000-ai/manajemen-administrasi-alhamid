-- Create table for organizational structures (Madrasah Diniyah & Exam Committee)
CREATE TABLE IF NOT EXISTS struktur_organisasi (
  id SERIAL PRIMARY KEY,
  tipe VARCHAR(50) NOT NULL CHECK (tipe IN ('madrasah_diniyah', 'panitia_ujian')),
  jabatan VARCHAR(100) NOT NULL,
  guru_id INTEGER REFERENCES guru(id) ON DELETE SET NULL,
  nama_custom VARCHAR(150),
  keterangan TEXT,
  no_urut INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for daily lesson schedule
CREATE TABLE IF NOT EXISTS jadwal_pelajaran_harian (
  id SERIAL PRIMARY KEY,
  tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
  kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  malam VARCHAR(50) NOT NULL, -- e.g., 'Malam Sabtu', 'Malam Senin', etc.
  jam_ke INTEGER NOT NULL CHECK (jam_ke IN (1, 2)),
  mata_pelajaran_id INTEGER REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
  guru_id INTEGER REFERENCES guru(id) ON DELETE SET NULL, -- ustadz / ustadzah
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tahun_ajaran_id, kelas_id, malam, jam_ke)
);

-- Seed predefined roles for Madrasah Diniyah structure using DO block (idempotent, no UNIQUE key needed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM struktur_organisasi WHERE tipe = 'madrasah_diniyah') THEN
    INSERT INTO struktur_organisasi (tipe, jabatan, no_urut) VALUES
    ('madrasah_diniyah', 'Pelindung & Penasehat', 1),
    ('madrasah_diniyah', 'Kepala Madrasah', 2),
    ('madrasah_diniyah', 'Waka Kurikulum', 3),
    ('madrasah_diniyah', 'Waka Kesiswaan', 4),
    ('madrasah_diniyah', 'Sekretaris', 5),
    ('madrasah_diniyah', 'Bendahara', 6),
    ('madrasah_diniyah', 'TU', 7);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM struktur_organisasi WHERE tipe = 'panitia_ujian') THEN
    INSERT INTO struktur_organisasi (tipe, jabatan, no_urut) VALUES
    ('panitia_ujian', 'Penanggungjawab', 1),
    ('panitia_ujian', 'Ketua Panitia', 2),
    ('panitia_ujian', 'Sekretaris', 3),
    ('panitia_ujian', 'Bendahara', 4),
    ('panitia_ujian', 'Seksi Konsumsi', 5),
    ('panitia_ujian', 'Asisten Ujian', 6);
  END IF;
END
$$;
