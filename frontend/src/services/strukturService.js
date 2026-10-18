import { apiGet, apiPost, apiDelete } from './apiClient';

export const strukturService = {
  // Fetch academic years
  async fetchTahunAjaran() {
    return apiGet('/tahun-ajaran', { noCache: true });
  },

  // Fetch structure cards by type
  async fetchStruktur(tipe, tahunAjaranId, kategori) {
    const params = new URLSearchParams();
    if (tahunAjaranId) params.append('tahun_ajaran_id', tahunAjaranId);
    if (kategori) params.append('kategori', kategori);
    const qp = params.toString() ? `?${params.toString()}` : '';
    return apiGet(`/struktur/${tipe}${qp}`, { noCache: true });
  },

  // Update a structure position assignment
  async updateStruktur(data) {
    return apiPost('/struktur', data);
  },

  // Add a new structure card (for multiple roles like TU)
  async addStruktur(data) {
    return apiPost('/struktur/add', data);
  },

  // Delete a structure card by ID
  async deleteStruktur(id) {
    return apiDelete(`/struktur/${id}`);
  },

  // Reset all assignments for a structure type
  async resetStruktur(tipe, tahunAjaranId) {
    return apiPost('/struktur/reset', { tipe, tahun_ajaran_id: tahunAjaranId });
  }
};
