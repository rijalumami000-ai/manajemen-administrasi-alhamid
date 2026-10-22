import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export interface SetoranOverviewParams {
  kelas_id?: string | number;
  tahun_ajaran_id?: string | number;
  semester?: string;
}

export interface SetoranHistoryParams {
  kelas_id?: string | number;
  tahun_ajaran_id?: string | number;
}

export const setoranService = {
  fetchOverview: async (params: SetoranOverviewParams = {}): Promise<any> => {
    const qp = new URLSearchParams();
    if (params.kelas_id) qp.append('kelas_id', String(params.kelas_id));
    if (params.tahun_ajaran_id) qp.append('tahun_ajaran_id', String(params.tahun_ajaran_id));
    if (params.semester) qp.append('semester', params.semester);
    const query = qp.toString() ? `?${qp.toString()}` : '';
    return apiGet(`/my-mustahiq/setoran/overview${query}`, { noCache: true });
  },

  fetchSantriHistory: async (santriId: number | string, params: SetoranHistoryParams = {}): Promise<any> => {
    const qp = new URLSearchParams();
    if (params.kelas_id) qp.append('kelas_id', String(params.kelas_id));
    if (params.tahun_ajaran_id) qp.append('tahun_ajaran_id', String(params.tahun_ajaran_id));
    const query = qp.toString() ? `?${qp.toString()}` : '';
    return apiGet(`/my-mustahiq/setoran/santri/${santriId}${query}`, { noCache: true });
  },

  saveKonfigurasi: async (data: any): Promise<any> => {
    return apiPost('/my-mustahiq/setoran/konfigurasi', data);
  },

  inputSetoran: async (data: any): Promise<any> => {
    return apiPost('/my-mustahiq/setoran/input', data);
  },

  bulkInputSetoran: async (data: any): Promise<any> => {
    return apiPost('/my-mustahiq/setoran/bulk-input', data);
  },

  updateSetoran: async (id: number | string, data: any): Promise<any> => {
    return apiPut(`/my-mustahiq/setoran/${id}`, data);
  },

  deleteSetoran: async (id: number | string): Promise<any> => {
    return apiDelete(`/my-mustahiq/setoran/${id}`);
  }
};

export default setoranService;
