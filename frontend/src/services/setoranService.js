import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const setoranService = {
  fetchOverview: async (params = {}) => {
    const qp = new URLSearchParams();
    if (params.kelas_id) qp.append('kelas_id', params.kelas_id);
    if (params.tahun_ajaran_id) qp.append('tahun_ajaran_id', params.tahun_ajaran_id);
    if (params.semester) qp.append('semester', params.semester);
    const query = qp.toString() ? `?${qp.toString()}` : '';
    return apiGet(`/my-mustahiq/setoran/overview${query}`, { noCache: true });
  },

  fetchSantriHistory: async (santriId, params = {}) => {
    const qp = new URLSearchParams();
    if (params.kelas_id) qp.append('kelas_id', params.kelas_id);
    if (params.tahun_ajaran_id) qp.append('tahun_ajaran_id', params.tahun_ajaran_id);
    const query = qp.toString() ? `?${qp.toString()}` : '';
    return apiGet(`/my-mustahiq/setoran/santri/${santriId}${query}`, { noCache: true });
  },

  saveKonfigurasi: async (data) => {
    return apiPost('/my-mustahiq/setoran/konfigurasi', data);
  },

  inputSetoran: async (data) => {
    return apiPost('/my-mustahiq/setoran/input', data);
  },

  bulkInputSetoran: async (data) => {
    return apiPost('/my-mustahiq/setoran/bulk-input', data);
  },

  updateSetoran: async (id, data) => {
    return apiPut(`/my-mustahiq/setoran/${id}`, data);
  },

  deleteSetoran: async (id) => {
    return apiDelete(`/my-mustahiq/setoran/${id}`);
  }
};

export default setoranService;
