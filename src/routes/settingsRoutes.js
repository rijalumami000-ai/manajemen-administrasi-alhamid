const express = require('express');
const router = express.Router();
const SettingsService = require('../services/settingsService');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/settings (Public)
router.get('/', async (req, res, next) => {
  try {
    const data = await SettingsService.getSettings();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/settings (Protected - Admin only)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    // Check role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang dapat mengubah pengaturan' });
    }

    const { key, value, ...rest } = req.body;
    
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

module.exports = function(app) {
  app.use('/api/settings', router);
};
