import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const romadhonService = {
  // ═══ KAJIAN BALAGH ═══
  async fetchKajianBalagh(tahunAjaranId) {
    const params = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/romadhon/kajian-balagh${params}`, { noCache: true });
  },

  async createKajianBalagh(data) {
    return apiPost('/romadhon/kajian-balagh', data);
  },

  async updateKajianBalagh(id, data) {
    return apiPut(`/romadhon/kajian-balagh/${id}`, data);
  },

  async deleteKajianBalagh(id) {
    return apiDelete(`/romadhon/kajian-balagh/${id}`);
  },

  // ═══ IMAM TARAWIH ═══
  async fetchImamTarawih(tahunAjaranId) {
    const params = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/romadhon/imam-tarawih${params}`, { noCache: true });
  },

  async createImamTarawih(data) {
    return apiPost('/romadhon/imam-tarawih', data);
  },

  async updateImamTarawih(id, data) {
    return apiPut(`/romadhon/imam-tarawih/${id}`, data);
  },

  async deleteImamTarawih(id) {
    return apiDelete(`/romadhon/imam-tarawih/${id}`);
  },
};
