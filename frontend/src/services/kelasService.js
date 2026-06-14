import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const kelasService = {
  // Fetch all kelas
  async fetchKelas(tahunAjaranId) {
    const query = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/kelas${query}`, { noCache: true });
  },

  // Create new kelas
  async createKelas(data) {
    return apiPost('/kelas', data);
  },

  // Update kelas
  async updateKelas(id, data) {
    return apiPut(`/kelas/${id}`, data);
  },

  // Delete kelas
  async deleteKelas(id) {
    return apiDelete(`/kelas/${id}`);
  }
};
