import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

// Pelanggaran & Prestasi endpoints
export const pelanggaranService = {
  async fetchTahunAjaran(): Promise<any> {
    return apiGet('/tahun-ajaran', { noCache: true });
  },

  async fetchPelanggaran(tahunAjaranId?: number | string | null): Promise<any> {
    const qp = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/pelanggaran${qp}`, { noCache: true });
  },

  async createPelanggaran(data: any): Promise<any> {
    return apiPost('/pelanggaran', data);
  },

  async updatePelanggaran(id: number | string, data: any): Promise<any> {
    return apiPut(`/pelanggaran/${id}`, data);
  },

  async deletePelanggaran(id: number | string): Promise<any> {
    return apiDelete(`/pelanggaran/${id}`);
  },

  // Prestasi endpoints
  async fetchPrestasi(tahunAjaranId?: number | string | null): Promise<any> {
    const qp = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/prestasi${qp}`, { noCache: true });
  },

  async createPrestasi(data: any): Promise<any> {
    return apiPost('/prestasi', data);
  },

  async updatePrestasi(id: number | string, data: any): Promise<any> {
    return apiPut(`/prestasi/${id}`, data);
  },

  async deletePrestasi(id: number | string): Promise<any> {
    return apiDelete(`/prestasi/${id}`);
  },

  // Santri search for autocomplete
  async searchSantri(): Promise<any> {
    return apiGet('/santri', { noCache: true });
  }
};

export default pelanggaranService;
