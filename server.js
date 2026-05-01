const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function normalizeText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeKelasJenis(value) {
  const jenis = normalizeText(value);
  if (!jenis) {
    return null;
  }

  const lower = jenis.toLowerCase();
  if (lower === 'diniyah') {
    return 'Diniyah';
  }

  if (lower === 'sekolah') {
    return 'Sekolah';
  }

  return null;
}

function isUniqueViolation(error) {
  return error && error.code === '23505';
}

async function initDatabase() {
  const initPath = path.join(__dirname, 'sql', 'init.sql');
  if (!fs.existsSync(initPath)) {
    console.warn('Database init file not found:', initPath);
    return;
  }

  const sql = fs.readFileSync(initPath, 'utf8');
  await db.query(sql);
}

app.get('/api/summary', async (req, res) => {
  try {
    const santriCount = await db.query(`
      SELECT COUNT(*) FROM santri s
      WHERE NOT EXISTS (
        SELECT 1 FROM alumni a WHERE a.santri_id = s.id
      )
    `);
    const guruCount = await db.query('SELECT COUNT(*) FROM guru');
    res.json({
      santri: parseInt(santriCount.rows[0].count, 10),
      guru: parseInt(guruCount.rows[0].count, 10),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil ringkasan data.' });
  }
});

// ===== KELAS API =====
app.get('/api/kelas', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM kelas ORDER BY jenis, nama');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat data kelas.' });
  }
});

app.post('/api/kelas', async (req, res) => {
  const jenis = normalizeKelasJenis(req.body.jenis);
  const nama = normalizeText(req.body.nama);

  if (!jenis || !nama) {
    return res.status(400).json({ error: 'Jenis kelas dan nama kelas wajib diisi.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO kelas (jenis, nama) VALUES ($1, $2) RETURNING *',
      [jenis, nama]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({ error: `Kelas ${jenis} dengan nama tersebut sudah terdaftar.` });
    }
    res.status(500).json({ error: 'Gagal menyimpan data kelas.' });
  }
});

app.put('/api/kelas/:id', async (req, res) => {
  const { id } = req.params;
  const jenis = normalizeKelasJenis(req.body.jenis);
  const nama = normalizeText(req.body.nama);

  if (!jenis || !nama) {
    return res.status(400).json({ error: 'Jenis kelas dan nama kelas wajib diisi.' });
  }

  try {
    const result = await db.query(
      'UPDATE kelas SET jenis = $1, nama = $2 WHERE id = $3 RETURNING *',
      [jenis, nama, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data kelas tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({ error: `Kelas ${jenis} dengan nama tersebut sudah terdaftar.` });
    }
    res.status(500).json({ error: 'Gagal memperbarui data kelas.' });
  }
});

app.delete('/api/kelas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM kelas WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data kelas tidak ditemukan.' });
    }
    res.json({ message: 'Data kelas berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Kelas tidak dapat dihapus karena sedang digunakan oleh santri.' });
    }
    res.status(500).json({ error: 'Gagal menghapus data kelas.' });
  }
});

// ===== ORANGTUA API =====
app.post('/api/orangtua', async (req, res) => {
  const {
    nama_ayah,
    nama_ibu,
    pekerjaan_ayah,
    pekerjaan_ibu,
    no_hp_ayah,
    no_hp_ibu,
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menyimpan data orang tua.' });
  }
});

// ===== MATA PELAJARAN API =====
app.get('/api/mata-pelajaran', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM mata_pelajaran ORDER BY nama');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat data mata pelajaran.' });
  }
});

app.post('/api/mata-pelajaran', async (req, res) => {
  const nama = normalizeText(req.body.nama);

  if (!nama) {
    return res.status(400).json({ error: 'Nama mata pelajaran wajib diisi.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO mata_pelajaran (nama) VALUES ($1) RETURNING *',
      [nama]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({ error: 'Mata pelajaran sudah terdaftar.' });
    }
    res.status(500).json({ error: 'Gagal menyimpan data mata pelajaran.' });
  }
});

app.put('/api/mata-pelajaran/:id', async (req, res) => {
  const { id } = req.params;
  const nama = normalizeText(req.body.nama);

  if (!nama) {
    return res.status(400).json({ error: 'Nama mata pelajaran wajib diisi.' });
  }

  try {
    const result = await db.query(
      'UPDATE mata_pelajaran SET nama = $1 WHERE id = $2 RETURNING *',
      [nama, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data mata pelajaran tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({ error: 'Mata pelajaran sudah terdaftar.' });
    }
    res.status(500).json({ error: 'Gagal memperbarui data mata pelajaran.' });
  }
});

app.delete('/api/mata-pelajaran/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM mata_pelajaran WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data mata pelajaran tidak ditemukan.' });
    }
    res.json({ message: 'Data mata pelajaran berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Mata pelajaran tidak dapat dihapus karena sedang digunakan oleh data guru.' });
    }
    res.status(500).json({ error: 'Gagal menghapus data mata pelajaran.' });
  }
});

