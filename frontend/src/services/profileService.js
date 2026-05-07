import { apiGet, apiPut, apiPost } from './apiClient';

export const profileService = {
  // Get current user profile
  async fetchProfile() {
    return apiGet('/profile', { noCache: true });
  },

  // Update profile
  async updateProfile(data) {
    return apiPut('/profile', data);
  },

  // Change password
  async changePassword(data) {
    return apiPost('/profile/change-password', data);
  }
};
