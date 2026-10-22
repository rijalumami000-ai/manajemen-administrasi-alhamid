import { apiGet, apiPost, apiDelete } from './apiClient';

export const jadwalService = {
  // Fetch daily lesson schedules, optionally filtered by tahun_ajaran_id and kelas_id
  async fetchJadwal(tahunAjaranId?: number | string | null, kelasId?: number | string | null): Promise<any> {
    let url = '/jadwal-pelajaran';
    const params: string[] = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kelasId) params.push(`kelas_id=${kelasId}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return apiGet(url, { noCache: true });
  },

  // Save/update a daily schedule slot
  async saveJadwal(data: any): Promise<any> {
    return apiPost('/jadwal-pelajaran', data);
  },

  // Delete a specific schedule slot by ID
  async deleteJadwal(id: number | string): Promise<any> {
    return apiDelete(`/jadwal-pelajaran/${id}`);
  }
};

export default jadwalService;
