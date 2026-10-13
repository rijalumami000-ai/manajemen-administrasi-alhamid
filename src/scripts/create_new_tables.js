const db = require('../../db');

async function migrate() {
  const client = await db.getClient ? db.getClient() : db;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS materi_sidang (
        id SERIAL PRIMARY KEY,
        tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE SET NULL,
        tahun_masehi VARCHAR(50),
        kategori VARCHAR(50) NOT NULL,
        judul VARCHAR(255) NOT NULL,
        no_surat VARCHAR(100),
        tanggal DATE,
        halaman INTEGER DEFAULT 0,
        ukuran VARCHAR(50),
        status VARCHAR(100),
        pengesah VARCHAR(150),
        ringkasan TEXT,
        file_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS jadwal_kajian_balagh (
        id SERIAL PRIMARY KEY,
        tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        kelas VARCHAR(100) NOT NULL,
        waktu VARCHAR(100) NOT NULL,
        qori VARCHAR(150) NOT NULL,
        kitab VARCHAR(150) NOT NULL,
        tempat VARCHAR(150),
        no_urut INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS jadwal_imam_tarawih (
        id SERIAL PRIMARY KEY,
        tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
        malam INTEGER NOT NULL,
        imam VARCHAR(150) NOT NULL,
        bilal VARCHAR(150),
        tempat VARCHAR(150),
        no_urut INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Ensure tables have tahun_ajaran_id
      ALTER TABLE materi_sidang ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE SET NULL;
      ALTER TABLE materi_sidang ADD COLUMN IF NOT EXISTS tahun_masehi VARCHAR(50);
      ALTER TABLE jadwal_kajian_balagh ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE CASCADE;
      ALTER TABLE jadwal_imam_tarawih ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE CASCADE;

      -- Ensure struktur_organisasi has tahun_ajaran_id
      ALTER TABLE struktur_organisasi ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE SET NULL;

      -- Ensure pelanggaran and prestasi have tahun_ajaran_id
      ALTER TABLE pelanggaran ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE SET NULL;
      ALTER TABLE prestasi ADD COLUMN IF NOT EXISTS tahun_ajaran_id INTEGER REFERENCES tahun_ajaran(id) ON DELETE SET NULL;

      -- Backfill NULL tahun_ajaran_id for pelanggaran and prestasi with active year
      UPDATE pelanggaran 
      SET tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE is_active = true LIMIT 1) 
      WHERE tahun_ajaran_id IS NULL;

      UPDATE prestasi 
      SET tahun_ajaran_id = (SELECT id FROM tahun_ajaran WHERE is_active = true LIMIT 1) 
      WHERE tahun_ajaran_id IS NULL;

      -- Update CHECK constraint to allow all new structure types
      ALTER TABLE struktur_organisasi DROP CONSTRAINT IF EXISTS struktur_organisasi_tipe_check;
      ALTER TABLE struktur_organisasi ADD CONSTRAINT struktur_organisasi_tipe_check CHECK (
        tipe IN ('madrasah_diniyah', 'panitia_ujian', 'pmq', 'pondok_putra', 'pondok_putri', 'panitia_sambangan', 'panitia_haflah', 'panitia_psb')
      );
    `);

    console.log('Tables created successfully!');

    // Check if initial dummy/default records exist for seed
    const activeTaRes = await db.query('SELECT id, kode FROM tahun_ajaran WHERE is_active = true LIMIT 1');
    const activeTaId = activeTaRes.rows[0]?.id || 10;
    const activeTaKode = activeTaRes.rows[0]?.kode || '2025-2026';

    // Seed default positions for struktur kepesantrenan if empty
    const existingStruktur = await db.query("SELECT DISTINCT tipe FROM struktur_organisasi");
    const existingTypes = existingStruktur.rows.map(r => r.tipe);

    const defaultStructures = [
      // PMQ
      {
        tipe: 'pmq',
        positions: [
          { jabatan: 'Direktur Eksekutif PMQ', no_urut: 1, nama_custom: 'K.H. Ahmad Dahlan, Lc', keterangan: 'Kebijakan & Kurikulum Al-Quran' },
          { jabatan: 'Koordinator Tahfidz 30 Juz', no_urut: 2, nama_custom: 'Ust. H. Syarif Hidayatullah, Al-Hafidz', keterangan: 'Bimbingan Mutqin & Tasmi Akbar' },
          { jabatan: "Koordinator Tartil & Tahsin (Yanbu'a)", no_urut: 3, nama_custom: 'Ust. Farhan Azis, S.Pd', keterangan: 'Kenaikan Jilid & Munaqosyah' },
          { jabatan: "Sie Ujian & Verifikasi Sertifikasi Qur'an", no_urut: 4, nama_custom: 'Ust. M. Syukron, M.Ag', keterangan: 'Standarisasi Tajwid & Ghorib' },
          { jabatan: 'Wali Asrama Khusus Tahfidz Putri', no_urut: 5, nama_custom: 'Usth. Siti Khodijah, Al-Hafidzah', keterangan: 'Disiplin Waktu & Setoran Harian' },
          { jabatan: 'Pengajar / Asatidz PMQ', no_urut: 6, nama_custom: 'Dewan Asatidz PMQ', keterangan: 'Tenaga Pengajar Al-Quran' }
        ]
      },
      // PONDOK PUTRA
      {
        tipe: 'pondok_putra',
        positions: [
          { jabatan: 'Pengasuh Utama Pondok Pesantren', no_urut: 1, nama_custom: 'K.H. Musthofa Bisri', keterangan: 'Arah Kebijakan Umum & Tarbiyah' },
          { jabatan: 'Lurah Pondok Putra (Ketua Umum Santri)', no_urut: 2, nama_custom: 'Ust. Rifqi Maulana, S.Ag', keterangan: 'Koordinator Seluruh Komplek Asrama Putra' },
          { jabatan: 'Kepala Keamanan & Ketertiban Putra', no_urut: 3, nama_custom: 'Ust. Hasan Basri', keterangan: 'Izin Keluar, Jam Malam & Disiplin' },
          { jabatan: 'Ketua Biro Ubudiyah & Kemasjidan Putra', no_urut: 4, nama_custom: 'Ust. Sholeh Mahmud', keterangan: 'Imam Rawatib, Dzibaiyah, & Rotib' },
          { jabatan: "Biro Kebersihan Lingkungan & Ro'an", no_urut: 5, nama_custom: 'Ust. Danial Ahmad', keterangan: 'Sanitasi & Kebersihan Komplek' },
          { jabatan: 'Pengurus Komplek Asrama Putra', no_urut: 6, nama_custom: 'Jajaran Pengurus Asrama', keterangan: 'Pengurus Harian Asrama Putra' }
        ]
      },
      // PONDOK PUTRI
      {
        tipe: 'pondok_putri',
        positions: [
          { jabatan: 'Pengasuh Pondok Putri', no_urut: 1, nama_custom: 'Ibu Nyai Hj. Maimunah', keterangan: 'Pembina Utama Santri Putri' },
          { jabatan: 'Lurah Pondok Putri', no_urut: 2, nama_custom: 'Usth. Nur Hidayati, S.Pd', keterangan: 'Koordinator Komplek Asrama Putri' },
          { jabatan: 'Sie Keamanan & Ketertiban Putri', no_urut: 3, nama_custom: 'Usth. Siti Maryam', keterangan: 'Disiplin & Izin Santri Putri' },
          { jabatan: 'Sie Ubudiyah & Ibadah Putri', no_urut: 4, nama_custom: 'Usth. Fathimah Azzahra', keterangan: 'Sholat Berjamaah & Wirid' },
          { jabatan: 'Sie Kebersihan & Kerapian Putri', no_urut: 5, nama_custom: 'Usth. Aminah', keterangan: 'Kesehatan & Sanitasi Komplek' },
          { jabatan: 'Pengurus Asrama Putri', no_urut: 6, nama_custom: 'Jajaran Pengurus Putri', keterangan: 'Pengurus Harian Komplek Putri' }
        ]
      },
      // PANITIA SAMBANGAN
      {
        tipe: 'panitia_sambangan',
        positions: [
          { jabatan: 'Ketua Panitia Sambangan Santri', no_urut: 1, nama_custom: 'Ust. Nurul Huda, S.Pd.I', keterangan: 'Koordinasi Alur Kunjungan Wali Santri' },
          { jabatan: 'Koordinator Registrasi & Tamu Digital', no_urut: 2, nama_custom: 'Ust. Ahmad Wildan', keterangan: 'Scan Kartu Santri & Kartu Kunjungan' },
          { jabatan: 'Koordinator Keamanan & Rekayasa Parkir', no_urut: 3, nama_custom: 'Ust. Hasan Basri & Tim Banser', keterangan: 'Ketertiban Jalur Masuk/Keluar Gerbang' },
          { jabatan: 'Koordinator Stan Bazar & Konsumsi Tamu', no_urut: 4, nama_custom: 'Ust. Farhan Azis & Koperasi', keterangan: 'Pengaturan Stan UMKM & Kuliner Tamu' },
          { jabatan: 'Anggota Panitia Sambangan', no_urut: 5, nama_custom: 'Tim Panitia Sambangan', keterangan: 'Pelaksana Lapangan' }
        ]
      },
      // PANITIA HAFLAH
      {
        tipe: 'panitia_haflah',
        positions: [
          { jabatan: 'Ketua Panitia Haflah Akhirussanah', no_urut: 1, nama_custom: 'K.H. Ahmad Dahlan, Lc', keterangan: 'Penanggung Jawab Acara Akbar Haflah' },
          { jabatan: 'Sie Acara & Protokoler Wisuda Santri', no_urut: 2, nama_custom: 'Ust. M. Syukron, M.Ag', keterangan: 'Rundown, Penobatan Santri & Mauidhoh' },
          { jabatan: 'Sie Panggung, Dekorasi & Multimedia', no_urut: 3, nama_custom: 'Ust. Rifqi Maulana', keterangan: 'Videotron, Tata Suara & Lighting' },
          { jabatan: 'Sie Publikasi & Live Streaming Official', no_urut: 4, nama_custom: 'Tim Media Santri Al-Hamid', keterangan: 'YouTube Live, Dokumentasi & Siaran' },
          { jabatan: 'Sie Tamu Undangan Masyayikh & Habaib', no_urut: 5, nama_custom: 'Ust. Sholeh Mahmud', keterangan: 'Penyambutan VIP & Akomodasi Kyai' },
          { jabatan: 'Sie Konsumsi Haflah', no_urut: 6, nama_custom: 'Tim Dapur & Konsumsi', keterangan: 'Penyediaan Konsumsi Jamaah' },
          { jabatan: 'Anggota Panitia Haflah', no_urut: 7, nama_custom: 'Panitia Haflah', keterangan: 'Tim Lapangan' }
        ]
      },
      // PANITIA PSB
      {
        tipe: 'panitia_psb',
        positions: [
          { jabatan: 'Ketua Panitia Penerimaan Santri Baru (PSB)', no_urut: 1, nama_custom: 'Ust. Ahmad Syukron Rosyid', keterangan: 'Penanggung Jawab Penerimaan Santri Baru' },
          { jabatan: 'Sekretaris PSB & Verifikasi Berkas', no_urut: 2, nama_custom: 'Ust. Rijal Umami', keterangan: 'Administrasi & Verifikasi Dokumen Pendaftar' },
          { jabatan: 'Bendahara & Keuangan Pendaftaran', no_urut: 3, nama_custom: 'Ustz. Restu Maharani', keterangan: 'Pembayaran Formulir & Uang Pangkal' },
          { jabatan: 'Koordinator Tes Seleksi & Wawancara', no_urut: 4, nama_custom: 'Ust. Nurrohman', keterangan: 'Tes Baca Kitab, Quran & Wawancara Wali' },
          { jabatan: 'Tim Publikasi, Brosur & Media Sosial', no_urut: 5, nama_custom: 'Tim IT & Media Al-Hamid', keterangan: 'Informasi Pendaftaran Online & Brosur' },
          { jabatan: 'Anggota Panitia PSB', no_urut: 6, nama_custom: 'Tim Sekretariat PSB', keterangan: 'Pelaksana Teknis Pendaftaran' }
        ]
      }
    ];

    for (const group of defaultStructures) {
      if (!existingTypes.includes(group.tipe)) {
        for (const pos of group.positions) {
          await db.query(
            `INSERT INTO struktur_organisasi (tipe, jabatan, no_urut, nama_custom, keterangan, tahun_ajaran_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [group.tipe, pos.jabatan, pos.no_urut, pos.nama_custom, pos.keterangan, activeTaId]
          );
        }
        console.log(`Seeded structure: ${group.tipe}`);
      }
    }

    // Seed sample Kajian Balagh if empty
    const kajianCount = await db.query('SELECT count(*) FROM jadwal_kajian_balagh');
    if (parseInt(kajianCount.rows[0].count, 10) === 0) {
      const sampleKajian = [
        { kelas: 'Sifir', waktu: '14:00 - 14:45', qori: 'Ustz. Zayyina Bizuhrotinnima', kitab: 'Safinatus Sholah', tempat: '22 KELAS 5A', no_urut: 1 },
        { kelas: 'Sifir', waktu: '14:45 - 15:30', qori: 'Ust. Alfian Agus Pratama', kitab: 'Al-Khulashoh Juz 1', tempat: '22 KELAS 5A', no_urut: 2 },
        { kelas: '1 & Sp Putra', waktu: '08:30 - 09:30', qori: 'Ust. H. Rijal Umami', kitab: 'Taisirul Kholaq', tempat: 'Aula Putra Lt. 2', no_urut: 3 },
        { kelas: '1 & Sp Putra', waktu: '13:00 - 14:00', qori: 'Ust. Ahmad Syukron', kitab: 'Bidayatul Hidayah', tempat: 'Masjid Jami Lt. 1', no_urut: 4 },
        { kelas: '2 Putri', waktu: '09:00 - 10:00', qori: 'Usth. Siti Khodijah', kitab: 'Washoya Al-Abaa', tempat: 'Musholla Putri', no_urut: 5 },
      ];
      for (const k of sampleKajian) {
        await db.query(
          `INSERT INTO jadwal_kajian_balagh (tahun_ajaran_id, kelas, waktu, qori, kitab, tempat, no_urut)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [activeTaId, k.kelas, k.waktu, k.qori, k.kitab, k.tempat, k.no_urut]
        );
      }
      console.log('Seeded sample jadwal_kajian_balagh');
    }

    // Seed sample Imam Tarawih if empty
    const tarawihCount = await db.query('SELECT count(*) FROM jadwal_imam_tarawih');
    if (parseInt(tarawihCount.rows[0].count, 10) === 0) {
      const sampleTarawih = [
        { malam: 1, imam: 'K.H. Musthofa Bisri', bilal: 'Ust. Rifqi Maulana', tempat: 'Masjid Jami Al-Hamid', no_urut: 1 },
        { malam: 2, imam: 'K.H. Ahmad Dahlan, Lc', bilal: 'Ust. Sholeh Mahmud', tempat: 'Masjid Jami Al-Hamid', no_urut: 2 },
        { malam: 3, imam: 'Ust. H. Syarif Hidayatullah', bilal: 'Ust. Farhan Azis', tempat: 'Masjid Jami Al-Hamid', no_urut: 3 },
      ];
      for (const t of sampleTarawih) {
        await db.query(
          `INSERT INTO jadwal_imam_tarawih (tahun_ajaran_id, malam, imam, bilal, tempat, no_urut)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [activeTaId, t.malam, t.imam, t.bilal, t.tempat, t.no_urut]
        );
      }
      console.log('Seeded sample jadwal_imam_tarawih');
    }

    // Seed sample Materi Sidang if empty
    const sidangCount = await db.query('SELECT count(*) FROM materi_sidang');
    if (parseInt(sidangCount.rows[0].count, 10) === 0) {
      const sampleSidang = [
        {
          tahun_ajaran_id: activeTaId,
          tahun_masehi: activeTaKode,
          kategori: 'madin',
          judul: 'SK Hasil Sidang Pleno Kurikulum Diniyah Semester Gasal',
          no_surat: '012/SK-MD/AH/VIII/2025',
          tanggal: '2025-08-15',
          halaman: 18,
          ukuran: '2.4 MB',
          status: 'Disahkan & Resmi',
          pengesah: 'Kepala Madrasah & Majelis Masyayikh',
          ringkasan: 'Ketetapan beban jam mengajar kitab kuning, pembagian kelas santri baru, dan jadwal ujian evaluasi berkala.',
          file_url: null
        },
        {
          tahun_ajaran_id: activeTaId,
          tahun_masehi: activeTaKode,
          kategori: 'pondok',
          judul: 'Tata Tertib Kedisiplinan & Peraturan Pondok Pesantren',
          no_surat: '005/TTP/PP-AH/VII/2025',
          tanggal: '2025-07-20',
          halaman: 24,
          ukuran: '3.1 MB',
          status: 'Berlaku Penuh',
          pengesah: 'Pengasuh Utama Pesantren',
          ringkasan: 'Buku panduan santri mengenai etika asrama, perizinan pulang, larangan perangkat elektronik, dan sanksi pelanggaran.',
          file_url: null
        },
        {
          tahun_ajaran_id: activeTaId,
          tahun_masehi: activeTaKode,
          kategori: 'pmq',
          judul: 'Kurikulum Standarisasi Tahfidz & Tartil Yanbua PMQ',
          no_surat: '003/KUR-PMQ/IX/2025',
          tanggal: '2025-09-01',
          halaman: 12,
          ukuran: '1.8 MB',
          status: 'Resmi Disahkan',
          pengesah: 'Direktur PMQ & Tim Tashih',
          ringkasan: 'Alur kenaikan jilid Tartil, target setoran juziyyah tahfidz per semester, dan juknis munaqosyah akbar.',
          file_url: null
        },
        {
          tahun_ajaran_id: activeTaId,
          tahun_masehi: activeTaKode,
          kategori: 'haflah',
          judul: 'Naskah Panduan & Kepanitiaan Haflah Akhirussanah',
          no_surat: '001/PAN-HAFLAH/X/2025',
          tanggal: '2025-10-05',
          halaman: 32,
          ukuran: '4.5 MB',
          status: 'Draf Final Sidang',
          pengesah: 'Ketua Panitia Haflah & Pengasuh',
          ringkasan: 'Rincian anggaran, alur wisuda santri, susunan acara mauidhoh hasanah, dan skema penerimaan tamu VIP masyayikh.',
          file_url: null
        }
      ];
      for (const s of sampleSidang) {
        await db.query(
          `INSERT INTO materi_sidang (tahun_ajaran_id, tahun_masehi, kategori, judul, no_surat, tanggal, halaman, ukuran, status, pengesah, ringkasan, file_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [s.tahun_ajaran_id, s.tahun_masehi, s.kategori, s.judul, s.no_surat, s.tanggal, s.halaman, s.ukuran, s.status, s.pengesah, s.ringkasan, s.file_url]
        );
      }
      console.log('Seeded sample materi_sidang');
    }

    console.log('All migrations and seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
