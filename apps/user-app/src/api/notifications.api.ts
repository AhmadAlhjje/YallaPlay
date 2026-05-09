import { apiClient } from './client';

export const notificationsApi = {
  getInbox: (page = 1) =>
    apiClient.get<{ data: { notifications: any[]; unreadCount: number; pagination: any } }>(
      '/notifications',
      { params: { page } },
    ),

  markAllRead: () =>
    apiClient.patch('/notifications/read-all'),

  markOneRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),
};
