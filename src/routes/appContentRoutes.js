const express = require('express');
const db = require('../../db');
const { asyncHandler } = require('../utils/errorHandler');
const { authenticateToken } = require('../middleware/authMiddleware');

function registerAppContentRoutes(app) {
  const router = express.Router();

  /**
   * GET /api/app-info
   * Public / Authenticated: Fetch contents for Pusat Bantuan, Tentang, or Pengembang
   */
  router.get('/', asyncHandler(async (req, res) => {
    const { section, category, search } = req.query;
    let query = 'SELECT * FROM app_contents WHERE 1=1';
    const params = [];

    if (section) {
      params.push(section);
      query += ` AND section = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length} OR category ILIKE $${params.length})`;
    }

    query += ' ORDER BY order_index ASC, id ASC';

    const result = await db.query(query, params);
    res.json({
      success: true,
      data: result.rows
    });
  }));

  /**
   * GET /api/app-info/:id
   */
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM app_contents WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Konten tidak ditemukan.' });
    }
    res.json({ success: true, data: result.rows[0] });
  }));

  /**
   * POST /api/app-info
   * Admin: Add new content item
   */
  router.post('/', authenticateToken, asyncHandler(async (req, res) => {
    const { section, category, title, content, icon, order_index, is_active } = req.body;

    if (!section || !title || !content) {
      return res.status(400).json({ error: 'Section, judul, dan isi konten wajib diisi.' });
    }

    const validSections = ['pusat_bantuan', 'tentang', 'pengembang'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ error: `Section harus salah satu dari: ${validSections.join(', ')}` });
    }

    const result = await db.query(
      `INSERT INTO app_contents (section, category, title, content, icon, order_index, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 0), COALESCE($7, true), NOW())
       RETURNING *`,
      [section, category || 'Umum', title, content, icon || 'info', order_index || 0, is_active !== false]
    );

    res.status(201).json({
      success: true,
      message: 'Konten berhasil ditambahkan.',
      data: result.rows[0]
    });
  }));

  /**
   * PUT /api/app-info/:id
   * Admin: Update content item
   */
  router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { section, category, title, content, icon, order_index, is_active } = req.body;

    const existing = await db.query('SELECT id FROM app_contents WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Konten tidak ditemukan.' });
    }

    const result = await db.query(
      `UPDATE app_contents 
       SET section = COALESCE($1, section),
           category = COALESCE($2, category),
           title = COALESCE($3, title),
           content = COALESCE($4, content),
           icon = COALESCE($5, icon),
           order_index = COALESCE($6, order_index),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [section, category, title, content, icon, order_index, is_active, id]
    );

    res.json({
      success: true,
      message: 'Konten berhasil diperbarui.',
      data: result.rows[0]
    });
  }));

  /**
   * DELETE /api/app-info/:id
   * Admin: Delete content item
   */
  router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await db.query('DELETE FROM app_contents WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Konten tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Konten berhasil dihapus.' });
  }));

  app.use('/api/app-info', router);
}

module.exports = registerAppContentRoutes;
