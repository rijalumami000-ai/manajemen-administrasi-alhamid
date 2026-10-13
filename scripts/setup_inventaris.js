const db = require('../db');

async function setup() {
  console.log('Running setup_inventaris...');
  // 1. Create inventaris table
  await db.query(`
    CREATE TABLE IF NOT EXISTS inventaris (
      id SERIAL PRIMARY KEY,
      kategori VARCHAR(50) NOT NULL,
      nama_barang VARCHAR(200) NOT NULL,
      kode_barang VARCHAR(100),
      jumlah INTEGER NOT NULL DEFAULT 1,
      satuan VARCHAR(50) DEFAULT 'Unit',
      kondisi VARCHAR(50) DEFAULT 'Baik',
      lokasi VARCHAR(150),
      penanggung_jawab VARCHAR(150),
      keterangan TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Table inventaris created or exists.');

  // Check if inventaris has data
  const invCount = await db.query('SELECT COUNT(*) FROM inventaris');
  if (parseInt(invCount.rows[0].count, 10) === 0) {
    await db.query(`
      INSERT INTO inventaris (kategori, nama_barang, kode_barang, jumlah, satuan, kondisi, lokasi, penanggung_jawab, keterangan)
      VALUES
        ('pondok', 'Lemari Pakaian Santri 2 Pintu', 'INV-PDK-001', 30, 'Unit', 'Baik', 'Asrama Putra Lt. 1', 'Ustadz Ahmad', 'Fasilitas kamar santri baru'),
        ('pondok', 'Kasur Busa Tebal 15cm', 'INV-PDK-002', 50, 'Unit', 'Baik', 'Gudang Pondok', 'Kang Zaid', 'Cadangan asrama'),
        ('pondok', 'Kipas Angin Dinding Cosmos', 'INV-PDK-003', 12, 'Unit', 'Baik', 'Kamar Santri Putra', 'Pak Harun', 'Perawatan berkala'),
        ('pondok', 'Dispenser Air Panas & Dingin', 'INV-PDK-004', 4, 'Unit', 'Rusak Ringan', 'Ruang Makan Asrama', 'Bu Aminah', 'Keran air panas agak longgar'),
        ('madin', 'Papan Tulis Whiteboard 120x240', 'INV-MDN-001', 10, 'Unit', 'Baik', 'Gedung Madin Lt. 2', 'Ustadz Sholihin', 'Kelas 1A - 3D'),
        ('madin', 'Meja & Kursi Belajar Santri', 'INV-MDN-002', 120, 'Set', 'Baik', 'Semua Kelas Madin', 'Ustadz Sholihin', 'Kondisi kokoh'),
        ('madin', 'Kitab Kuning Fathul Qorib', 'INV-MDN-003', 85, 'Eksemplar', 'Baik', 'Perpustakaan Madin', 'Kang Ridwan', 'Pegangan kelas Wustho'),
        ('madin', 'Proyektor Epson EB-X400', 'INV-MDN-004', 2, 'Unit', 'Baik', 'Kantor Pengurus Madin', 'Ustadz Farhan', 'Untuk sidang dan ujian'),
        ('pmq', 'Al-Qur''an Al-Hufaz Tajwid Warna', 'INV-PMQ-001', 60, 'Eksemplar', 'Baik', 'Musholla PMQ', 'Ustadzah Fatimah', 'Standar PMQ Tilawah'),
        ('pmq', 'Rehal Kayu Jati Ukir', 'INV-PMQ-002', 50, 'Buah', 'Baik', 'Aula Murottal PMQ', 'Ustadz Syamsul', 'Rehal mengaji harian'),
        ('pmq', 'Sound System Portable + Mic Wireless', 'INV-PMQ-003', 2, 'Set', 'Baik', 'Panggung PMQ', 'Kang Ilham', 'Untuk latihan haflah & murottal')
    `);
    console.log('Sample inventaris data inserted.');
  }

  // 2. Assign some sample santri to kamar if none have kamar_id
  const checkKamar = await db.query('SELECT COUNT(*) FROM santri WHERE kamar_id IS NOT NULL');
  if (parseInt(checkKamar.rows[0].count, 10) === 0) {
    const kamars = await db.query('SELECT id, jenis FROM kamar ORDER BY id');
    const santris = await db.query('SELECT id, jenis_kelamin FROM santri ORDER BY id LIMIT 30');
    
    const putraKamar = kamars.rows.filter(k => k.jenis === 'Putra');
    const putriKamar = kamars.rows.filter(k => k.jenis === 'Putri');

    for (let i = 0; i < santris.rows.length; i++) {
      const s = santris.rows[i];
      let targetKamar = null;
      if (s.jenis_kelamin === 'L' || s.jenis_kelamin === 'Putra') {
        if (putraKamar.length > 0) targetKamar = putraKamar[i % putraKamar.length];
      } else {
        if (putriKamar.length > 0) targetKamar = putriKamar[i % putriKamar.length];
      }
      if (targetKamar) {
        await db.query('UPDATE santri SET kamar_id = $1 WHERE id = $2', [targetKamar.id, s.id]);
        await db.query('UPDATE santri_tahun_ajaran SET kamar_id = $1 WHERE santri_id = $2', [targetKamar.id, s.id]);
      }
    }
    console.log('Assigned sample santri to rooms.');
  }

  // Update room terisi counts
  await db.query(`
    UPDATE kamar k
    SET terisi = (
      SELECT COUNT(*) FROM santri s WHERE s.kamar_id = k.id
    )
  `);
  console.log('Updated room occupancy counts.');

  process.exit(0);
}

setup().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});
