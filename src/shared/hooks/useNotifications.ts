/**
 * useNotifications — lightweight hook for notification list and unread count.
 *
 * Lives in shared so the dashboard can show notification summary without
 * pulling the feature-notifications chunk (breaking the dashboard ↔ notifications
 * circular chunk). Uses the app adapter API only; no feature services.
 */

import { useState, useEffect, useCallback } from "react";
import { notificationsApi } from "../../app/adapter/api/notifications.api";

interface NotificationParams {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
}

interface UseNotificationsOptions {
  useApi?: boolean;
  initialParams?: NotificationParams;
}

const DEFAULT_PARAMS: NotificationParams = { page: 1, per_page: 10 };

/** Fetches notifications and unread count from adapter; used by dashboard summary. */
export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { useApi = true, initialParams = DEFAULT_PARAMS } = options;
  const [notifications, setNotifications] = useState<
    Array<{ id: number; title: string; message: string; is_read: boolean; created_at?: string }>
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!useApi) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await notificationsApi.getNotifications({
        page: initialParams?.page ?? 1,
        per_page: initialParams?.per_page ?? 10,
        unread_only: initialParams?.unread_only,
      });
      const data = res?.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
      const count = (res as { unread_count?: number })?.unread_count ?? 0;
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [useApi, initialParams?.page, initialParams?.per_page, initialParams?.unread_only]);

  const fetchUnreadCount = useCallback(async () => {
    if (!useApi) return;
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res?.unread_count ?? 0);
    } catch {
      // ignore
    }
  }, [useApi]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
  };
};
