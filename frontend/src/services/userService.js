import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const userService = {
  // Get all users (admin only)
  async fetchUsers() {
    return apiGet('/users', { noCache: true });
  },

  // Get single user (admin only)
  async fetchUser(id) {
    return apiGet(`/users/${id}`);
  },

  // Create user (admin only)
  async createUser(data) {
    return apiPost('/users', data);
  },

  // Update user (admin only)
  async updateUser(id, data) {
    return apiPut(`/users/${id}`, data);
  },

  // Deactivate user (soft delete)
  async deactivateUser(id) {
    return apiDelete(`/users/${id}`);
  },

  // Activate user
  async activateUser(id) {
    return apiPost(`/users/${id}/activate`, {});
  },

  // Delete user permanently (admin only)
  async deleteUser(id) {
    return apiDelete(`/users/${id}/hard`);
  }
};
