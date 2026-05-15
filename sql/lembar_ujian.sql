CREATE TABLE IF NOT EXISTS lembar_ujian (
    id SERIAL PRIMARY KEY,
    tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
    semester VARCHAR(10) NOT NULL,
    tingkat INTEGER NOT NULL,
    pelajaran VARCHAR(100) NOT NULL,
    is_her BOOLEAN DEFAULT false,
    judul VARCHAR(255),
    sub_judul VARCHAR(255),
    alamat VARCHAR(255),
    hari_tanggal VARCHAR(100),
    instruksi TEXT,
    soal JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lembar_ujian_lookup ON lembar_ujian(tahun_ajaran_id, semester, tingkat, is_her);

-- Tabel untuk menyimpan pengaturan global (seperti Kop Surat)
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
