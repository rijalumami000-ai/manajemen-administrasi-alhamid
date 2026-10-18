const db = require('../db');

async function runMigration() {
  console.log('🚀 Running robust Struktur Organisasi migration...');

  try {
    // 1. Column semester
    await db.query(`
      ALTER TABLE struktur_organisasi 
      ADD COLUMN IF NOT EXISTS semester VARCHAR(20) DEFAULT 'Ganjil';
    `);
    console.log('✅ Column semester verified.');

    // 2. Fetch all guru for safe matching
    const gurusRes = await db.query('SELECT id, nama FROM guru');
    const gurus = gurusRes.rows;

    function findGuruId(name) {
      if (!name) return null;
      const cleanTarget = name.toLowerCase()
        .replace(/^(ust\.|ustz\.|ustzh\.|ibu\.|ibu|bpk\.|bpk|ky\.|kyai)\s*/i, '')
        .trim();
      const match = gurus.find(g => {
        const cleanGuru = g.nama.toLowerCase()
          .replace(/^(ust\.|ustz\.|ustzh\.|ibu\.|ibu|bpk\.|bpk|ky\.|kyai)\s*/i, '')
          .trim();
        return cleanGuru.includes(cleanTarget) || cleanTarget.includes(cleanGuru);
      });
      return match ? match.id : null;
    }

    // 3. Panitia Semester Genap & Ganjil
    console.log('🔄 Checking Panitia Semester...');
    // Make sure existing rows have semester = 'Ganjil' if null
    await db.query(`
      UPDATE struktur_organisasi 
      SET semester = 'Ganjil' 
      WHERE tipe = 'panitia_ujian' AND (semester IS NULL OR semester = '');
    `);

    // Ensure Genap rows exist
    const genapCountRes = await db.query(`
      SELECT COUNT(*) FROM struktur_organisasi WHERE tipe = 'panitia_ujian' AND semester = 'Genap'
    `);
    if (parseInt(genapCountRes.rows[0].count, 10) === 0) {
      const panitiaSkeleton = [
        { jabatan: 'Penanggungjawab', no_urut: 1 },
        { jabatan: 'Ketua Panitia', no_urut: 2 },
        { jabatan: 'Sekretaris', no_urut: 3 },
        { jabatan: 'Bendahara', no_urut: 4 },
        { jabatan: 'Seksi Konsumsi', no_urut: 5 },
        { jabatan: 'Asisten Ujian', no_urut: 6 },
      ];
      for (const p of panitiaSkeleton) {
        await db.query(`
          INSERT INTO struktur_organisasi (tipe, jabatan, no_urut, semester, kategori)
          VALUES ('panitia_ujian', $1, $2, 'Genap', 'Panitia Ujian')
        `, [p.jabatan, p.no_urut]);
      }
      console.log('✅ Created 6 Genap skeleton rows for Panitia Semester.');
    } else {
      console.log('ℹ Genap rows already exist for Panitia Semester.');
    }

    // 4. Sync PMQ
    console.log('🔄 Syncing PMQ structure...');
    await db.query(`DELETE FROM struktur_organisasi WHERE tipe = 'pmq'`);

    const pmqRows = [
      // A. Pelindung
      { jabatan: 'Pelindung', nama: 'Ky. Imam Sonhaji Bukhori', no_urut: 1, kategori: 'Pelindung', keterangan: 'Pengasuh Ponpes' },
      { jabatan: 'Pelindung', nama: 'Umi Hadhonatul Fauzah', no_urut: 1, kategori: 'Pelindung', keterangan: 'Pengasuh Ponpes' },
      // B. Penasihat
      { jabatan: 'Penasihat', nama: "Ust. Isro'", no_urut: 2, kategori: 'Penasihat', keterangan: 'Penasihat PMQ' },
      // C. Dewan Harian
      { jabatan: 'Ketua Umum', nama: 'Ust. Muhammad Choirul Wafa', no_urut: 3, kategori: 'Dewan Harian', keterangan: 'Dewan Harian PMQ' },
      { jabatan: 'Ketua I', nama: 'Ust. Ahmad Syukron Rosyid', no_urut: 4, kategori: 'Dewan Harian', keterangan: 'Dewan Harian PMQ' },
      { jabatan: 'Sekretaris I', nama: 'Ust. Rijal Umami', no_urut: 5, kategori: 'Dewan Harian', keterangan: 'Dewan Harian PMQ' },
      { jabatan: 'Sekretaris II', nama: 'Ust. M. Nabil Farkhan', no_urut: 6, kategori: 'Dewan Harian', keterangan: 'Dewan Harian PMQ' },
      { jabatan: 'Bendahara I', nama: 'Ustzh. Elin Mukaromah', no_urut: 7, kategori: 'Dewan Harian', keterangan: 'Dewan Harian PMQ' },
      { jabatan: 'Bendahara II', nama: 'Ustzh. Siti Nurbaiti', no_urut: 8, kategori: 'Dewan Harian', keterangan: 'Dewan Harian PMQ' },
      // D. Koordinator Tingkatan
      { jabatan: 'Koordinator Jet Tempur (Putra)', nama: 'Ust. Rifki Ardiansyah Rehan', no_urut: 10, kategori: 'Koordinator Tingkatan', keterangan: 'Jet Tempur Putra' },
      { jabatan: 'Koordinator Jet Tempur (Putri)', nama: 'Ustz. Idah Fitriah', no_urut: 11, kategori: 'Koordinator Tingkatan', keterangan: 'Jet Tempur Putri' },
      { jabatan: 'Koordinator Persiapan (Putra)', nama: 'Ust. Yusuf Tama', no_urut: 12, kategori: 'Koordinator Tingkatan', keterangan: 'Persiapan Putra' },
      { jabatan: 'Koordinator Persiapan (Putri)', nama: 'Ustz. Elin Mukaromah', no_urut: 13, kategori: 'Koordinator Tingkatan', keterangan: 'Persiapan Putri' },
      { jabatan: 'Koordinator Jazariyyah (Putra)', nama: 'Ust. Sahlul Tsalisu Baihaqi', no_urut: 14, kategori: 'Koordinator Tingkatan', keterangan: 'Jazariyyah Putra' },
      { jabatan: 'Koordinator Jazariyyah (Putri)', nama: 'Ustz. Fatimatuzzahro', no_urut: 15, kategori: 'Koordinator Tingkatan', keterangan: 'Jazariyyah Putri' },
      { jabatan: 'Koordinator Al-Qur\'an (Putra)', nama: 'Ust. Alfian Agus Pratama', no_urut: 16, kategori: 'Koordinator Tingkatan', keterangan: 'Al-Qur\'an Putra' },
      { jabatan: 'Koordinator Al-Qur\'an (Putri)', nama: 'Ustz. Restu Maharani', no_urut: 17, kategori: 'Koordinator Tingkatan', keterangan: 'Al-Qur\'an Putri' },
      // E. Keamanan
      { jabatan: 'Keamanan Jazariyyah (Putra)', nama: 'Ust. Boy Sandi', no_urut: 20, kategori: 'Keamanan', keterangan: 'Keamanan Jazariyyah Putra' },
      { jabatan: 'Keamanan Jazariyyah (Putri)', nama: 'Ustz. Silfa Tasya syakila', no_urut: 21, kategori: 'Keamanan', keterangan: 'Keamanan Jazariyyah Putri' },
      { jabatan: 'Keamanan Persiapan (Putra)', nama: 'Ust. Indra Pratama', no_urut: 22, kategori: 'Keamanan', keterangan: 'Keamanan Persiapan Putra' },
      { jabatan: 'Keamanan Persiapan (Putri)', nama: 'Ustz. Nuzulul Rodiyah', no_urut: 23, kategori: 'Keamanan', keterangan: 'Keamanan Persiapan Putri' },
      { jabatan: 'Keamanan Jet Tempur (Putra)', nama: 'Ust. Argo Putra Wahono', no_urut: 24, kategori: 'Keamanan', keterangan: 'Keamanan Jet Tempur Putra' },
      { jabatan: 'Keamanan Jet Tempur (Putri)', nama: 'Ustz. Idah Fitriah', no_urut: 25, kategori: 'Keamanan', keterangan: 'Keamanan Jet Tempur Putri' },
      { jabatan: 'Keamanan Al-Qur\'an (Putra)', nama: 'Ust. Muhammad Abdul Haq', no_urut: 26, kategori: 'Keamanan', keterangan: 'Keamanan Al-Qur\'an Putra' },
      { jabatan: 'Keamanan Al-Qur\'an (Putri)', nama: 'Ustz. Restu Maharani', no_urut: 27, kategori: 'Keamanan', keterangan: 'Keamanan Al-Qur\'an Putri' },
    ];

    for (const r of pmqRows) {
      const gid = findGuruId(r.nama);
      await db.query(`
        INSERT INTO struktur_organisasi (tipe, jabatan, guru_id, nama_custom, no_urut, kategori, keterangan, semester)
        VALUES ('pmq', $1, $2, $3, $4, $5, $6, 'Ganjil')
      `, [r.jabatan, gid, r.nama, r.no_urut, r.kategori, r.keterangan]);
    }
    console.log(`✅ Seeded ${pmqRows.length} PMQ rows successfully.`);

    console.log('🎉 Migration finished successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    await db.pool.end();
  }
}

runMigration();
