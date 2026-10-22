import { Request, Response } from 'express';
import alumniService from '../services/alumniService';
import { asyncHandler } from '../utils/errorHandler';

export function registerAlumniRoutes(app: any): void {
  // ===== ALUMNI API =====

  /**
   * GET /api/alumni/search - Search alumni by query and year
   */
  app.get('/api/alumni/search', asyncHandler(async (req: Request, res: Response) => {
    const { q, tahun, tipe, tahun_ajaran_id } = req.query;
    const alumni = await alumniService.searchAlumni(
      q as string,
      tahun as string,
      tipe as string,
      tahun_ajaran_id as string
    );
    res.json(alumni);
  }));

  /**
   * GET /api/alumni - Get all alumni
   */
  app.get('/api/alumni', asyncHandler(async (req: Request, res: Response) => {
    const { tipe, tahun_ajaran_id } = req.query;
    const alumni = await alumniService.getAllAlumni(
      tipe as string,
      tahun_ajaran_id as string
    );
    res.json(alumni);
  }));

  /**
   * POST /api/alumni - Create new alumni manually
   */
  app.post('/api/alumni', asyncHandler(async (req: Request, res: Response) => {
    const alumni = await alumniService.createAlumni(req.body);
    res.status(201).json(alumni);
  }));

  /**
   * PUT /api/alumni/:id - Update alumni by ID
   */
  app.put('/api/alumni/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    const alumni = await alumniService.updateAlumni(id, req.body);
    res.json(alumni);
  }));

  /**
   * DELETE /api/alumni/:id - Delete alumni by ID
   */
  app.delete('/api/alumni/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    const result = await alumniService.deleteAlumni(id);
    res.json(result);
  }));

  /**
   * GET /api/santri/active - Get active santri for migration dropdown
   */
  app.get('/api/santri/active', asyncHandler(async (req: Request, res: Response) => {
    const santri = await alumniService.getActiveSantri();
    res.json(santri);
  }));

  /**
   * POST /api/alumni/migrate - Migrate santri to alumni
   */
  app.post('/api/alumni/migrate', asyncHandler(async (req: Request, res: Response) => {
    const { santri_id, tahun_lulus, keterangan, tipe } = req.body;
    const result = await alumniService.migrateSantriToAlumni(santri_id, tahun_lulus, keterangan, tipe);
    res.status(201).json(result);
  }));

  /**
   * GET /api/alumni/:id/detail - Get alumni detail with history
   */
  app.get('/api/alumni/:id/detail', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    const detail = await alumniService.getAlumniDetail(id);
    res.json(detail);
  }));

  /**
   * POST /api/alumni/:id/reactivate - Reactivate alumni back to active year
   */
  app.post('/api/alumni/:id/reactivate', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10);
    const result = await alumniService.reactivateAlumni(id);
    res.json(result);
  }));
}

module.exports = registerAlumniRoutes;
export default registerAlumniRoutes;
