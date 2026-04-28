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
    const santriCount = await db.query('SELECT COUNT(*) FROM santri');
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
        o.nama_ayah,
        o.nama_ibu,
        o.pekerjaan_ayah,
        o.pekerjaan_ibu,
        o.no_hp_ayah,
        o.no_hp_ibu
      FROM santri s
      LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
      LEFT JOIN kelas ks ON s.kelas_sekolah_id = ks.id
      LEFT JOIN orangtua o ON s.orangtua_id = o.id
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
    kelas_diniyah_id,
    kelas_sekolah_id,
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
      `INSERT INTO santri (nis, nik, nama, kelas_diniyah_id, kelas_sekolah_id, tempat_lahir, tanggal_lahir, alamat, orangtua_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nis, nik || null, nama, kelas_diniyah_id || null, kelas_sekolah_id || null, tempat_lahir || null, tanggal_lahir || null, alamat || null, orangtuaId]
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
    kelas_diniyah_id,
    kelas_sekolah_id,
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
      `UPDATE santri SET nis = $1, nik = $2, nama = $3, kelas_diniyah_id = $4, kelas_sekolah_id = $5,
         tempat_lahir = $6, tanggal_lahir = $7, alamat = $8, orangtua_id = $9
       WHERE id = $10 RETURNING *`,
      [nis, nik || null, nama, kelas_diniyah_id || null, kelas_sekolah_id || null, tempat_lahir || null, tanggal_lahir || null, alamat || null, orangtuaId, id]
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
