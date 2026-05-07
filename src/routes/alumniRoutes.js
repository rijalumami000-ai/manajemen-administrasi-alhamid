// alumniRoutes.js - Alumni API routes (refactored with service layer)

const alumniService = require('../services/alumniService');
const { asyncHandler } = require('../utils/errorHandler');

function registerAlumniRoutes(app) {
  // ===== ALUMNI API =====

  /**
   * GET /api/alumni/search - Search alumni by query and year
   */
  app.get('/api/alumni/search', asyncHandler(async (req, res) => {
    const { q, tahun } = req.query;
    const alumni = await alumniService.searchAlumni(q, tahun);
    res.json(alumni);
  }));

  /**
   * GET /api/alumni - Get all alumni
   */
  app.get('/api/alumni', asyncHandler(async (req, res) => {
    const alumni = await alumniService.getAllAlumni();
    res.json(alumni);
  }));

  /**
   * POST /api/alumni - Create new alumni manually
   */
  app.post('/api/alumni', asyncHandler(async (req, res) => {
    const alumni = await alumniService.createAlumni(req.body);
    res.status(201).json(alumni);
  }));

  /**
   * PUT /api/alumni/:id - Update alumni by ID
   */
  app.put('/api/alumni/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const alumni = await alumniService.updateAlumni(id, req.body);
    res.json(alumni);
  }));

  /**
   * DELETE /api/alumni/:id - Delete alumni by ID
   */
  app.delete('/api/alumni/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await alumniService.deleteAlumni(id);
    res.json(result);
  }));

  /**
   * GET /api/santri/active - Get active santri for migration dropdown
   */
  app.get('/api/santri/active', asyncHandler(async (req, res) => {
    const santri = await alumniService.getActiveSantri();
    res.json(santri);
  }));

  /**
   * POST /api/alumni/migrate - Migrate santri to alumni
   */
  app.post('/api/alumni/migrate', asyncHandler(async (req, res) => {
    const { santri_id, tahun_lulus, keterangan } = req.body;
    const result = await alumniService.migrateSantriToAlumni(santri_id, tahun_lulus, keterangan);
    res.status(201).json(result);
  }));

  /**
   * GET /api/alumni/:id/detail - Get alumni detail with history
   */
  app.get('/api/alumni/:id/detail', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const detail = await alumniService.getAlumniDetail(id);
    res.json(detail);
  }));
}

module.exports = registerAlumniRoutes;
