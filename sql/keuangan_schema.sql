-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║      SCHEMA SISTEM KEUANGAN — PONPES AL-HAMID                          ║
-- ║      Dibuat: Juni 2026                                                  ║
-- ║      Terintegrasi dengan: santri, tahun_ajaran, users                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- CATATAN PENTING:
-- Semua CREATE TABLE menggunakan IF NOT EXISTS (aman untuk re-run)
-- Semua INSERT menggunakan ON CONFLICT DO NOTHING (idempotent)

-- ════════════════════════════════════════════════════════════════════════════
-- TABEL 1: jenis_iuran — Master jenis iuran pesantren
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jenis_iuran (
  id           SERIAL PRIMARY KEY,
  kode         VARCHAR(40)  NOT NULL UNIQUE,
  nama         VARCHAR(150) NOT NULL,
  kategori     VARCHAR(30)  NOT NULL
                 CHECK (kategori IN (
                   'spp_bulanan',       -- SPP Makan, SPP Madin
                   'daftar_ulang_baru', -- Item khusus santri baru
                   'daftar_ulang_lama', -- Item khusus santri lama
                   'event',             -- Insidental (haflah, kitab, dll.)
                   'lain'
                 )),
  deskripsi    TEXT,
  urutan       INTEGER      NOT NULL DEFAULT 0,  -- Untuk urutan tampilan
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed data: semua jenis iuran standar pesantren
INSERT INTO jenis_iuran (kode, nama, kategori, urutan) VALUES
  -- SPP Bulanan (dua jenis)
  ('SPP_MAKAN',          'SPP Makan',                    'spp_bulanan',         10),
  ('SPP_MADIN',          'SPP Madin',                    'spp_bulanan',         20),
  -- Daftar Ulang Santri Baru (6 item)
  ('DU_BARU_INFAQ',      'Infaq Bangunan',               'daftar_ulang_baru',   10),
  ('DU_BARU_LEMARI',     'Lemari',                       'daftar_ulang_baru',   20),
  ('DU_BARU_KASUR',      'Kasur',                        'daftar_ulang_baru',   30),
  ('DU_BARU_KTS',        'KTS (Kartu Tanda Santri)',     'daftar_ulang_baru',   40),
  ('DU_BARU_SAMPUL',     'Sampul Rapot',                 'daftar_ulang_baru',   50),
  ('DU_BARU_HAFLAH',     'Cicilan Haflah (Santri Baru)', 'daftar_ulang_baru',   60),
  -- Daftar Ulang Santri Lama (2 item)
  ('DU_LAMA_INFAQ',      'Infaq Bangunan (Santri Lama)', 'daftar_ulang_lama',   10),
  ('DU_LAMA_HAFLAH',     'Cicilan Haflah (Santri Lama)', 'daftar_ulang_lama',   20),
  -- Event / Insidental (5 event)
  ('EVT_PELUNASAN_HAFLAH','Pelunasan Haflah',            'event',               10),
  ('EVT_SERAGAM_HAFLAH', 'Seragam Haflah',               'event',               20),
  ('EVT_KITAB_RAMADHAN', 'Kitab Ramadhan',               'event',               30),
  ('EVT_ADM_GANJIL',     'Administrasi Semester Ganjil', 'event',               40),
  ('EVT_ADM_GENAP',      'Administrasi Semester Genap',  'event',               50)
ON CONFLICT (kode) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- TABEL 2: tarif_iuran — Nominal tarif per tahun ajaran (default tahunan)
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tarif_iuran (
  id               SERIAL PRIMARY KEY,
  jenis_iuran_id   INTEGER      NOT NULL REFERENCES jenis_iuran(id) ON DELETE RESTRICT,
  tahun_ajaran_id  INTEGER      NOT NULL REFERENCES tahun_ajaran(id) ON DELETE RESTRICT,
  nominal          NUMERIC(15,2) NOT NULL CHECK (nominal >= 0),
  keterangan       TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (jenis_iuran_id, tahun_ajaran_id)
);

CREATE INDEX IF NOT EXISTS idx_tarif_iuran_lookup
  ON tarif_iuran(jenis_iuran_id, tahun_ajaran_id);

-- ════════════════════════════════════════════════════════════════════════════
-- TABEL 3: tarif_iuran_bulanan — Override tarif untuk bulan tertentu
--   Contoh: SPP Makan bulan Ramadhan dikurangi menjadi Rp 200.000
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tarif_iuran_bulanan (
  id               SERIAL PRIMARY KEY,
  jenis_iuran_id   INTEGER      NOT NULL REFERENCES jenis_iuran(id) ON DELETE RESTRICT,
  tahun_ajaran_id  INTEGER      NOT NULL REFERENCES tahun_ajaran(id) ON DELETE RESTRICT,
  bulan            INTEGER      NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun_kalender   INTEGER      NOT NULL,
  nominal          NUMERIC(15,2) NOT NULL CHECK (nominal >= 0),
  keterangan       TEXT,                    -- "Bulan Ramadhan 1447H"
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (jenis_iuran_id, tahun_ajaran_id, bulan, tahun_kalender)
);

CREATE INDEX IF NOT EXISTS idx_tarif_bulanan_lookup
  ON tarif_iuran_bulanan(jenis_iuran_id, tahun_ajaran_id, bulan, tahun_kalender);

-- ════════════════════════════════════════════════════════════════════════════
-- TABEL 4: pengecualian_iuran — Santri yang dibebaskan dari iuran tertentu
--   Contoh: anak yatim bebas SPP Makan selama satu tahun ajaran
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pengecualian_iuran (
  id               SERIAL PRIMARY KEY,
  santri_id        INTEGER      NOT NULL REFERENCES santri(id) ON DELETE CASCADE,
  jenis_iuran_id   INTEGER      NOT NULL REFERENCES jenis_iuran(id) ON DELETE RESTRICT,
  tahun_ajaran_id  INTEGER      NOT NULL REFERENCES tahun_ajaran(id) ON DELETE RESTRICT,
  alasan           TEXT,                    -- "Anak yatim", "Beasiswa Kyai", dll.
  dicatat_oleh     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (santri_id, jenis_iuran_id, tahun_ajaran_id)
);

CREATE INDEX IF NOT EXISTS idx_pengecualian_santri_ta
  ON pengecualian_iuran(santri_id, tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_pengecualian_jenis
  ON pengecualian_iuran(jenis_iuran_id, tahun_ajaran_id);

-- ════════════════════════════════════════════════════════════════════════════
-- TABEL 5: tagihan — Tagihan spesifik per santri per iuran per periode
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tagihan (
  id                  SERIAL PRIMARY KEY,
  santri_id           INTEGER       NOT NULL REFERENCES santri(id) ON DELETE RESTRICT,
  jenis_iuran_id      INTEGER       NOT NULL REFERENCES jenis_iuran(id) ON DELETE RESTRICT,
  tahun_ajaran_id     INTEGER       NOT NULL REFERENCES tahun_ajaran(id) ON DELETE RESTRICT,
  -- Periode (diisi untuk SPP bulanan)
  periode_bulan       INTEGER       CHECK (periode_bulan BETWEEN 1 AND 12),
  periode_tahun       INTEGER,
  -- Nominal
  nominal_tagihan     NUMERIC(15,2) NOT NULL CHECK (nominal_tagihan >= 0),
  nominal_diskon      NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (nominal_diskon >= 0),
  -- Status
  status              VARCHAR(20)   NOT NULL DEFAULT 'belum_lunas'
                        CHECK (status IN (
                          'belum_lunas',  -- Belum ada pembayaran
                          'sebagian',     -- Ada pembayaran tapi belum lunas
                          'lunas',        -- Sudah lunas penuh
                          'dibebaskan'    -- Santri mendapat pembebasan (free SPP)
                        )),
  tanggal_jatuh_tempo DATE,
  catatan             TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  -- Constraint: satu tagihan per santri per jenis per periode
  UNIQUE (santri_id, jenis_iuran_id, tahun_ajaran_id, periode_bulan, periode_tahun)
);

CREATE INDEX IF NOT EXISTS idx_tagihan_santri       ON tagihan(santri_id);
CREATE INDEX IF NOT EXISTS idx_tagihan_status       ON tagihan(status);
CREATE INDEX IF NOT EXISTS idx_tagihan_ta           ON tagihan(tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_tagihan_jenis        ON tagihan(jenis_iuran_id);
CREATE INDEX IF NOT EXISTS idx_tagihan_periode      ON tagihan(periode_tahun, periode_bulan);
CREATE INDEX IF NOT EXISTS idx_tagihan_jatuh_tempo  ON tagihan(tanggal_jatuh_tempo);

-- ════════════════════════════════════════════════════════════════════════════
-- TABEL 6: pembayaran — Transaksi pembayaran dari santri (kas masuk)
--   CATATAN KEAMANAN: Pembayaran TIDAK BOLEH dihapus — hanya di-void
-- ════════════════════════════════════════════════════════════════════════════
CREATE SEQUENCE IF NOT EXISTS seq_no_kwitansi START 1;

CREATE TABLE IF NOT EXISTS pembayaran (
  id               SERIAL PRIMARY KEY,
  -- Nomor kwitansi otomatis (server-side, tidak bisa dimanipulasi)
  no_kwitansi      VARCHAR(30)   UNIQUE,   -- Format: KWT/2026/000001
  -- Relasi
  tagihan_id       INTEGER       REFERENCES tagihan(id) ON DELETE RESTRICT,
  santri_id        INTEGER       NOT NULL REFERENCES santri(id) ON DELETE RESTRICT,
  jenis_iuran_id   INTEGER       NOT NULL REFERENCES jenis_iuran(id) ON DELETE RESTRICT,
  tahun_ajaran_id  INTEGER       NOT NULL REFERENCES tahun_ajaran(id) ON DELETE RESTRICT,
  -- Nilai
  nominal          NUMERIC(15,2) NOT NULL CHECK (nominal > 0),
  metode_bayar     VARCHAR(20)   NOT NULL DEFAULT 'tunai'
                     CHECK (metode_bayar IN ('tunai', 'transfer', 'qris')),
  -- Periode
  tanggal_bayar    DATE          NOT NULL DEFAULT CURRENT_DATE,
  periode_bulan    INTEGER       CHECK (periode_bulan BETWEEN 1 AND 12),
  periode_tahun    INTEGER,
  -- Pencatatan
  dicatat_oleh     INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  keterangan       TEXT,
  -- Void (IMMUTABLE — tidak bisa delete, hanya void)
  is_void          BOOLEAN       NOT NULL DEFAULT FALSE,
  void_reason      TEXT,
  void_oleh        INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  void_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pembayaran_santri      ON pembayaran(santri_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_tanggal     ON pembayaran(tanggal_bayar DESC);
CREATE INDEX IF NOT EXISTS idx_pembayaran_ta          ON pembayaran(tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_tagihan     ON pembayaran(tagihan_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_no_kwitansi ON pembayaran(no_kwitansi);
CREATE INDEX IF NOT EXISTS idx_pembayaran_is_void     ON pembayaran(is_void);

-- ════════════════════════════════════════════════════════════════════════════
-- TABEL 7: kas_keluar — Pengeluaran (4 jenis terpisah)
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS kas_keluar (
  id               SERIAL PRIMARY KEY,
  jenis_kas        VARCHAR(20)   NOT NULL
                     CHECK (jenis_kas IN (
                       'kas_pondok',      -- Pengeluaran Pondok
                       'kas_madin',       -- Pengeluaran Madin
                       'kas_smt_ganjil',  -- Semester Ganjil Madin
                       'kas_smt_genap'    -- Semester Genap Madin
                     )),
  tahun_ajaran_id  INTEGER       REFERENCES tahun_ajaran(id) ON DELETE SET NULL,
  nominal          NUMERIC(15,2) NOT NULL CHECK (nominal > 0),
  tanggal          DATE          NOT NULL DEFAULT CURRENT_DATE,
  keterangan       TEXT          NOT NULL,
  penerima         VARCHAR(150),           -- Siapa yang menerima / vendor
  dicatat_oleh     INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  -- Void support
  is_void          BOOLEAN       NOT NULL DEFAULT FALSE,
  void_reason      TEXT,
  void_oleh        INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  void_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kas_keluar_tanggal   ON kas_keluar(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_kas_keluar_jenis      ON kas_keluar(jenis_kas);
CREATE INDEX IF NOT EXISTS idx_kas_keluar_ta         ON kas_keluar(tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_kas_keluar_is_void    ON kas_keluar(is_void);

-- ════════════════════════════════════════════════════════════════════════════
-- TABEL 8: audit_keuangan — Log semua operasi tulis keuangan
--   Setiap create/void/edit harus insert ke sini secara atomik
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_keuangan (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER      NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action       VARCHAR(60)  NOT NULL
                 CHECK (action IN (
                   'CATAT_PEMBAYARAN',
                   'VOID_PEMBAYARAN',
                   'GENERATE_TAGIHAN_MASSAL',
                   'CREATE_TAGIHAN_MANUAL',
                   'UPDATE_TAGIHAN',
                   'CATAT_KAS_KELUAR',
                   'EDIT_KAS_KELUAR',
                   'VOID_KAS_KELUAR',
                   'SET_TARIF',
                   'SET_TARIF_BULANAN',
                   'DELETE_TARIF_BULANAN',
                   'SET_PENGECUALIAN',
                   'CABUT_PENGECUALIAN'
                 )),
  entity_type  VARCHAR(40),    -- 'pembayaran', 'tagihan', 'kas_keluar', dll.
  entity_id    INTEGER,        -- ID record yang dimodifikasi
  nilai_lama   JSONB,          -- Snapshot data sebelum berubah
  nilai_baru   JSONB,          -- Snapshot data setelah berubah
  keterangan   TEXT,
  ip_address   VARCHAR(50),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_keu_user    ON audit_keuangan(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_keu_action  ON audit_keuangan(action);
CREATE INDEX IF NOT EXISTS idx_audit_keu_entity  ON audit_keuangan(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_keu_created ON audit_keuangan(created_at DESC);
