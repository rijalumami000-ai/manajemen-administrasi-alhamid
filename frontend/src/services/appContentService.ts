import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export interface AppContentQueryParams {
  section?: string;
  category?: string;
  search?: string;
}

export const appContentService = {
  getAll: async (params: AppContentQueryParams = {}): Promise<any[]> => {
    const qp = new URLSearchParams();
    if (params.section) qp.append('section', params.section);
    if (params.category) qp.append('category', params.category);
    if (params.search) qp.append('search', params.search);
    const queryString = qp.toString() ? `?${qp.toString()}` : '';
    const res = await apiGet(`/app-info${queryString}`);
    return res.data || [];
  },

  getById: async (id: number | string): Promise<any> => {
    const res = await apiGet(`/app-info/${id}`);
    return res.data;
  },

  create: async (data: any): Promise<any> => {
    const res = await apiPost('/app-info', data);
    return res.data;
  },

  update: async (id: number | string, data: any): Promise<any> => {
    const res = await apiPut(`/app-info/${id}`, data);
    return res.data;
  },

  delete: async (id: number | string): Promise<any> => {
    return await apiDelete(`/app-info/${id}`);
  }
};

export default appContentService;
