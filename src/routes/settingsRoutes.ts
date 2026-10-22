import express, { Request, Response, NextFunction } from 'express';
import SettingsService from '../services/settingsService';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/settings (Public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await SettingsService.getSettings();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/settings (Protected - Admin only)
router.post('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang dapat mengubah pengaturan' });
    }

    const { key, value } = req.body;
    
    // Single key update: { key, value }
    if (key !== undefined && typeof key === 'string') {
      const result = await SettingsService.updateSetting(key, value);
      return res.json(result);
    }
    
    // Multi-key / object update: { app_name, active_semester, app_logo, ... }
    for (const [k, v] of Object.entries(req.body)) {
      if (v !== undefined) {
        await SettingsService.updateSetting(k, v);
      }
    }
    res.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
  } catch (error) {
    next(error);
  }
});

export function registerSettingsRoutes(app: any): void {
  app.use('/api/settings', router);
}

module.exports = registerSettingsRoutes;
export default registerSettingsRoutes;
