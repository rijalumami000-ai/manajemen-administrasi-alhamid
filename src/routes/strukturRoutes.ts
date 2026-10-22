import db from '../../db';

const VALID_TYPES = [
  'madrasah_diniyah', 'panitia_ujian',
  'pmq', 'pondok_putra', 'pondok_putri',
  'panitia_sambangan', 'panitia_haflah', 'panitia_psb',
  'dewan_penyantun', 'jamiyyah', 'pondok_pesantren', 'pondok'
];

function registerStrukturRoutes(app) {
  // ── Helper to build select fields ───────────────────────────────────────
  const SELECT_FIELDS = `
    s.id,
    s.tipe,
    s.kategori,
    s.jabatan,
    s.guru_id,
    s.santri_id,
    s.nama_custom,
    s.alamat,
    s.keterangan,
    s.no_urut,
    s.tahun_ajaran_id,
    s.semester,
    g.nama AS guru_nama,
    g.no_hp AS guru_no_hp,
    g.foto_url AS guru_foto_url,
    st.nama AS santri_nama,
    st.nis AS santri_nis,
    st.foto_url AS santri_foto_url,
    st.alamat AS santri_alamat,
    COALESCE(g.nama, st.nama, s.nama_custom) AS display_nama,
    COALESCE(g.foto_url, st.foto_url) AS display_foto_url,
    COALESCE(s.alamat, st.alamat) AS display_alamat
  `;

  // ── GET /api/struktur/santri/search (Buku Induk Search) ─────────────────
  app.get('/api/struktur/santri/search', async (req, res) => {
    try {
      const q = (req.query.q || '').trim();
      let query = `
        SELECT 
          s.id, s.nis, s.nama, s.jenis_kelamin, s.foto_url, s.alamat,
          kd.nama AS kelas_diniyah,
          km.nama AS kamar
        FROM santri s
        LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
        LEFT JOIN kamar km ON s.kamar_id = km.id
      `;
      const params = [];
      if (q) {
        query += ` WHERE s.nama ILIKE $1 OR s.nis ILIKE $1`;
        params.push(`%${q}%`);
      }
      query += ` ORDER BY s.nama ASC LIMIT 50`;
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error searching santri for struktur:', error);
      res.status(500).json({ error: 'Gagal mencari data santri.' });
    }
  });

  // ── GET /api/struktur/kategori/:tipe (List Sub-Tabs / Categories) ────────
  app.get('/api/struktur/kategori/:tipe', async (req, res) => {
    const { tipe } = req.params;
    try {
      // 1. Get from config table
      const configRes = await db.query(
        `SELECT id, tipe, nama_kategori, no_urut FROM struktur_kategori WHERE tipe = $1 ORDER BY no_urut ASC, id ASC`,
        [tipe]
      );
      
      // 2. Also check if any unconfigured categories exist in struktur_organisasi
      const existingRes = await db.query(
        `SELECT DISTINCT kategori FROM struktur_organisasi WHERE tipe = $1 AND kategori IS NOT NULL AND TRIM(kategori) != ''`,
        [tipe]
      );
      
      const configNames = new Set(configRes.rows.map(r => r.nama_kategori));
      const merged = [...configRes.rows];
      
      for (const row of existingRes.rows) {
        if (!configNames.has(row.kategori)) {
          merged.push({
            id: null,
            tipe,
            nama_kategori: row.kategori,
            no_urut: 99
          });
        }
      }
      
      res.json(merged);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Gagal memuat kategori.' });
    }
  });

  // ── POST /api/struktur/kategori (Create Category / Sub-tab) ──────────────
  app.post('/api/struktur/kategori', async (req, res) => {
    const { tipe, nama_kategori, no_urut } = req.body;
    if (!tipe || !nama_kategori || !nama_kategori.trim()) {
      return res.status(400).json({ error: 'Tipe dan nama kategori wajib diisi.' });
    }

    try {
      const trimmedName = nama_kategori.trim();
      const order = Number(no_urut) || 0;
      const result = await db.query(
        `INSERT INTO struktur_kategori (tipe, nama_kategori, no_urut)
         VALUES ($1, $2, $3)
         ON CONFLICT (tipe, nama_kategori) DO UPDATE SET no_urut = EXCLUDED.no_urut
         RETURNING *`,
        [tipe, trimmedName, order]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error adding category:', error);
      res.status(500).json({ error: 'Gagal menambahkan kategori.' });
    }
  });

  // ── PUT /api/struktur/kategori/:id (Rename / Update Category) ────────────
  app.put('/api/struktur/kategori/:id', async (req, res) => {
    const { id } = req.params;
    const { nama_kategori, no_urut } = req.body;

    if (!nama_kategori || !nama_kategori.trim()) {
      return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
    }

    try {
      // Find old category
      const oldCat = await db.query('SELECT * FROM struktur_kategori WHERE id = $1', [id]);
      if (!oldCat.rows.length) {
        return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
      }

      const oldName = oldCat.rows[0].nama_kategori;
      const tipe = oldCat.rows[0].tipe;
      const newName = nama_kategori.trim();
      const newOrder = no_urut !== undefined ? Number(no_urut) : oldCat.rows[0].no_urut;

      // Update config
      const updateRes = await db.query(
        `UPDATE struktur_kategori SET nama_kategori = $1, no_urut = $2 WHERE id = $3 RETURNING *`,
        [newName, newOrder, id]
      );

      // Cascade update to struktur_organisasi and struktur_jabatan
      if (oldName !== newName) {
        await db.query(
          `UPDATE struktur_organisasi SET kategori = $1 WHERE tipe = $2 AND kategori = $3`,
          [newName, tipe, oldName]
        );
        await db.query(
          `UPDATE struktur_jabatan SET kategori = $1 WHERE tipe = $2 AND kategori = $3`,
          [newName, tipe, oldName]
        );
      }

      res.json(updateRes.rows[0]);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Gagal memperbarui kategori.' });
    }
  });

  // ── DELETE /api/struktur/kategori/:id (Delete Category) ──────────────────
  app.delete('/api/struktur/kategori/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const catRes = await db.query('SELECT * FROM struktur_kategori WHERE id = $1', [id]);
      if (!catRes.rows.length) {
        return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
      }

      const { tipe, nama_kategori } = catRes.rows[0];

      // Check if personnel exist in this category
      const countRes = await db.query(
        `SELECT COUNT(*) FROM struktur_organisasi WHERE tipe = $1 AND kategori = $2`,
        [tipe, nama_kategori]
      );

      if (parseInt(countRes.rows[0].count, 10) > 0 && req.query.force !== 'true') {
        return res.status(400).json({
          error: `Kategori ini masih memiliki ${countRes.rows[0].count} personel. Hapus atau pindahkan personel terlebih dahulu.`,
          count: parseInt(countRes.rows[0].count, 10)
        });
      }

      // If force delete, remove associated records or set kategori to NULL
      if (req.query.force === 'true') {
        await db.query(`DELETE FROM struktur_organisasi WHERE tipe = $1 AND kategori = $2`, [tipe, nama_kategori]);
      }

      await db.query(`DELETE FROM struktur_jabatan WHERE tipe = $1 AND kategori = $2`, [tipe, nama_kategori]);
      await db.query(`DELETE FROM struktur_kategori WHERE id = $1`, [id]);

      res.json({ message: 'Kategori berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Gagal menghapus kategori.' });
    }
  });

  // ── GET /api/struktur/jabatan/:tipe (List Positions for Sub-tab) ─────────
  app.get('/api/struktur/jabatan/:tipe', async (req, res) => {
    const { tipe } = req.params;
    const { kategori } = req.query;

    try {
      let query = `SELECT * FROM struktur_jabatan WHERE tipe = $1`;
      const params = [tipe];
      if (kategori) {
        query += ` AND kategori = $2`;
        params.push(kategori);
      }
      query += ` ORDER BY no_urut ASC, id ASC`;
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching jabatan list:', error);
      res.status(500).json({ error: 'Gagal memuat daftar jabatan.' });
    }
  });

  // ── POST /api/struktur/jabatan (Create Position Template) ────────────────
  app.post('/api/struktur/jabatan', async (req, res) => {
    const { tipe, kategori, nama_jabatan, keterangan_default, no_urut } = req.body;

    if (!tipe || !kategori || !nama_jabatan || !nama_jabatan.trim()) {
      return res.status(400).json({ error: 'Tipe, kategori, dan nama jabatan wajib diisi.' });
    }

    try {
      const trimmedJabatan = nama_jabatan.trim();
      const trimmedKat = kategori.trim();
      const order = Number(no_urut) || 0;

      const result = await db.query(`
        INSERT INTO struktur_jabatan (tipe, kategori, nama_jabatan, keterangan_default, no_urut)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tipe, kategori, nama_jabatan) 
        DO UPDATE SET keterangan_default = EXCLUDED.keterangan_default, no_urut = EXCLUDED.no_urut
        RETURNING *
      `, [tipe, trimmedKat, trimmedJabatan, keterangan_default || null, order]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error adding jabatan:', error);
      res.status(500).json({ error: 'Gagal menambahkan nama jabatan.' });
    }
  });

  // ── PUT /api/struktur/jabatan/:id (Update / Rename Position Template) ─────
  app.put('/api/struktur/jabatan/:id', async (req, res) => {
    const { id } = req.params;
    const { nama_jabatan, keterangan_default, no_urut } = req.body;

    if (!nama_jabatan || !nama_jabatan.trim()) {
      return res.status(400).json({ error: 'Nama jabatan wajib diisi.' });
    }

    try {
      const oldRes = await db.query('SELECT * FROM struktur_jabatan WHERE id = $1', [id]);
      if (!oldRes.rows.length) {
        return res.status(404).json({ error: 'Jabatan tidak ditemukan.' });
      }

      const { tipe, kategori, nama_jabatan: oldJabatan } = oldRes.rows[0];
      const newJabatan = nama_jabatan.trim();
      const order = no_urut !== undefined ? Number(no_urut) : oldRes.rows[0].no_urut;

      const updateRes = await db.query(`
        UPDATE struktur_jabatan 
        SET nama_jabatan = $1, keterangan_default = $2, no_urut = $3
        WHERE id = $4
        RETURNING *
      `, [newJabatan, keterangan_default, order, id]);

      // Cascade rename to existing records in struktur_organisasi
      if (oldJabatan !== newJabatan) {
        await db.query(`
          UPDATE struktur_organisasi 
          SET jabatan = $1 
          WHERE tipe = $2 AND kategori = $3 AND jabatan = $4
        `, [newJabatan, tipe, kategori, oldJabatan]);
      }

      res.json(updateRes.rows[0]);
    } catch (error) {
      console.error('Error updating jabatan:', error);
      res.status(500).json({ error: 'Gagal memperbarui jabatan.' });
    }
  });

  // ── DELETE /api/struktur/jabatan/:id (Delete Position Template) ──────────
  app.delete('/api/struktur/jabatan/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM struktur_jabatan WHERE id = $1 RETURNING *', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Jabatan tidak ditemukan.' });
      }
      res.json({ message: 'Jabatan berhasil dihapus dari daftar.' });
    } catch (error) {
      console.error('Error deleting jabatan:', error);
      res.status(500).json({ error: 'Gagal menghapus jabatan.' });
    }
  });

  // ── GET /api/struktur/:tipe ─────────────────────────────────────────────
  app.get('/api/struktur/:tipe', async (req, res) => {
    const typeParam = req.params.tipe;
    if (!VALID_TYPES.includes(typeParam)) {
      return res.status(400).json({ error: `Tipe struktur tidak valid. Gunakan salah satu: ${VALID_TYPES.join(', ')}` });
    }

    const { tahun_ajaran_id, kategori, semester } = req.query;

    try {
      let query = `
        SELECT ${SELECT_FIELDS}
        FROM struktur_organisasi s
        LEFT JOIN guru g ON s.guru_id = g.id
        LEFT JOIN santri st ON s.santri_id = st.id
      `;
      const params = [];
      let paramIdx = 1;

      if (typeParam === 'pondok' || typeParam === 'pondok_pesantren') {
        query += ` WHERE s.tipe IN ('dewan_penyantun', 'pondok_putra', 'pondok_putri', 'jamiyyah', 'pondok_pesantren')`;
      } else {
        query += ` WHERE s.tipe = $${paramIdx++}`;
        params.push(typeParam);
      }

      if (kategori) {
        query += ` AND s.kategori = $${paramIdx++}`;
        params.push(kategori);
      }

      if (tahun_ajaran_id) {
        query += ` AND (s.tahun_ajaran_id = $${paramIdx++} OR s.tahun_ajaran_id IS NULL)`;
        params.push(parseInt(tahun_ajaran_id, 10));
      }

      if (typeParam === 'panitia_ujian') {
        const activeSemester = semester || 'Ganjil';
        query += ` AND (s.semester = $${paramIdx++} OR s.semester IS NULL)`;
        params.push(activeSemester);
      } else if (semester) {
        query += ` AND (s.semester = $${paramIdx++} OR s.semester IS NULL)`;
        params.push(semester);
      }

      query += ` ORDER BY s.no_urut ASC, s.id ASC`;

      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching struktur:', error);
      res.status(500).json({ error: 'Gagal memuat data struktur organisasi.' });
    }
  });

  // ── POST /api/struktur (Update Personnel) ────────────────────────────────
  app.post('/api/struktur', async (req, res) => {
    const { id, guru_id, santri_id, nama_custom, keterangan, alamat, kategori, jabatan, no_urut, tahun_ajaran_id, semester } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID struktur wajib disertakan.' });
    }

    const parsedGuruId = guru_id ? Number(guru_id) : null;
    const parsedSantriId = santri_id ? Number(santri_id) : null;
    const parsedNamaCustom = nama_custom ? nama_custom.trim() : null;
    const parsedAlamat = alamat !== undefined ? (alamat ? alamat.trim() : null) : undefined;
    const parsedKategori = kategori !== undefined ? (kategori ? kategori.trim() : null) : undefined;
    const parsedJabatan = jabatan !== undefined ? (jabatan ? jabatan.trim() : null) : undefined;
    const parsedNoUrut = no_urut !== undefined ? Number(no_urut) : undefined;
    const parsedTaId = tahun_ajaran_id ? Number(tahun_ajaran_id) : null;
    const parsedSemester = semester !== undefined ? (semester ? semester.trim() : null) : undefined;

    try {
      const result = await db.query(`
        UPDATE struktur_organisasi
        SET 
          guru_id = $1,
          santri_id = $2,
          nama_custom = $3,
          keterangan = $4,
          alamat = COALESCE($5, alamat),
          kategori = COALESCE($6, kategori),
          jabatan = COALESCE($7, jabatan),
          no_urut = COALESCE($8, no_urut),
          tahun_ajaran_id = COALESCE($9, tahun_ajaran_id),
          semester = COALESCE($10, semester),
          updated_at = NOW()
        WHERE id = $11
        RETURNING *
      `, [parsedGuruId, parsedSantriId, parsedNamaCustom, keterangan, parsedAlamat, parsedKategori, parsedJabatan, parsedNoUrut, parsedTaId, parsedSemester, id]);

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Jabatan/struktur tidak ditemukan.' });
      }

      // Fetch the updated record with joined info
      const fullRecord = await db.query(`
        SELECT ${SELECT_FIELDS}
        FROM struktur_organisasi s
        LEFT JOIN guru g ON s.guru_id = g.id
        LEFT JOIN santri st ON s.santri_id = st.id
        WHERE s.id = $1
      `, [id]);

      res.json(fullRecord.rows[0]);
    } catch (error) {
      console.error('Error updating struktur:', error);
      res.status(500).json({ error: 'Gagal memperbarui data struktur organisasi.' });
    }
  });

  // ── POST /api/struktur/add (Add New Personnel) ───────────────────────────
  app.post('/api/struktur/add', async (req, res) => {
    const { tipe, kategori, jabatan, guru_id, santri_id, nama_custom, alamat, keterangan, no_urut, tahun_ajaran_id, semester } = req.body;

    if (!tipe || !jabatan) {
      return res.status(400).json({ error: 'Tipe dan Jabatan wajib diisi.' });
    }

    const parsedGuruId = guru_id ? Number(guru_id) : null;
    const parsedSantriId = santri_id ? Number(santri_id) : null;
    const parsedNamaCustom = nama_custom ? nama_custom.trim() : null;
    const parsedAlamat = alamat ? alamat.trim() : null;
    const parsedKategori = kategori ? kategori.trim() : null;
    const parsedNoUrut = no_urut ? Number(no_urut) : 99;
    const parsedTaId = tahun_ajaran_id ? Number(tahun_ajaran_id) : null;
    const parsedSemester = semester ? semester.trim() : 'Ganjil';

    try {
      const result = await db.query(`
        INSERT INTO struktur_organisasi (tipe, kategori, jabatan, guru_id, santri_id, nama_custom, alamat, keterangan, no_urut, tahun_ajaran_id, semester)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [tipe, parsedKategori, jabatan.trim(), parsedGuruId, parsedSantriId, parsedNamaCustom, parsedAlamat, keterangan, parsedNoUrut, parsedTaId, parsedSemester]);

      // Auto ensure category and jabatan are recorded in config tables
      if (parsedKategori) {
        await db.query(`
          INSERT INTO struktur_kategori (tipe, nama_kategori, no_urut)
          VALUES ($1, $2, 0)
          ON CONFLICT (tipe, nama_kategori) DO NOTHING
        `, [tipe, parsedKategori]);

        await db.query(`
          INSERT INTO struktur_jabatan (tipe, kategori, nama_jabatan, keterangan_default, no_urut)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (tipe, kategori, nama_jabatan) DO NOTHING
        `, [tipe, parsedKategori, jabatan.trim(), keterangan || null, parsedNoUrut]);
      }

      // Fetch full row with joined details
      const fullRow = await db.query(`
        SELECT ${SELECT_FIELDS}
        FROM struktur_organisasi s
        LEFT JOIN guru g ON s.guru_id = g.id
        LEFT JOIN santri st ON s.santri_id = st.id
        WHERE s.id = $1
      `, [result.rows[0].id]);

      res.status(201).json(fullRow.rows[0]);
    } catch (error) {
      console.error('Error adding to struktur:', error);
      res.status(500).json({ error: 'Gagal menambahkan personel baru.' });
    }
  });

  // ── DELETE /api/struktur/:id ─────────────────────────────────────────────
  app.delete('/api/struktur/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM struktur_organisasi WHERE id = $1 RETURNING id', [id]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Personel tidak ditemukan.' });
      }
      res.json({ message: 'Personel berhasil dihapus.' });
    } catch (error) {
      console.error('Error deleting from struktur:', error);
      res.status(500).json({ error: 'Gagal menghapus personel.' });
    }
  });

  // ── POST /api/struktur/reset ─────────────────────────────────────────────
  app.post('/api/struktur/reset', async (req, res) => {
    const { tipe, tahun_ajaran_id, semester } = req.body;
    if (!VALID_TYPES.includes(tipe)) {
      return res.status(400).json({ error: 'Tipe struktur tidak valid.' });
    }

    try {
      let resetQuery = `
        UPDATE struktur_organisasi
        SET 
          guru_id = NULL,
          santri_id = NULL,
          nama_custom = NULL,
          keterangan = NULL,
          updated_at = NOW()
        WHERE tipe = $1 AND no_urut <= 7
      `;
      const resetParams = [tipe];
      let pIdx = 2;
      if (tahun_ajaran_id) {
        resetQuery += ` AND (tahun_ajaran_id = $${pIdx++} OR tahun_ajaran_id IS NULL)`;
        resetParams.push(parseInt(tahun_ajaran_id, 10));
      }
      if (semester) {
        resetQuery += ` AND (semester = $${pIdx++} OR semester IS NULL)`;
        resetParams.push(semester);
      }
      await db.query(resetQuery, resetParams);

      let deleteQuery = `DELETE FROM struktur_organisasi WHERE tipe = $1 AND no_urut > 7`;
      const deleteParams = [tipe];
      let dIdx = 2;
      if (tahun_ajaran_id) {
        deleteQuery += ` AND (tahun_ajaran_id = $${dIdx++} OR tahun_ajaran_id IS NULL)`;
        deleteParams.push(parseInt(tahun_ajaran_id, 10));
      }
      if (semester) {
        deleteQuery += ` AND (semester = $${dIdx++} OR semester IS NULL)`;
        deleteParams.push(semester);
      }
      await db.query(deleteQuery, deleteParams);

      res.json({ message: 'Struktur organisasi berhasil dikosongkan.' });
    } catch (error) {
      console.error('Error resetting struktur:', error);
      res.status(500).json({ error: 'Gagal mengosongkan data struktur organisasi.' });
    }
  });
}

module.exports = registerStrukturRoutes;
export default registerStrukturRoutes;
