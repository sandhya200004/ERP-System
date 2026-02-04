import api from './api';

export interface Settings {
  id?: number;
  appName?: string;
  language?: string;
  country?: string;
  dateFormat?: string;
  timezone?: string;
  currency?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
}

export const settingsService = {
  getSettings: async (): Promise<Settings> => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (settings: Settings): Promise<any> => {
    const response = await api.put('/settings', settings);
    return response.data;
  },

  testEmail: async (toEmail: string, settings?: Settings): Promise<any> => {
    const response = await api.post('/settings/email/test', { toEmail, settings });
    return response.data;
  },
};
