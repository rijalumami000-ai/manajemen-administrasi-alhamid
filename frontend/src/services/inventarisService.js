import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const inventarisService = {
  async fetchInventaris(params = {}) {
    const query = new URLSearchParams();
    if (params.kategori) query.append('kategori', params.kategori);
    if (params.kondisi) query.append('kondisi', params.kondisi);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiGet(`/inventaris${qs ? `?${qs}` : ''}`, { noCache: true });
  },

  async fetchRekap() {
    return apiGet('/inventaris/rekap', { noCache: true });
  },

  async createInventaris(data) {
    return apiPost('/inventaris', data);
  },

  async updateInventaris(id, data) {
    return apiPut(`/inventaris/${id}`, data);
  },

  async deleteInventaris(id) {
    return apiDelete(`/inventaris/${id}`);
  }
};
