import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const appContentService = {
  getAll: async (params = {}) => {
    const qp = new URLSearchParams();
    if (params.section) qp.append('section', params.section);
    if (params.category) qp.append('category', params.category);
    if (params.search) qp.append('search', params.search);
    const queryString = qp.toString() ? `?${qp.toString()}` : '';
    const res = await apiGet(`/app-info${queryString}`);
    return res.data || [];
  },

  getById: async (id) => {
    const res = await apiGet(`/app-info/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await apiPost('/app-info', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiPut(`/app-info/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    return await apiDelete(`/app-info/${id}`);
  }
};
