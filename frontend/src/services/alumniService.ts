import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export interface AlumniFilterParams {
  tipe?: string | null;
  tahunAjaranId?: number | string | null;
}

export const alumniService = {
  // Alumni CRUD
  async fetchAlumni(tipe: string | null = null, tahunAjaranId: number | string | null = null): Promise<any> {
    let url = '/alumni';
    const query: string[] = [];
    if (tipe) query.push(`tipe=${tipe}`);
    if (tahunAjaranId) query.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (query.length > 0) {
      url += `?${query.join('&')}`;
    }
    return apiGet(url, { noCache: true });
  },

  async createAlumni(data: any): Promise<any> {
    return apiPost('/alumni', data);
  },

  async updateAlumni(id: number | string, data: any): Promise<any> {
    return apiPut(`/alumni/${id}`, data);
  },

  async deleteAlumni(id: number | string): Promise<any> {
    return apiDelete(`/alumni/${id}`);
  },

  // Migrate santri to alumni
  async migrateSantri(data: any): Promise<any> {
    return apiPost('/alumni/migrate', data);
  },

  // Get alumni detail with history
  async fetchAlumniDetail(id: number | string): Promise<any> {
    return apiGet(`/alumni/${id}/detail`, { noCache: true });
  },

  // Get active santri for migration
  async fetchActiveSantri(): Promise<any> {
    return apiGet('/santri/active', { noCache: true });
  },

  // Reactivate student back to active year
  async reactivateAlumni(id: number | string): Promise<any> {
    return apiPost(`/alumni/${id}/reactivate`, {});
  }
};

export default alumniService;
