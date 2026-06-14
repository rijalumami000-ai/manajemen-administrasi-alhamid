import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const alumniService = {
  // Alumni CRUD
  async fetchAlumni(tipe = null, tahunAjaranId = null) {
    let url = '/alumni';
    const query = [];
    if (tipe) query.push(`tipe=${tipe}`);
    if (tahunAjaranId) query.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (query.length > 0) {
      url += `?${query.join('&')}`;
    }
    return apiGet(url, { noCache: true });
  },

  async createAlumni(data) {
    return apiPost('/alumni', data);
  },

  async updateAlumni(id, data) {
    return apiPut(`/alumni/${id}`, data);
  },

  async deleteAlumni(id) {
    return apiDelete(`/alumni/${id}`);
  },

  // Migrate santri to alumni
  async migrateSantri(data) {
    return apiPost('/alumni/migrate', data);
  },

  // Get alumni detail with history
  async fetchAlumniDetail(id) {
    return apiGet(`/alumni/${id}/detail`, { noCache: true });
  },

  // Get active santri for migration
  async fetchActiveSantri() {
    return apiGet('/santri/active', { noCache: true });
  },

  // Reactivate student back to active year
  async reactivateAlumni(id) {
    return apiPost(`/alumni/${id}/reactivate`, {});
  }
};
