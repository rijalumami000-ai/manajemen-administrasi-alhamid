import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const materiSidangService = {
  async fetchMateriSidang(tahunAjaranId?: number | string | null, kategori?: string | null): Promise<any> {
    const params: string[] = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategori) params.push(`kategori=${kategori}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return apiGet(`/materi-sidang${qs}`, { noCache: true });
  },

  async fetchTahunAjaran(): Promise<any> {
    return apiGet('/tahun-ajaran', { noCache: true });
  },

  async fetchTahunOptions(): Promise<any> {
    return apiGet('/materi-sidang/tahun-options', { noCache: true });
  },

  async createMateriSidang(formData: FormData | any): Promise<any> {
    return apiPost('/materi-sidang', formData);
  },

  async updateMateriSidang(id: number | string, formData: FormData | any): Promise<any> {
    return apiPut(`/materi-sidang/${id}`, formData);
  },

  async deleteMateriSidang(id: number | string): Promise<any> {
    return apiDelete(`/materi-sidang/${id}`);
  },
};

export default materiSidangService;
