import { apiGet, apiPost } from './apiClient';

export const settingsService = {
  fetchSettings: async (): Promise<any> => {
    return apiGet('/settings');
  },

  updateSetting: async (key: string, value: any): Promise<any> => {
    return apiPost('/settings', { key, value });
  },

  updateSettings: async (settingsObj: Record<string, any>): Promise<any> => {
    return apiPost('/settings', settingsObj);
  },

  uploadLogo: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiPost('/kartu-ujian/upload-aset/logo', formData);
  },

  uploadAset: async (key: string, formData: FormData): Promise<any> => {
    return apiPost(`/kartu-ujian/upload-aset/${key}`, formData);
  }
};

export default settingsService;
