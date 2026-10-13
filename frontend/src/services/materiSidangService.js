import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const materiSidangService = {
  async fetchMateriSidang(tahunAjaranId, kategori) {
    let params = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategori) params.push(`kategori=${kategori}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return apiGet(`/materi-sidang${qs}`, { noCache: true });
  },

  async fetchTahunAjaran() {
    return apiGet('/tahun-ajaran', { noCache: true });
  },

  async fetchTahunOptions() {
    return apiGet('/materi-sidang/tahun-options', { noCache: true });
  },

  async createMateriSidang(formData) {
    return apiPost('/materi-sidang', formData);
  },

  async updateMateriSidang(id, formData) {
    return apiPut(`/materi-sidang/${id}`, formData);
  },

  async deleteMateriSidang(id) {
    return apiDelete(`/materi-sidang/${id}`);
  },
};
