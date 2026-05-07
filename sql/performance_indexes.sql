-- Performance Optimization Indexes
-- Created: 2026-05-02
-- Purpose: Improve query performance for frequently accessed columns

-- ============================================
-- SANTRI TABLE INDEXES
-- ============================================

-- Index on NIS (frequently used for search and unique constraint)
CREATE INDEX IF NOT EXISTS idx_santri_nis ON santri(nis);

-- Index on NIK (frequently used for search)
CREATE INDEX IF NOT EXISTS idx_santri_nik ON santri(nik);

-- Index on nama (frequently used for search)
CREATE INDEX IF NOT EXISTS idx_santri_nama ON santri(nama);

-- Index on jenis_kelamin (frequently used for filtering)
CREATE INDEX IF NOT EXISTS idx_santri_jenis_kelamin ON santri(jenis_kelamin);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_santri_nama_nis ON santri(nama, nis);

-- ============================================
-- SANTRI_TAHUN_AJARAN TABLE INDEXES
-- ============================================

-- Index on santri_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_sta_santri_id ON santri_tahun_ajaran(santri_id);

-- Index on tahun_ajaran_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_sta_tahun_ajaran_id ON santri_tahun_ajaran(tahun_ajaran_id);

-- Index on status (frequently used for filtering)
CREATE INDEX IF NOT EXISTS idx_sta_status ON santri_tahun_ajaran(status);

-- Index on kelas_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_sta_kelas_id ON santri_tahun_ajaran(kelas_id);

-- Index on kamar_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_sta_kamar_id ON santri_tahun_ajaran(kamar_id);

-- Composite index for active santri queries
CREATE INDEX IF NOT EXISTS idx_sta_tahun_status ON santri_tahun_ajaran(tahun_ajaran_id, status);

-- ============================================
-- GURU TABLE INDEXES
-- ============================================

-- Index on nama (frequently used for search)
CREATE INDEX IF NOT EXISTS idx_guru_nama ON guru(nama);

-- Index on nik (frequently used for search and unique constraint)
CREATE INDEX IF NOT EXISTS idx_guru_nik ON guru(nik);

-- Index on status (frequently used for filtering)
CREATE INDEX IF NOT EXISTS idx_guru_status ON guru(status);

-- ============================================
-- ALUMNI TABLE INDEXES
-- ============================================

-- Index on santri_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_alumni_santri_id ON alumni(santri_id);

-- Index on nis (frequently used for search)
CREATE INDEX IF NOT EXISTS idx_alumni_nis ON alumni(nis);

-- Index on nama (frequently used for search)
CREATE INDEX IF NOT EXISTS idx_alumni_nama ON alumni(nama);

-- Index on tahun_lulus (frequently used for filtering)
CREATE INDEX IF NOT EXISTS idx_alumni_tahun_lulus ON alumni(tahun_lulus);

-- ============================================
-- KELAS TABLE INDEXES
-- ============================================

-- Index on nama (frequently used for search)
CREATE INDEX IF NOT EXISTS idx_kelas_nama ON kelas(nama);

-- Index on jenis (frequently used for filtering)
CREATE INDEX IF NOT EXISTS idx_kelas_jenis ON kelas(jenis);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_kelas_jenis_nama ON kelas(jenis, nama);

-- ============================================
-- KAMAR TABLE INDEXES
-- ============================================

-- Index on nama (frequently used for search)
CREATE INDEX IF NOT EXISTS idx_kamar_nama ON kamar(nama);

-- Index on jenis (frequently used for filtering)
CREATE INDEX IF NOT EXISTS idx_kamar_jenis ON kamar(jenis);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_kamar_jenis_nama ON kamar(jenis, nama);

-- ============================================
-- PELANGGARAN TABLE INDEXES
-- ============================================

-- Index on santri_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_pelanggaran_santri_id ON pelanggaran(santri_id);

-- Index on tanggal (frequently used for sorting and filtering)
CREATE INDEX IF NOT EXISTS idx_pelanggaran_tanggal ON pelanggaran(tanggal);

-- Composite index for santri pelanggaran queries
CREATE INDEX IF NOT EXISTS idx_pelanggaran_santri_tanggal ON pelanggaran(santri_id, tanggal DESC);

-- ============================================
-- PRESTASI TABLE INDEXES
-- ============================================

-- Index on santri_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_prestasi_santri_id ON prestasi(santri_id);

-- Index on tanggal (frequently used for sorting and filtering)
CREATE INDEX IF NOT EXISTS idx_prestasi_tanggal ON prestasi(tanggal);

-- Composite index for santri prestasi queries
CREATE INDEX IF NOT EXISTS idx_prestasi_santri_tanggal ON prestasi(santri_id, tanggal DESC);

-- ============================================
-- TAHUN_AJARAN TABLE INDEXES
-- ============================================

-- Index on is_active (frequently used for filtering)
CREATE INDEX IF NOT EXISTS idx_tahun_ajaran_is_active ON tahun_ajaran(is_active);

-- Index on kode (frequently used for search and unique constraint)
CREATE INDEX IF NOT EXISTS idx_tahun_ajaran_kode ON tahun_ajaran(kode);

-- ============================================
-- USERS TABLE INDEXES
-- ============================================

-- Index on username (frequently used for login and unique constraint)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Index on email (frequently used for search)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on role (frequently used for filtering)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index on is_active (frequently used for filtering)
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================
-- SESSIONS TABLE INDEXES
-- ============================================

-- Index on user_id (foreign key, frequently joined)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Index on token (frequently used for authentication)
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Index on expires_at (frequently used for cleanup)
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Composite index for active sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);

-- ============================================
-- VERIFICATION
-- ============================================

-- List all indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage statistics (run after some time in production)
-- SELECT
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan as index_scans,
--     idx_tup_read as tuples_read,
--     idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- ============================================
-- NOTES
-- ============================================

-- 1. These indexes will improve SELECT query performance
-- 2. They will slightly slow down INSERT/UPDATE/DELETE operations
-- 3. Monitor index usage in production and drop unused indexes
-- 4. Consider VACUUM ANALYZE after creating indexes
-- 5. For very large tables, create indexes with CONCURRENTLY option

-- To create indexes without locking the table (production):
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name ON table(column);

-- To analyze tables after creating indexes:
-- ANALYZE santri;
-- ANALYZE santri_tahun_ajaran;
-- ANALYZE guru;
-- ANALYZE alumni;
-- etc.
