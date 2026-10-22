import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const guruService = {
  // Fetch all guru
  async fetchGuru(): Promise<any> {
    return apiGet('/guru', { noCache: true });
  },

  // Create new guru
  async createGuru(data: any): Promise<any> {
    return apiPost('/guru', data);
  },

  // Update guru
  async updateGuru(id: number | string, data: any): Promise<any> {
    return apiPut(`/guru/${id}`, data);
  },

  // Delete guru
  async deleteGuru(id: number | string): Promise<any> {
    return apiDelete(`/guru/${id}`);
  },

  // Fetch mata pelajaran
  async fetchMataPelajaran(): Promise<any> {
    return apiGet('/mata-pelajaran', { noCache: true });
  },

  // Create mata pelajaran
  async createMataPelajaran(data: any): Promise<any> {
    return apiPost('/mata-pelajaran', data);
  },

  // Update mata pelajaran
  async updateMataPelajaran(id: number | string, data: any): Promise<any> {
    return apiPut(`/mata-pelajaran/${id}`, data);
  },

  // Delete mata pelajaran
  async deleteMataPelajaran(id: number | string): Promise<any> {
    return apiDelete(`/mata-pelajaran/${id}`);
  },

  // Fetch jabatan
  async fetchJabatan(): Promise<any> {
    return apiGet('/jabatan', { noCache: true });
  },

  // Create jabatan
  async createJabatan(data: any): Promise<any> {
    return apiPost('/jabatan', data);
  },

  // Update jabatan
  async updateJabatan(id: number | string, data: any): Promise<any> {
    return apiPut(`/jabatan/${id}`, data);
  },

  // Delete jabatan
  async deleteJabatan(id: number | string): Promise<any> {
    return apiDelete(`/jabatan/${id}`);
  },

  // Upload Tanda Tangan Guru
  async uploadTtd(id: number | string, formData: FormData): Promise<any> {
    return apiPost(`/guru/${id}/ttd`, formData);
  },

  // Delete Tanda Tangan Guru
  async deleteTtd(id: number | string): Promise<any> {
    return apiDelete(`/guru/${id}/ttd`);
  },

  // Upload Foto Guru
  async uploadFoto(id: number | string, formData: FormData): Promise<any> {
    return apiPost(`/guru/${id}/foto`, formData);
  },

  // Delete Foto Guru
  async deleteFoto(id: number | string): Promise<any> {
    return apiDelete(`/guru/${id}/foto`);
  }
};

export default guruService;
