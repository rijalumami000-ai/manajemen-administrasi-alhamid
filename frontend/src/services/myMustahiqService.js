import { apiGet, apiPost } from './apiClient';

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
  }
};
