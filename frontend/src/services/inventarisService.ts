import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export interface InventarisQueryParams {
  kategori?: string;
  kondisi?: string;
  search?: string;
}

export const inventarisService = {
  async fetchInventaris(params: InventarisQueryParams = {}): Promise<any> {
    const query = new URLSearchParams();
    if (params.kategori) query.append('kategori', params.kategori);
    if (params.kondisi) query.append('kondisi', params.kondisi);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiGet(`/inventaris${qs ? `?${qs}` : ''}`, { noCache: true });
  },

  async fetchRekap(): Promise<any> {
    return apiGet('/inventaris/rekap', { noCache: true });
  },

  async createInventaris(data: any): Promise<any> {
    return apiPost('/inventaris', data);
  },

  async updateInventaris(id: number | string, data: any): Promise<any> {
    return apiPut(`/inventaris/${id}`, data);
  },

  async deleteInventaris(id: number | string): Promise<any> {
    return apiDelete(`/inventaris/${id}`);
  }
};

export default inventarisService;
