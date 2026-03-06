import api from './api';
import type { EmailConfig, EmailConfigUpdate, StoryEmail, StoryEmailListResponse, PaginationParams } from '../types';

export const emailService = {
  getConfig: async (): Promise<EmailConfig> => {
    const response = await api.get<EmailConfig>('/api/emails/config');
    return response.data;
  },

  updateConfig: async (data: EmailConfigUpdate): Promise<EmailConfig> => {
    const response = await api.put<EmailConfig>('/api/emails/config', data);
    return response.data;
  },

  getHistory: async (params?: PaginationParams): Promise<StoryEmailListResponse> => {
    const response = await api.get<StoryEmailListResponse>('/api/emails/history', { params });
    return response.data;
  },

  getHistoryDetail: async (id: number): Promise<StoryEmail> => {
    const response = await api.get<StoryEmail>(`/api/emails/history/${id}`);
    return response.data;
  },

  sendTestEmail: async (): Promise<{ message: string; status: string; email_id?: number }> => {
    const response = await api.post('/api/emails/test-send');
    return response.data;
  },
};
