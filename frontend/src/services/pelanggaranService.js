import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

// Pelanggaran & Prestasi endpoints
export const pelanggaranService = {
  async fetchTahunAjaran() {
    return apiGet('/tahun-ajaran', { noCache: true });
  },

  async fetchPelanggaran(tahunAjaranId) {
    const qp = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/pelanggaran${qp}`, { noCache: true });
  },

  async createPelanggaran(data) {
    return apiPost('/pelanggaran', data);
  },

  async updatePelanggaran(id, data) {
    return apiPut(`/pelanggaran/${id}`, data);
  },

  async deletePelanggaran(id) {
    return apiDelete(`/pelanggaran/${id}`);
  },

  // Prestasi endpoints
  async fetchPrestasi(tahunAjaranId) {
    const qp = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/prestasi${qp}`, { noCache: true });
  },

  async createPrestasi(data) {
    return apiPost('/prestasi', data);
  },

  async updatePrestasi(id, data) {
    return apiPut(`/prestasi/${id}`, data);
  },

  async deletePrestasi(id) {
    return apiDelete(`/prestasi/${id}`);
  },

  // Santri search for autocomplete
  async searchSantri() {
    return apiGet('/santri', { noCache: true });
  }
};
