/**
 * useNotifications - Hook for notifications
 * Provides data fetching and state management for notifications
 */

import { useState, useEffect, useCallback } from "react";
import * as notificationsService from "../services/notifications.service";
import type { Notification, NotificationListParams } from "../types/notifications.types";

const EMPTY_PARAMS: NotificationListParams = {};

interface UseNotificationsOptions {
  useApi?: boolean;
  initialParams?: NotificationListParams;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { useApi = false, initialParams = EMPTY_PARAMS } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (params: NotificationListParams = {}) => {
      try {
        setLoading(true);
        setError(null);
        const response = await notificationsService.getNotifications(
          { ...initialParams, ...params },
          useApi
        );
        setNotifications(response.notifications || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load notifications");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    },
    [useApi, initialParams]
  );

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsService.getUnreadCount(useApi);
      setUnreadCount(response.count || 0);
    } catch (err: any) {
      console.error("Failed to fetch unread count:", err);
    }
  }, [useApi]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        const response = await notificationsService.markNotificationAsRead(
          notificationId,
          useApi
        );
        if (response.success) {
          await fetchNotifications();
          await fetchUnreadCount();
        }
        return response;
      } catch (err: any) {
        throw err;
      }
    },
    [useApi, fetchNotifications, fetchUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationsService.markAllNotificationsAsRead(useApi);
      if (response.success) {
        await fetchNotifications();
        await fetchUnreadCount();
      }
      return response;
    } catch (err: any) {
      throw err;
    }
  }, [useApi, fetchNotifications, fetchUnreadCount]);

  /** Re-fetches notifications on every mount so navigation triggers fresh API calls. */
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};