// ===== JABATAN API =====
app.get('/api/jabatan', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM jabatan ORDER BY nama');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat data jabatan.' });
  }
});

app.post('/api/jabatan', async (req, res) => {
  const nama = normalizeText(req.body.nama);

  if (!nama) {
    return res.status(400).json({ error: 'Nama jabatan wajib diisi.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO jabatan (nama) VALUES ($1) RETURNING *',
      [nama]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({ error: 'Jabatan sudah terdaftar.' });
    }
    res.status(500).json({ error: 'Gagal menyimpan data jabatan.' });
  }
});

app.put('/api/jabatan/:id', async (req, res) => {
  const { id } = req.params;
  const nama = normalizeText(req.body.nama);

  if (!nama) {
    return res.status(400).json({ error: 'Nama jabatan wajib diisi.' });
  }

  try {
    const result = await db.query(
      'UPDATE jabatan SET nama = $1 WHERE id = $2 RETURNING *',
      [nama, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data jabatan tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({ error: 'Jabatan sudah terdaftar.' });
    }
    res.status(500).json({ error: 'Gagal memperbarui data jabatan.' });
  }
});

app.delete('/api/jabatan/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM jabatan WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data jabatan tidak ditemukan.' });
    }
    res.json({ message: 'Data jabatan berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Jabatan tidak dapat dihapus karena sedang digunakan oleh data guru.' });
    }
    res.status(500).json({ error: 'Gagal menghapus data jabatan.' });
  }
});

// ===== SANTRI API =====
app.get('/api/santri', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.*,
        kd.nama AS nama_diniyah,
        ks.nama AS nama_sekolah,
        k.nama AS nama_kamar,
        k.gedung AS kamar_gedung,
        k.lantai AS kamar_lantai,
        o.nama_ayah,
        o.nama_ibu,
        o.pekerjaan_ayah,
        o.pekerjaan_ibu,
        o.no_hp_ayah,
        o.no_hp_ibu
      FROM santri s
      LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
      LEFT JOIN kelas ks ON s.kelas_sekolah_id = ks.id
      LEFT JOIN kamar k ON s.kamar_id = k.id
      LEFT JOIN orangtua o ON s.orangtua_id = o.id
      WHERE NOT EXISTS (
        SELECT 1 FROM alumni a WHERE a.santri_id = s.id
      )
      ORDER BY s.nama
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat data santri.' });
  }
});

