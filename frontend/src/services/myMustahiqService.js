import { apiGet, apiPost, apiDelete } from './apiClient';

export const myMustahiqService = {
  // Get all teachers with credentials info (Admin only)
  async fetchGurus() {
    return apiGet('/my-mustahiq/admin/gurus', { noCache: true });
  },

  // Update or set credentials for a teacher (Admin only)
  async updateCredentials(guruId, username, password) {
    return apiPost('/my-mustahiq/admin/gurus/credentials', { guruId, username, password });
  },

  // Send manual push notification (Admin only)
  async sendPushNotification(title, body, category, target) {
    return apiPost('/my-mustahiq/admin/push-notification', { title, body, category, target });
  },

  // Trigger daily schedule push notification (Admin only)
  async triggerDailySchedulePush() {
    return apiPost('/my-mustahiq/admin/trigger-scheduler');
  },

  // Fetch all suggestions (Admin only)
  async fetchSuggestions() {
    return apiGet('/my-mustahiq/admin/suggestions', { noCache: true });
  },

  // Delete a suggestion (Admin only)
  async deleteSuggestion(id) {
    return apiDelete(`/my-mustahiq/admin/suggestions/${id}`);
  }
};
