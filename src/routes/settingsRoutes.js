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
    const { key, value } = req.body;
    
    // Check role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Hanya admin yang dapat mengubah pengaturan' });
    }
    
    const result = await SettingsService.updateSetting(key, value);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = function(app) {
  app.use('/api/settings', router);
};
