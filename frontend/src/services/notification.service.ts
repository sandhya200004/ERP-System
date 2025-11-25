import apiClient from './apiClient';

export interface Notification {
  id: string;
  userId: string;
  companyId?: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

const notificationService = {
  async getAll(unreadOnly: boolean = false): Promise<Notification[]> {
    const response = await apiClient.get('/notifications', {
      params: { unreadOnly: unreadOnly ? 'true' : 'false' },
    });
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.count;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark-all-read');
  },
};

export { notificationService };
