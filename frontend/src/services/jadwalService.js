import { apiGet, apiPost, apiDelete } from './apiClient';

export const jadwalService = {
  // Fetch daily lesson schedules, optionally filtered by tahun_ajaran_id and kelas_id
  async fetchJadwal(tahunAjaranId, kelasId) {
    let url = '/jadwal-pelajaran';
    const params = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kelasId) params.push(`kelas_id=${kelasId}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return apiGet(url, { noCache: true });
  },

  // Save/update a daily schedule slot
  async saveJadwal(data) {
    return apiPost('/jadwal-pelajaran', data);
  },

  // Delete a specific schedule slot by ID
  async deleteJadwal(id) {
    return apiDelete(`/jadwal-pelajaran/${id}`);
  }
};
