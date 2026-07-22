import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './apiClient';

export const santriService = {
  // Fetch all santri or by tahun ajaran
  async fetchSantri(tahunAjaranId = null) {
    const endpoint = tahunAjaranId
      ? `/tahun-ajaran/${tahunAjaranId}/santri`
      : `/santri`;
    return apiGet(endpoint, { noCache: true });
  },

  // Create new santri
  async createSantri(data) {
    return apiPost('/santri', data);
  },

  // Update santri
  async updateSantri(id, data) {
    return apiPut(`/santri/${id}`, data);
  },

  // Update semester status
  async updateSemesterStatus(id, data) {
    return apiPatch(`/santri/${id}/semester-status`, data);
  },

  // Delete santri
  async deleteSantri(id) {
    return apiDelete(`/santri/${id}`);
  },

  // Fetch tahun ajaran
  async fetchTahunAjaran() {
    return apiGet('/tahun-ajaran', { noCache: true });
  },

  // Fetch active tahun ajaran
  async fetchActiveTahunAjaran() {
    return apiGet('/tahun-ajaran/active', { noCache: true });
  },

  // Fetch santri by tahun ajaran
  async fetchSantriByTahunAjaran(tahunAjaranId) {
    return apiGet(`/tahun-ajaran/${tahunAjaranId}/santri`, { noCache: true });
  },

  // Migrate tahun ajaran
  async migrateTahunAjaran(targetKode, excludedSantriIds = [], promotions = []) {
    return apiPost('/tahun-ajaran/migrate', {
      target_kode: targetKode,
      excluded_santri_ids: excludedSantriIds,
      promotions: promotions
    });
  },

  // Rollback migration
  async rollbackMigration() {
    return apiPost('/tahun-ajaran/rollback', {});
  },

  // Fetch kelas
  async fetchKelas(tahunAjaranId = null) {
    const query = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/kelas${query}`, { noCache: true });
  },

  // Fetch kamar
  async fetchKamar() {
    return apiGet('/kamar');
  },

  // Fetch alumni (to filter out from santri list)
  async fetchAlumni() {
    return apiGet('/alumni', { noCache: true });
  },
  
  // Import Excel
  async importExcel(formData) {
    return apiPost('/santri/import', formData);
  }
};
