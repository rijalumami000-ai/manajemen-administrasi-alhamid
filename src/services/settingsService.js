const db = require('../../db');

class SettingsService {
  async getSettings() {
    try {
      const result = await db.query('SELECT * FROM system_settings');
      const settings = {};
      result.rows.forEach(row => {
        settings[row.key] = row.value;
      });
      return settings;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  async updateSetting(key, value) {
    try {
      await db.query(
        'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, value]
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }
}

module.exports = new SettingsService();
