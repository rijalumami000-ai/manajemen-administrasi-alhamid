import db from '../../db';

export class SettingsService {
  async getSettings(): Promise<Record<string, any>> {
    try {
      const result = await db.query('SELECT * FROM system_settings');
      const settings: Record<string, any> = {};
      result.rows.forEach((row: { key: string; value: any }) => {
        settings[row.key] = row.value;
      });
      return settings;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  async updateSetting(key: string, value: any): Promise<{ success: boolean }> {
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

const settingsService = new SettingsService();
module.exports = settingsService;
export default settingsService;
