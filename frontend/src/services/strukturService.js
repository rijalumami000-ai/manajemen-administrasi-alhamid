import { apiGet, apiPost, apiDelete } from './apiClient';

export const strukturService = {
  // Fetch structure cards by type
  async fetchStruktur(tipe) {
    return apiGet(`/struktur/${tipe}`, { noCache: true });
  },

  // Update a structure position assignment
  async updateStruktur(data) {
    return apiPost('/struktur', data);
  },

  // Add a new structure card (for multiple roles like TU)
  async addStruktur(data) {
    return apiPost('/struktur/add', data);
  },

  // Delete a structure card by ID
  async deleteStruktur(id) {
    return apiDelete(`/struktur/${id}`);
  },

  // Reset all assignments for a structure type
  async resetStruktur(tipe) {
    return apiPost('/struktur/reset', { tipe });
  }
};
