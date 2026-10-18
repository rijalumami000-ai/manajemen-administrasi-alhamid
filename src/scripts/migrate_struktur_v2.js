const db = require('../../db');

async function migrate() {
  console.log('--- Starting Struktur v2 Migration ---');

  try {
    // 1. Add santri_id column to struktur_organisasi if not exists
    await db.query(`
      ALTER TABLE struktur_organisasi 
      ADD COLUMN IF NOT EXISTS santri_id INTEGER REFERENCES santri(id) ON DELETE SET NULL;
    `);
    console.log('✓ Column santri_id added/verified in struktur_organisasi');

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_struktur_organisasi_santri_id ON struktur_organisasi(santri_id);
    `);
    console.log('✓ Index on santri_id created');

    // 2. Create struktur_kategori table
    await db.query(`
      CREATE TABLE IF NOT EXISTS struktur_kategori (
        id SERIAL PRIMARY KEY,
        tipe VARCHAR(50) NOT NULL,
        nama_kategori VARCHAR(255) NOT NULL,
        no_urut INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tipe, nama_kategori)
      );
      ALTER TABLE struktur_kategori ALTER COLUMN nama_kategori TYPE VARCHAR(255);
    `);
    console.log('✓ Table struktur_kategori created/verified');

    // 3. Create struktur_jabatan table
    await db.query(`
      CREATE TABLE IF NOT EXISTS struktur_jabatan (
        id SERIAL PRIMARY KEY,
        tipe VARCHAR(50) NOT NULL,
        kategori VARCHAR(255) NOT NULL,
        nama_jabatan VARCHAR(255) NOT NULL,
        keterangan_default TEXT,
        no_urut INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tipe, kategori, nama_jabatan)
      );
      ALTER TABLE struktur_jabatan ALTER COLUMN kategori TYPE VARCHAR(255);
      ALTER TABLE struktur_jabatan ALTER COLUMN nama_jabatan TYPE VARCHAR(255);
      ALTER TABLE struktur_jabatan ALTER COLUMN keterangan_default TYPE TEXT;
    `);
    console.log('✓ Table struktur_jabatan created/verified');

    // 4. Normalize NULL categories for existing types to ensure every main tab has sub-tabs
    await db.query(`
      UPDATE struktur_organisasi 
      SET kategori = 'Dewan Penyantun' 
      WHERE tipe = 'dewan_penyantun' AND (kategori IS NULL OR TRIM(kategori) = '');
    `);

    await db.query(`
      UPDATE struktur_organisasi 
      SET kategori = 'Struktur Madrasah' 
      WHERE tipe = 'madrasah_diniyah' AND (kategori IS NULL OR TRIM(kategori) = '');
    `);

    await db.query(`
      UPDATE struktur_organisasi 
      SET kategori = 'Panitia Ujian' 
      WHERE tipe = 'panitia_ujian' AND (kategori IS NULL OR TRIM(kategori) = '');
    `);

    await db.query(`
      UPDATE struktur_organisasi 
      SET kategori = 'Panitia Sambangan' 
      WHERE tipe = 'panitia_sambangan' AND (kategori IS NULL OR TRIM(kategori) = '');
    `);

    await db.query(`
      UPDATE struktur_organisasi 
      SET kategori = 'Panitia Haflah' 
      WHERE tipe = 'panitia_haflah' AND (kategori IS NULL OR TRIM(kategori) = '');
    `);

    await db.query(`
      UPDATE struktur_organisasi 
      SET kategori = 'Panitia PSB' 
      WHERE tipe = 'panitia_psb' AND (kategori IS NULL OR TRIM(kategori) = '');
    `);
    console.log('✓ Normalized existing NULL categories');

    // 5. Seed struktur_kategori from existing distinct (tipe, kategori)
    await db.query(`
      INSERT INTO struktur_kategori (tipe, nama_kategori, no_urut)
      SELECT DISTINCT tipe, kategori, 0
      FROM struktur_organisasi
      WHERE kategori IS NOT NULL AND TRIM(kategori) != ''
      ON CONFLICT (tipe, nama_kategori) DO NOTHING;
    `);
    console.log('✓ Seeded struktur_kategori from existing data');

    // 6. Seed struktur_jabatan from existing distinct (tipe, kategori, jabatan)
    await db.query(`
      INSERT INTO struktur_jabatan (tipe, kategori, nama_jabatan, keterangan_default, no_urut)
      SELECT DISTINCT tipe, kategori, jabatan, MAX(keterangan), MIN(no_urut)
      FROM struktur_organisasi
      WHERE kategori IS NOT NULL AND jabatan IS NOT NULL AND TRIM(jabatan) != ''
      GROUP BY tipe, kategori, jabatan
      ON CONFLICT (tipe, kategori, nama_jabatan) DO NOTHING;
    `);
    console.log('✓ Seeded struktur_jabatan from existing data');

    // 7. Update default no_urut for standard categories
    const standardOrders = [
      { tipe: 'dewan_penyantun', k: 'Dewan Penyantun', n: 1 },
      { tipe: 'pondok_putra', k: 'Dewan Harian Putra', n: 1 },
      { tipe: 'pondok_putra', k: 'Dewan Pleno Putra', n: 2 },
      { tipe: 'pondok_putra', k: 'Ketua Kamar Putra', n: 3 },
      { tipe: 'pondok_putra', k: 'PJ Kamar Putra', n: 4 },
      { tipe: 'pondok_putri', k: 'Dewan Harian Putri', n: 1 },
      { tipe: 'pondok_putri', k: 'Dewan Pleno Putri', n: 2 },
      { tipe: 'pondok_putri', k: 'PJ Komplek Putri', n: 3 },
      { tipe: 'pondok_putri', k: 'Ketua Kamar Putri', n: 4 },
      { tipe: 'jamiyyah', k: "Jam'iyyah Pusat", n: 1 },
      { tipe: 'jamiyyah', k: "Jam'iyyah Putra", n: 2 },
      { tipe: 'jamiyyah', k: "Jam'iyyah Putri", n: 3 },
      { tipe: 'pmq', k: 'Pelindung', n: 1 },
      { tipe: 'pmq', k: 'Penasihat', n: 2 },
      { tipe: 'pmq', k: 'Dewan Harian', n: 3 },
      { tipe: 'pmq', k: 'Koordinator Tingkatan', n: 4 },
      { tipe: 'pmq', k: 'Keamanan', n: 5 },
      { tipe: 'madrasah_diniyah', k: 'Struktur Madrasah', n: 1 },
      { tipe: 'panitia_sambangan', k: 'Panitia Sambangan', n: 1 },
      { tipe: 'panitia_haflah', k: 'Panitia Haflah', n: 1 },
      { tipe: 'panitia_psb', k: 'Panitia PSB', n: 1 },
      { tipe: 'panitia_ujian', k: 'Panitia Ujian', n: 1 }
    ];
    for (const o of standardOrders) {
      await db.query('UPDATE struktur_kategori SET no_urut = $1 WHERE tipe = $2 AND nama_kategori = $3', [o.n, o.tipe, o.k]);
    }
    console.log('✓ Updated default category ordering');

    console.log('--- Migration completed successfully! ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
