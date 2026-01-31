import apiClient from './client';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type?: string;
  notification_type?: string;
  is_read: boolean;
  created_at?: string;
  created_date?: string;
  related_document_id?: number;
  related_document_title?: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  unread_count: number;
  pagination?: {
    total: number;
    page: number;
    per_page: number;
  };
}

export const notificationsApi = {
  /**
   * Get notifications
   */
  getNotifications: async (params?: {
    unread_only?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<NotificationsResponse> => {
    const response = await apiClient.post('/api/notifications', {
      jsonrpc: '2.0',
      method: 'call',
      params: params || {},
    });
    return response.data.result || response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: number): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/api/notifications/${id}/mark-read`, {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
    });
    return response.data.result || response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post('/api/notifications/mark-all-read', {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
    });
    return response.data.result || response.data;
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<{ success: boolean; unread_count: number }> => {
    const response = await apiClient.post('/api/notifications/unread-count', {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
    });
    return response.data.result || response.data;
  },
};
