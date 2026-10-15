import { apiGet, apiPost } from './apiClient';

export const settingsService = {
  fetchSettings: async () => {
    return apiGet('/settings');
  },

  updateSetting: async (key, value) => {
    return apiPost('/settings', { key, value });
  },

  updateSettings: async (settingsObj) => {
    return apiPost('/settings', settingsObj);
  },

  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiPost('/kartu-ujian/upload-aset/logo', formData);
  },

  uploadAset: async (key, formData) => {
    return apiPost(`/kartu-ujian/upload-aset/${key}`, formData);
  }
};
