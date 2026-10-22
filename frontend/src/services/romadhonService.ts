import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const romadhonService = {
  // ═══ KAJIAN BALAGH ═══
  async fetchKajianBalagh(tahunAjaranId?: number | string | null): Promise<any> {
    const params = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/romadhon/kajian-balagh${params}`, { noCache: true });
  },

  async createKajianBalagh(data: any): Promise<any> {
    return apiPost('/romadhon/kajian-balagh', data);
  },

  async updateKajianBalagh(id: number | string, data: any): Promise<any> {
    return apiPut(`/romadhon/kajian-balagh/${id}`, data);
  },

  async deleteKajianBalagh(id: number | string): Promise<any> {
    return apiDelete(`/romadhon/kajian-balagh/${id}`);
  },

  // ═══ IMAM TARAWIH ═══
  async fetchImamTarawih(tahunAjaranId?: number | string | null): Promise<any> {
    const params = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/romadhon/imam-tarawih${params}`, { noCache: true });
  },

  async createImamTarawih(data: any): Promise<any> {
    return apiPost('/romadhon/imam-tarawih', data);
  },

  async updateImamTarawih(id: number | string, data: any): Promise<any> {
    return apiPut(`/romadhon/imam-tarawih/${id}`, data);
  },

  async deleteImamTarawih(id: number | string): Promise<any> {
    return apiDelete(`/romadhon/imam-tarawih/${id}`);
  },
};

export default romadhonService;
