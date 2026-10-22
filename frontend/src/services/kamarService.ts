import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const kamarService = {
  // Fetch all kamar
  async fetchKamar(): Promise<any> {
    return apiGet('/kamar', { noCache: true });
  },

  // Fetch kamar detail and members
  async fetchKamarAnggota(id: number | string): Promise<any> {
    return apiGet(`/kamar/${id}/anggota`, { noCache: true });
  },

  // Create new kamar
  async createKamar(data: any): Promise<any> {
    return apiPost('/kamar', data);
  },

  // Update kamar
  async updateKamar(id: number | string, data: any): Promise<any> {
    return apiPut(`/kamar/${id}`, data);
  },

  // Delete kamar
  async deleteKamar(id: number | string): Promise<any> {
    return apiDelete(`/kamar/${id}`);
  }
};

export default kamarService;
