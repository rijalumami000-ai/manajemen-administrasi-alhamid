import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const kelasService = {
  // Fetch all kelas
  async fetchKelas(tahunAjaranId?: number | string | null): Promise<any> {
    const query = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/kelas${query}`, { noCache: true });
  },

  // Create new kelas
  async createKelas(data: any): Promise<any> {
    return apiPost('/kelas', data);
  },

  // Update kelas
  async updateKelas(id: number | string, data: any): Promise<any> {
    return apiPut(`/kelas/${id}`, data);
  },

  // Delete kelas
  async deleteKelas(id: number | string, tahunAjaranId: number | string | null = null): Promise<any> {
    const query = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiDelete(`/kelas/${id}${query}`);
  }
};

export default kelasService;
