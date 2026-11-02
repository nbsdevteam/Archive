import { create } from 'zustand';
import { notificationsApi, Notification } from '../../../app/adapter/api/notifications.api';
import { handleApiError } from '../../../app/adapter/api/client';
import { queryClient } from '../../../shared/lib/queryClient';
import { queryKeys } from '../../../shared/lib/queryKeys';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoading: true, error: null });

    try {
      const params = { unread_only: unreadOnly, per_page: 50 };
      const response = await queryClient.fetchQuery({
        queryKey: queryKeys.notifications.list(params),
        queryFn: () => notificationsApi.getNotifications(params),
      });

      const list = Array.isArray(response?.data) ? response.data : [];
      set({
        notifications: list,
        unreadCount: response.unread_count ?? 0,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: handleApiError(error),
        notifications: [],
        isLoading: false,
      });
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // Update local state
      const notifications = get().notifications.map((notif) =>
        notif.id === id ? { ...notif, is_read: true } : notif
      );

      const unreadCount = notifications.filter((n) => !n.is_read).length;

      set({ notifications, unreadCount });
    } catch (error) {
      set({ error: handleApiError(error) });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllAsRead();
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // Update local state
      const notifications = get().notifications.map((notif) => ({
        ...notif,
        is_read: true,
      }));

      set({ notifications, unreadCount: 0 });
    } catch (error) {
      set({ error: handleApiError(error) });
    }
  },

  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications];
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    set({ notifications, unreadCount });
  },

  clearError: () => set({ error: null }),
}));
