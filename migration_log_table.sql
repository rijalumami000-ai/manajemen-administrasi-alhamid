-- Tabel untuk menyimpan log migrasi (untuk fitur rollback)
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  source_tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
  target_tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id),
  migrated_count INTEGER NOT NULL,
  excluded_santri_ids INTEGER[],
  migration_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_migration_log_target ON migration_log(target_tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_migration_log_date ON migration_log(migration_date DESC);

-- Comment
COMMENT ON TABLE migration_log IS 'Log migrasi tahun ajaran untuk fitur rollback';
COMMENT ON COLUMN migration_log.source_tahun_ajaran_id IS 'ID tahun ajaran sumber (yang lama)';
COMMENT ON COLUMN migration_log.target_tahun_ajaran_id IS 'ID tahun ajaran target (yang baru)';
COMMENT ON COLUMN migration_log.migrated_count IS 'Jumlah santri yang dimigrasi';
COMMENT ON COLUMN migration_log.excluded_santri_ids IS 'Array ID santri yang tidak naik kelas';
COMMENT ON COLUMN migration_log.migration_date IS 'Tanggal migrasi dilakukan';
