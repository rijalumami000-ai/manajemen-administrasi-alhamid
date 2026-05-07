import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const kamarService = {
  // Fetch all kamar
  async fetchKamar() {
    return apiGet('/kamar', { noCache: true });
  },

  // Create new kamar
  async createKamar(data) {
    return apiPost('/kamar', data);
  },

  // Update kamar
  async updateKamar(id, data) {
    return apiPut(`/kamar/${id}`, data);
  },

  // Delete kamar
  async deleteKamar(id) {
    return apiDelete(`/kamar/${id}`);
  }
};
