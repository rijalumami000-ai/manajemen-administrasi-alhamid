import { apiGet, apiPut, apiPost } from './apiClient';

export const profileService = {
  // Get current user profile
  async fetchProfile(): Promise<any> {
    return apiGet('/profile', { noCache: true });
  },

  // Update profile
  async updateProfile(data: any): Promise<any> {
    return apiPut('/profile', data);
  },

  // Change password
  async changePassword(data: any): Promise<any> {
    return apiPost('/profile/change-password', data);
  },

  // Upload avatar photo
  async uploadAvatar(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('foto', file);
    return apiPost('/my-mustahiq/profile/photo', formData);
  }
};

export default profileService;
