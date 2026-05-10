import { apiGet, apiPost } from './apiClient';

export const settingsService = {
  fetchSettings: async () => {
    return apiGet('/settings');
  },

  updateSetting: async (key, value) => {
    return apiPost('/settings', { key, value });
  }
};
