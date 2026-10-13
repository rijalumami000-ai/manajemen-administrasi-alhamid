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
    // Use FormData for file upload
    const response = await fetch(`/api/materi-sidang/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Gagal memperbarui data');
    }
    return response.json();
  },

  async deleteMateriSidang(id) {
    return apiDelete(`/materi-sidang/${id}`);
  },
};
