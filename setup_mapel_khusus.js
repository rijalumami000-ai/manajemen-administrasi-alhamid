const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool();

async function setup() {
  const mapels = [
    { nama: 'Muhafadzoh Mini 1', jenis: 'Muhafadzoh' },
    { nama: 'Muhafadzoh Mini 2', jenis: 'Muhafadzoh' },
    { nama: 'Muhafadzoh Mini 3', jenis: 'Muhafadzoh' },
    { nama: 'Muhafadzoh Mini 4', jenis: 'Muhafadzoh' },
    { nama: 'Muhafadzoh Akbar', jenis: 'Muhafadzoh' },
    { nama: 'Qiroatul Kitab', jenis: 'Qiroatul_Kitab' },
    { nama: 'Taftisyul Kutub', jenis: 'Taftisyul_Kutub' }
  ];

  try {
    console.log('Setting up special subjects...');
    for (const m of mapels) {
      await pool.query(
        'INSERT INTO mata_pelajaran (nama, jenis) VALUES ($1, $2) ON CONFLICT (nama) DO UPDATE SET jenis = EXCLUDED.jenis',
        [m.nama, m.jenis]
      );
    }
    console.log('Special subjects setup complete.');
  } catch (err) {
    console.error('Setup failed:', err);
  } finally {
    await pool.end();
  }
}

setup();
