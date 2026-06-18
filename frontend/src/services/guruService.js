import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const guruService = {
  // Fetch all guru
  async fetchGuru() {
    return apiGet('/guru', { noCache: true });
  },

  // Create new guru
  async createGuru(data) {
    return apiPost('/guru', data);
  },

  // Update guru
  async updateGuru(id, data) {
    return apiPut(`/guru/${id}`, data);
  },

  // Delete guru
  async deleteGuru(id) {
    return apiDelete(`/guru/${id}`);
  },

  // Fetch mata pelajaran
  async fetchMataPelajaran() {
    return apiGet('/mata-pelajaran', { noCache: true });
  },

  // Create mata pelajaran
  async createMataPelajaran(data) {
    return apiPost('/mata-pelajaran', data);
  },

  // Update mata pelajaran
  async updateMataPelajaran(id, data) {
    return apiPut(`/mata-pelajaran/${id}`, data);
  },

  // Delete mata pelajaran
  async deleteMataPelajaran(id) {
    return apiDelete(`/mata-pelajaran/${id}`);
  },

  // Fetch jabatan
  async fetchJabatan() {
    return apiGet('/jabatan', { noCache: true });
  },

  // Create jabatan
  async createJabatan(data) {
    return apiPost('/jabatan', data);
  },

  // Update jabatan
  async updateJabatan(id, data) {
    return apiPut(`/jabatan/${id}`, data);
  },

  // Delete jabatan
  async deleteJabatan(id) {
    return apiDelete(`/jabatan/${id}`);
  },

  // Upload Tanda Tangan Guru
  async uploadTtd(id, formData) {
    return apiPost(`/guru/${id}/ttd`, formData);
  },

  // Delete Tanda Tangan Guru
  async deleteTtd(id) {
    return apiDelete(`/guru/${id}/ttd`);
  },

  // Upload Foto Guru
  async uploadFoto(id, formData) {
    return apiPost(`/guru/${id}/foto`, formData);
  },

  // Delete Foto Guru
  async deleteFoto(id) {
    return apiDelete(`/guru/${id}/foto`);
  }
};
