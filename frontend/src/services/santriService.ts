import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './apiClient';

export const santriService = {
  // Fetch all santri or by tahun ajaran
  async fetchSantri(tahunAjaranId: number | string | null = null): Promise<any> {
    const endpoint = tahunAjaranId
      ? `/tahun-ajaran/${tahunAjaranId}/santri`
      : `/santri`;
    return apiGet(endpoint, { noCache: true });
  },

  // Create new santri
  async createSantri(data: any): Promise<any> {
    return apiPost('/santri', data);
  },

  // Update santri
  async updateSantri(id: number | string, data: any): Promise<any> {
    return apiPut(`/santri/${id}`, data);
  },

  // Update semester status
  async updateSemesterStatus(id: number | string, data: any): Promise<any> {
    return apiPatch(`/santri/${id}/semester-status`, data);
  },

  // Delete santri
  async deleteSantri(id: number | string): Promise<any> {
    return apiDelete(`/santri/${id}`);
  },

  // Fetch tahun ajaran
  async fetchTahunAjaran(): Promise<any> {
    return apiGet('/tahun-ajaran', { noCache: true });
  },

  // Fetch active tahun ajaran
  async fetchActiveTahunAjaran(): Promise<any> {
    return apiGet('/tahun-ajaran/active', { noCache: true });
  },

  // Fetch santri by tahun ajaran
  async fetchSantriByTahunAjaran(tahunAjaranId: number | string): Promise<any> {
    return apiGet(`/tahun-ajaran/${tahunAjaranId}/santri`, { noCache: true });
  },

  // Migrate tahun ajaran
  async migrateTahunAjaran(targetKode: string, excludedSantriIds: (number | string)[] = [], promotions: any[] = []): Promise<any> {
    return apiPost('/tahun-ajaran/migrate', {
      target_kode: targetKode,
      excluded_santri_ids: excludedSantriIds,
      promotions: promotions
    });
  },

  // Rollback migration
  async rollbackMigration(): Promise<any> {
    return apiPost('/tahun-ajaran/rollback', {});
  },

  // Fetch kelas
  async fetchKelas(tahunAjaranId: number | string | null = null): Promise<any> {
    const query = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/kelas${query}`, { noCache: true });
  },

  // Fetch kamar
  async fetchKamar(): Promise<any> {
    return apiGet('/kamar');
  },

  // Fetch alumni (to filter out from santri list)
  async fetchAlumni(): Promise<any> {
    return apiGet('/alumni', { noCache: true });
  },
  
  // Import Excel
  async importExcel(formData: FormData): Promise<any> {
    return apiPost('/santri/import', formData);
  }
};

export default santriService;