app.post('/api/santri', async (req, res) => {
  const {
    nis,
    nik,
    nama,
    jenis_kelamin,
    kelas_diniyah_id,
    kelas_sekolah_id,
    kamar_id,
    tempat_lahir,
    tanggal_lahir,
    alamat,
    nama_ayah,
    nama_ibu,
    pekerjaan_ayah,
    pekerjaan_ibu,
    no_hp_ayah,
    no_hp_ibu,
  } = req.body;

  if (!nis || !nama) {
    return res.status(400).json({ error: 'NIS dan nama santri wajib diisi.' });
  }

  try {
    let orangtuaId = null;
    if (nama_ayah || nama_ibu) {
      const orangtuaResult = await db.query(
        `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, no_hp_ayah || null, no_hp_ibu || null]
      );
      orangtuaId = orangtuaResult.rows[0].id;
    }

    const result = await db.query(
      `INSERT INTO santri (nis, nik, nama, jenis_kelamin, kelas_diniyah_id, kelas_sekolah_id, kamar_id, tempat_lahir, tanggal_lahir, alamat, orangtua_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [nis, nik || null, nama, jenis_kelamin || null, kelas_diniyah_id || null, kelas_sekolah_id || null, kamar_id || null, tempat_lahir || null, tanggal_lahir || null, alamat || null, orangtuaId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menyimpan data santri.' });
  }
});

app.put('/api/santri/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nis,
    nik,
    nama,
    jenis_kelamin,
    kelas_diniyah_id,
    kelas_sekolah_id,
    kamar_id,
    tempat_lahir,
    tanggal_lahir,
    alamat,
    nama_ayah,
    nama_ibu,
    pekerjaan_ayah,
    pekerjaan_ibu,
    no_hp_ayah,
    no_hp_ibu,
  } = req.body;

  if (!nis || !nama) {
    return res.status(400).json({ error: 'NIS dan nama santri wajib diisi.' });
  }

  try {
    const existing = await db.query('SELECT orangtua_id FROM santri WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Santri tidak ditemukan.' });
    }

    let orangtuaId = existing.rows[0].orangtua_id;
    if (orangtuaId) {
      await db.query(
        `UPDATE orangtua SET nama_ayah = $1, nama_ibu = $2, pekerjaan_ayah = $3, pekerjaan_ibu = $4, no_hp_ayah = $5, no_hp_ibu = $6
         WHERE id = $7`,
        [nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, no_hp_ayah || null, no_hp_ibu || null, orangtuaId]
      );
    } else if (nama_ayah || nama_ibu || pekerjaan_ayah || pekerjaan_ibu || no_hp_ayah || no_hp_ibu) {
      const orangtuaResult = await db.query(
        `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [nama_ayah || null, nama_ibu || null, pekerjaan_ayah || null, pekerjaan_ibu || null, no_hp_ayah || null, no_hp_ibu || null]
      );
      orangtuaId = orangtuaResult.rows[0].id;
    }

    const result = await db.query(
      `UPDATE santri SET nis = $1, nik = $2, nama = $3, jenis_kelamin = $4, kelas_diniyah_id = $5, kelas_sekolah_id = $6,
         kamar_id = $7, tempat_lahir = $8, tanggal_lahir = $9, alamat = $10, orangtua_id = $11
       WHERE id = $12 RETURNING *`,
      [nis, nik || null, nama, jenis_kelamin || null, kelas_diniyah_id || null, kelas_sekolah_id || null, kamar_id || null, tempat_lahir || null, tanggal_lahir || null, alamat || null, orangtuaId, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memperbarui data santri.' });
  }
});

app.delete('/api/santri/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await db.query('SELECT orangtua_id FROM santri WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Santri tidak ditemukan.' });
    }

    const orangtuaId = existing.rows[0].orangtua_id;
    await db.query('DELETE FROM santri WHERE id = $1', [id]);
    if (orangtuaId) {
      await db.query('DELETE FROM orangtua WHERE id = $1', [orangtuaId]);
    }

    res.json({ message: 'Data santri berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghapus data santri.' });
  }
});

// ===== GURU API =====
app.get('/api/guru', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        g.id,
        g.nip,
        g.nama,
        g.mata_pelajaran_id,
        mp.nama AS mata_pelajaran,
        g.jabatan_id,
        j.nama AS jabatan,
        g.no_hp,
        g.alamat,
        g.status,
        g.created_at
      FROM guru g
      LEFT JOIN mata_pelajaran mp ON g.mata_pelajaran_id = mp.id
      LEFT JOIN jabatan j ON g.jabatan_id = j.id
      ORDER BY g.nama
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat data guru.' });
  }
});

app.post('/api/guru', async (req, res) => {
  const nip = normalizeText(req.body.nip);
  const nama = normalizeText(req.body.nama);
  const mata_pelajaran_id = req.body.mata_pelajaran_id ? Number(req.body.mata_pelajaran_id) : null;
  const jabatan_id = req.body.jabatan_id ? Number(req.body.jabatan_id) : null;
  const no_hp = normalizeText(req.body.no_hp);
  const alamat = normalizeText(req.body.alamat);
  const status = normalizeText(req.body.status);

  if (!nama || !mata_pelajaran_id || !jabatan_id || !no_hp || !alamat || !status) {
    return res.status(400).json({
      error: 'Nama, mata pelajaran, jabatan, no HP, alamat, dan status wajib diisi.',
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO guru (nip, nama, mata_pelajaran_id, jabatan_id, alamat, no_hp, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nip, nama, mata_pelajaran_id, jabatan_id, alamat, no_hp, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({
        error: nip ? 'NIP sudah terdaftar.' : 'Data guru sudah terdaftar.',
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Mata pelajaran atau jabatan yang dipilih tidak valid.',
      });
    }
    res.status(500).json({ error: 'Gagal menyimpan data guru.' });
  }
});

app.put('/api/guru/:id', async (req, res) => {
  const { id } = req.params;
  const nip = normalizeText(req.body.nip);
  const nama = normalizeText(req.body.nama);
  const mata_pelajaran_id = req.body.mata_pelajaran_id ? Number(req.body.mata_pelajaran_id) : null;
  const jabatan_id = req.body.jabatan_id ? Number(req.body.jabatan_id) : null;
  const no_hp = normalizeText(req.body.no_hp);
  const alamat = normalizeText(req.body.alamat);
  const status = normalizeText(req.body.status);

  if (!nama || !mata_pelajaran_id || !jabatan_id || !no_hp || !alamat || !status) {
    return res.status(400).json({
      error: 'Nama, mata pelajaran, jabatan, no HP, alamat, dan status wajib diisi.',
    });
  }

  try {
    const result = await db.query(
      `UPDATE guru
       SET nip = $1, nama = $2, mata_pelajaran_id = $3, jabatan_id = $4, alamat = $5, no_hp = $6, status = $7
       WHERE id = $8
       RETURNING *`,
      [nip, nama, mata_pelajaran_id, jabatan_id, alamat, no_hp, status, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data guru tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({
        error: nip ? 'NIP sudah terdaftar.' : 'Data guru sudah terdaftar.',
      });
    }
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Mata pelajaran atau jabatan yang dipilih tidak valid.',
      });
    }
    res.status(500).json({ error: 'Gagal memperbarui data guru.' });
  }
});

app.delete('/api/guru/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM guru WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data guru tidak ditemukan.' });
    }
    res.json({ message: 'Data guru berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghapus data guru.' });
  }
});

// ===== KAMAR API =====
app.get('/api/kamar', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM kamar ORDER BY nama');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat data kamar.' });
  }
});

app.post('/api/kamar', async (req, res) => {
  const nama = normalizeText(req.body.nama);
  const gedung = normalizeText(req.body.gedung);
  const lantai = req.body.lantai ? parseInt(req.body.lantai, 10) : null;
  const kapasitas = req.body.kapasitas ? parseInt(req.body.kapasitas, 10) : null;
  const terisi = req.body.terisi ? parseInt(req.body.terisi, 10) : 0;
  const jenis = normalizeText(req.body.jenis);
  const status = normalizeText(req.body.status) || 'Tersedia';
  const fasilitas = normalizeText(req.body.fasilitas);
  const keterangan = normalizeText(req.body.keterangan);

  if (!nama || !kapasitas || !jenis) {
    return res.status(400).json({ error: 'Nama kamar, kapasitas, dan jenis wajib diisi.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO kamar (nama, gedung, lantai, kapasitas, terisi, jenis, status, fasilitas, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nama, gedung, lantai, kapasitas, terisi, jenis, status, fasilitas, keterangan]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({ error: 'Nama kamar sudah terdaftar.' });
    }
    res.status(500).json({ error: 'Gagal menyimpan data kamar.' });
  }
});

app.put('/api/kamar/:id', async (req, res) => {
  const { id } = req.params;
  const nama = normalizeText(req.body.nama);
  const gedung = normalizeText(req.body.gedung);
  const lantai = req.body.lantai ? parseInt(req.body.lantai, 10) : null;
  const kapasitas = req.body.kapasitas ? parseInt(req.body.kapasitas, 10) : null;
  const terisi = req.body.terisi ? parseInt(req.body.terisi, 10) : 0;
  const jenis = normalizeText(req.body.jenis);
  const status = normalizeText(req.body.status) || 'Tersedia';
  const fasilitas = normalizeText(req.body.fasilitas);
  const keterangan = normalizeText(req.body.keterangan);

  if (!nama || !kapasitas || !jenis) {
    return res.status(400).json({ error: 'Nama kamar, kapasitas, dan jenis wajib diisi.' });
  }

  try {
    const result = await db.query(
      `UPDATE kamar 
       SET nama = $1, gedung = $2, lantai = $3, kapasitas = $4, terisi = $5, 
           jenis = $6, status = $7, fasilitas = $8, keterangan = $9
       WHERE id = $10
       RETURNING *`,
      [nama, gedung, lantai, kapasitas, terisi, jenis, status, fasilitas, keterangan, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data kamar tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (isUniqueViolation(error)) {
      return res.status(400).json({ error: 'Nama kamar sudah terdaftar.' });
    }
    res.status(500).json({ error: 'Gagal memperbarui data kamar.' });
  }
});

app.delete('/api/kamar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM kamar WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data kamar tidak ditemukan.' });
    }
    res.json({ message: 'Data kamar berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Kamar tidak dapat dihapus karena sedang digunakan oleh santri.' });
    }
    res.status(500).json({ error: 'Gagal menghapus data kamar.' });
  }
});

// ===== PELANGGARAN API =====
app.get('/api/pelanggaran', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, s.nis, s.nama AS nama_santri
      FROM pelanggaran p
      LEFT JOIN santri s ON p.santri_id = s.id
      ORDER BY p.tanggal DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat data pelanggaran.' });
  }
});

app.post('/api/pelanggaran', async (req, res) => {
  const santri_id = req.body.santri_id ? parseInt(req.body.santri_id, 10) : null;
  const jenis = normalizeText(req.body.jenis);
  const tanggal = req.body.tanggal || null;
  const deskripsi = normalizeText(req.body.deskripsi);
  const sanksi = normalizeText(req.body.sanksi);

  if (!santri_id || !jenis || !tanggal) {
    return res.status(400).json({ error: 'Santri, jenis, dan tanggal wajib diisi.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO pelanggaran (santri_id, jenis, tanggal, deskripsi, sanksi)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [santri_id, jenis, tanggal, deskripsi, sanksi]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Santri yang dipilih tidak valid.' });
    }
    res.status(500).json({ error: 'Gagal menyimpan data pelanggaran.' });
  }
});

app.put('/api/pelanggaran/:id', async (req, res) => {
  const { id } = req.params;
  const santri_id = req.body.santri_id ? parseInt(req.body.santri_id, 10) : null;
  const jenis = normalizeText(req.body.jenis);
  const tanggal = req.body.tanggal || null;
  const deskripsi = normalizeText(req.body.deskripsi);
  const sanksi = normalizeText(req.body.sanksi);

  if (!santri_id || !jenis || !tanggal) {
    return res.status(400).json({ error: 'Santri, jenis, dan tanggal wajib diisi.' });
  }

  try {
    const result = await db.query(
      `UPDATE pelanggaran 
       SET santri_id = $1, jenis = $2, tanggal = $3, deskripsi = $4, sanksi = $5
       WHERE id = $6
       RETURNING *`,
      [santri_id, jenis, tanggal, deskripsi, sanksi, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data pelanggaran tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Santri yang dipilih tidak valid.' });
    }
    res.status(500).json({ error: 'Gagal memperbarui data pelanggaran.' });
  }
});

app.delete('/api/pelanggaran/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM pelanggaran WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data pelanggaran tidak ditemukan.' });
    }
    res.json({ message: 'Data pelanggaran berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghapus data pelanggaran.' });
  }
});

// ===== PRESTASI API =====
app.get('/api/prestasi', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, s.nis, s.nama AS nama_santri
      FROM prestasi p
      LEFT JOIN santri s ON p.santri_id = s.id
      ORDER BY p.tanggal DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat data prestasi.' });
  }
});

app.post('/api/prestasi', async (req, res) => {
  const santri_id = req.body.santri_id ? parseInt(req.body.santri_id, 10) : null;
  const jenis = normalizeText(req.body.jenis);
  const tanggal = req.body.tanggal || null;
  const deskripsi = normalizeText(req.body.deskripsi);
  const penghargaan = normalizeText(req.body.penghargaan);

  if (!santri_id || !jenis || !tanggal) {
    return res.status(400).json({ error: 'Santri, jenis, dan tanggal wajib diisi.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO prestasi (santri_id, jenis, tanggal, deskripsi, penghargaan)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [santri_id, jenis, tanggal, deskripsi, penghargaan]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Santri yang dipilih tidak valid.' });
    }
    res.status(500).json({ error: 'Gagal menyimpan data prestasi.' });
  }
});

app.put('/api/prestasi/:id', async (req, res) => {
  const { id } = req.params;
  const santri_id = req.body.santri_id ? parseInt(req.body.santri_id, 10) : null;
  const jenis = normalizeText(req.body.jenis);
  const tanggal = req.body.tanggal || null;
  const deskripsi = normalizeText(req.body.deskripsi);
  const penghargaan = normalizeText(req.body.penghargaan);

  if (!santri_id || !jenis || !tanggal) {
    return res.status(400).json({ error: 'Santri, jenis, dan tanggal wajib diisi.' });
  }

  try {
    const result = await db.query(
      `UPDATE prestasi 
       SET santri_id = $1, jenis = $2, tanggal = $3, deskripsi = $4, penghargaan = $5
       WHERE id = $6
       RETURNING *`,
      [santri_id, jenis, tanggal, deskripsi, penghargaan, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data prestasi tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Santri yang dipilih tidak valid.' });
    }
    res.status(500).json({ error: 'Gagal memperbarui data prestasi.' });
  }
});

app.delete('/api/prestasi/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM prestasi WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data prestasi tidak ditemukan.' });
    }
    res.json({ message: 'Data prestasi berhasil dihapus.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghapus data prestasi.' });
  }
});

// ===== ALUMNI API =====
app.get('/api/alumni/search', async (req, res) => {
  const { q, tahun } = req.query;
  try {
    let query = 'SELECT * FROM alumni WHERE 1=1';
    const params = [];
    
    if (q) {
      params.push(`%${q}%`);
      query += ` AND (nama ILIKE $${params.length} OR nis ILIKE $${params.length})`;
    }
    
    if (tahun) {
      params.push(parseInt(tahun, 10));
      query += ` AND tahun_lulus = $${params.length}`;
    }
    
    query += ' ORDER BY tahun_lulus DESC, nama';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mencari data alumni.' });
  }
});

app.get('/api/alumni', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM alumni
      ORDER BY tahun_lulus DESC, nama
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat data alumni.' });
  }
});

app.post('/api/alumni', async (req, res) => {
  const nis = normalizeText(req.body.nis);
  const nik = normalizeText(req.body.nik);
  const nama = normalizeText(req.body.nama);
  const tempat_lahir = normalizeText(req.body.tempat_lahir);
  const tanggal_lahir = req.body.tanggal_lahir || null;
  const tahun_masuk = req.body.tahun_masuk ? parseInt(req.body.tahun_masuk, 10) : null;
  const tahun_lulus = req.body.tahun_lulus ? parseInt(req.body.tahun_lulus, 10) : null;
  const kelas_terakhir = normalizeText(req.body.kelas_terakhir);
  const alamat = normalizeText(req.body.alamat);
  const no_hp = normalizeText(req.body.no_hp);
  const email = normalizeText(req.body.email);
  const pekerjaan = normalizeText(req.body.pekerjaan);
  const status_pernikahan = normalizeText(req.body.status_pernikahan);
  const alamat_sekarang = normalizeText(req.body.alamat_sekarang);
  const instansi = normalizeText(req.body.instansi);
  const prestasi_utama = normalizeText(req.body.prestasi_utama);
  const keterangan = normalizeText(req.body.keterangan);

  if (!nis || !nama || !tahun_lulus) {
    return res.status(400).json({ error: 'NIS, nama, dan tahun lulus wajib diisi.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO alumni (nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus, 
       kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus, 
       kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menyimpan data alumni.' });
  }
});

app.put('/api/alumni/:id', async (req, res) => {
  const { id } = req.params;
  const nis = normalizeText(req.body.nis);
  const nik = normalizeText(req.body.nik);
  const nama = normalizeText(req.body.nama);
  const tempat_lahir = normalizeText(req.body.tempat_lahir);
  const tanggal_lahir = req.body.tanggal_lahir || null;
  const tahun_masuk = req.body.tahun_masuk ? parseInt(req.body.tahun_masuk, 10) : null;
  const tahun_lulus = req.body.tahun_lulus ? parseInt(req.body.tahun_lulus, 10) : null;
  const kelas_terakhir = normalizeText(req.body.kelas_terakhir);
  const alamat = normalizeText(req.body.alamat);
  const no_hp = normalizeText(req.body.no_hp);
  const email = normalizeText(req.body.email);
  const pekerjaan = normalizeText(req.body.pekerjaan);
  const status_pernikahan = normalizeText(req.body.status_pernikahan);
  const alamat_sekarang = normalizeText(req.body.alamat_sekarang);
  const instansi = normalizeText(req.body.instansi);
  const prestasi_utama = normalizeText(req.body.prestasi_utama);
  const keterangan = normalizeText(req.body.keterangan);

  if (!nis || !nama || !tahun_lulus) {
    return res.status(400).json({ error: 'NIS, nama, dan tahun lulus wajib diisi.' });
  }

  try {
    const result = await db.query(
      `UPDATE alumni 
       SET nis = $1, nik = $2, nama = $3, tempat_lahir = $4, tanggal_lahir = $5, 
           tahun_masuk = $6, tahun_lulus = $7, kelas_terakhir = $8, alamat = $9, 
           no_hp = $10, email = $11, pekerjaan = $12, status_pernikahan = $13,
           alamat_sekarang = $14, instansi = $15, prestasi_utama = $16, keterangan = $17
       WHERE id = $18
       RETURNING *`,
      [nis, nik, nama, tempat_lahir, tanggal_lahir, tahun_masuk, tahun_lulus, 
       kelas_terakhir, alamat, no_hp, email, pekerjaan, status_pernikahan, alamat_sekarang, instansi, prestasi_utama, keterangan, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data alumni tidak ditemukan.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memperbarui data alumni.' });
  }
});

app.delete('/api/alumni/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM alumni WHERE id = $1 RETURNING id, santri_id', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Data alumni tidak ditemukan.' });
    }
    res.json({
      message: result.rows[0].santri_id
        ? 'Data alumni berhasil dihapus. Data santri kembali aktif.'
        : 'Data alumni berhasil dihapus.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghapus data alumni.' });
  }
});

// GET /api/santri/active - Ambil santri aktif untuk dropdown migrasi
app.get('/api/santri/active', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.id, s.nis, s.nik, s.nama, s.tempat_lahir, s.tanggal_lahir, s.alamat,
             o.nama_ayah, o.nama_ibu, o.no_hp_ayah, o.no_hp_ibu,
             kd.nama AS kelas_diniyah, ks.nama AS kelas_sekolah,
             k.nama AS kamar, k.gedung, k.lantai
      FROM santri s
      LEFT JOIN orangtua o ON s.orangtua_id = o.id
      LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
      LEFT JOIN kelas ks ON s.kelas_sekolah_id = ks.id
      LEFT JOIN kamar k ON s.kamar_id = k.id
      WHERE s.id NOT IN (SELECT santri_id FROM alumni WHERE santri_id IS NOT NULL)
      ORDER BY s.nama
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat data santri.' });
  }
});

// POST /api/alumni/migrate - Migrasi santri ke alumni
app.post('/api/alumni/migrate', async (req, res) => {
  const { santri_id, tahun_lulus, keterangan } = req.body;
  
  if (!santri_id || !tahun_lulus) {
    return res.status(400).json({ error: 'Santri dan tahun lulus wajib diisi.' });
  }

  try {
    const existingAlumni = await db.query('SELECT id FROM alumni WHERE santri_id = $1', [santri_id]);
    if (existingAlumni.rows.length) {
      return res.status(400).json({ error: 'Santri ini sudah masuk data alumni.' });
    }

    // Ambil data santri lengkap
    const santriResult = await db.query(`
      SELECT s.*, o.*, 
             kd.nama AS kelas_diniyah, ks.nama AS kelas_sekolah,
             k.nama AS kamar
      FROM santri s
      LEFT JOIN orangtua o ON s.orangtua_id = o.id
      LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
      LEFT JOIN kelas ks ON s.kelas_sekolah_id = ks.id
      LEFT JOIN kamar k ON s.kamar_id = k.id
      WHERE s.id = $1
    `, [santri_id]);

    if (!santriResult.rows.length) {
      return res.status(404).json({ error: 'Santri tidak ditemukan.' });
    }

    const santri = santriResult.rows[0];

    // Hitung tahun masuk (estimasi: lulus - 6 tahun)
    const tahunMasuk = tahun_lulus - 6;

    // Buat kelas terakhir
    const kelasArray = [];
    if (santri.kelas_diniyah) kelasArray.push(santri.kelas_diniyah);
    if (santri.kelas_sekolah) kelasArray.push(santri.kelas_sekolah);
    const kelasTerakir = kelasArray.join(' / ') || null;

    // Simpan history kelas sebelum migrasi
    if (santri.kelas_diniyah_id || santri.kelas_sekolah_id) {
      await db.query(`
        INSERT INTO santri_kelas_history (santri_id, kelas_diniyah_id, kelas_sekolah_id, tanggal_mulai, tanggal_selesai, keterangan)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [santri_id, santri.kelas_diniyah_id, santri.kelas_sekolah_id, 
          new Date(tahunMasuk, 0, 1), new Date(tahun_lulus, 11, 31), 'Migrasi ke alumni']);
    }

    // Simpan history kamar sebelum migrasi
    if (santri.kamar_id) {
      await db.query(`
        INSERT INTO santri_kamar_history (santri_id, kamar_id, tanggal_mulai, tanggal_selesai, keterangan)
        VALUES ($1, $2, $3, $4, $5)
      `, [santri_id, santri.kamar_id, 
          new Date(tahunMasuk, 0, 1), new Date(tahun_lulus, 11, 31), 'Migrasi ke alumni']);
    }

    // Insert ke alumni
    const alumniResult = await db.query(`
      INSERT INTO alumni (
        santri_id, nis, nik, nama, tempat_lahir, tanggal_lahir,
        tahun_masuk, tahun_lulus, kelas_terakhir, alamat, keterangan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      santri_id, santri.nis, santri.nik, santri.nama,
      santri.tempat_lahir, santri.tanggal_lahir,
      tahunMasuk, tahun_lulus, kelasTerakir, santri.alamat,
      keterangan
    ]);

    res.status(201).json({
      message: 'Santri berhasil dimigrasi ke alumni',
      alumni: alumniResult.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal migrasi santri ke alumni.' });
  }
});

// GET /api/alumni/:id/detail - Detail alumni dengan riwayat
app.get('/api/alumni/:id/detail', async (req, res) => {
  const { id } = req.params;
  
  try {
    const alumni = await db.query('SELECT * FROM alumni WHERE id = $1', [id]);
    
    if (!alumni.rows.length) {
      return res.status(404).json({ error: 'Alumni tidak ditemukan.' });
    }
    
    const alumniData = alumni.rows[0];
    const santriId = alumniData.santri_id;
    let identitasSantri = null;
    
    let riwayat = {
      kelas: [],
      kamar: [],
      prestasi: [],
      pelanggaran: []
    };
    
    if (santriId || alumniData.nis) {
      const santriParams = santriId ? [santriId] : [alumniData.nis];
      const santriDetail = await db.query(`
        SELECT s.*, 
               kd.nama AS kelas_diniyah,
               ks.nama AS kelas_sekolah,
               k.nama AS kamar, k.gedung, k.lantai,
               o.nama_ayah, o.nama_ibu, o.pekerjaan_ayah, o.pekerjaan_ibu,
               o.no_hp_ayah, o.no_hp_ibu
        FROM santri s
        LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
        LEFT JOIN kelas ks ON s.kelas_sekolah_id = ks.id
        LEFT JOIN kamar k ON s.kamar_id = k.id
        LEFT JOIN orangtua o ON s.orangtua_id = o.id
        WHERE ${santriId ? 's.id = $1' : 's.nis = $1'}
      `, santriParams);

      identitasSantri = santriDetail.rows[0] || null;

      const detailSantriId = santriId || (identitasSantri ? identitasSantri.id : null);
      if (!santriId && detailSantriId) {
        await db.query('UPDATE alumni SET santri_id = $1 WHERE id = $2', [detailSantriId, id]);
        alumniData.santri_id = detailSantriId;
      }

      // Riwayat kelas
      const kelasHistory = await db.query(`
        SELECT skh.*, 
               kd.nama AS kelas_diniyah, 
               ks.nama AS kelas_sekolah
        FROM santri_kelas_history skh
        LEFT JOIN kelas kd ON skh.kelas_diniyah_id = kd.id
        LEFT JOIN kelas ks ON skh.kelas_sekolah_id = ks.id
        WHERE skh.santri_id = $1
        ORDER BY skh.tanggal_mulai DESC
      `, [detailSantriId]);
      
      // Riwayat kamar
      const kamarHistory = await db.query(`
        SELECT skh.*, k.nama AS kamar, k.gedung, k.lantai
        FROM santri_kamar_history skh
        LEFT JOIN kamar k ON skh.kamar_id = k.id
        WHERE skh.santri_id = $1
        ORDER BY skh.tanggal_mulai DESC
      `, [detailSantriId]);
      
      // Prestasi
      const prestasi = await db.query(`
        SELECT * FROM prestasi 
        WHERE santri_id = $1 
        ORDER BY tanggal DESC
      `, [detailSantriId]);
      
      // Pelanggaran
      const pelanggaran = await db.query(`
        SELECT * FROM pelanggaran 
        WHERE santri_id = $1 
        ORDER BY tanggal DESC
      `, [detailSantriId]);
      
      riwayat = {
        kelas: kelasHistory.rows,
        kamar: kamarHistory.rows,
        prestasi: prestasi.rows,
        pelanggaran: pelanggaran.rows
      };
    }
    
    res.json({
      alumni: alumniData,
      identitas: identitasSantri,
      riwayat
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memuat detail alumni.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server berjalan di http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Gagal inisialisasi database:', error);
    process.exit(1);
  });
