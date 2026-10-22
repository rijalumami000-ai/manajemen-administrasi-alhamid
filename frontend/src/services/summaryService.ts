import { apiGet } from './apiClient';
import { SummaryData } from '../types/dashboard';

export const summaryService = {
  getSummary: async (): Promise<SummaryData> => {
    return apiGet('/summary');
  }
};
