/**
 * useNotifications — lightweight hook for notification list and unread count.
 *
 * Lives in shared so the dashboard can show notification summary without
 * pulling the feature-notifications chunk (breaking the dashboard ↔ notifications
 * circular chunk). Uses the app adapter API only; no feature services.
 */

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "../../app/adapter/api/notifications.api";
import { queryKeys } from "../lib/queryKeys";

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

type NotificationSummary = { id: number; title: string; message: string; is_read: boolean; created_at?: string };
const EMPTY_NOTIFICATIONS: NotificationSummary[] = [];

/** Fetches notifications and unread count from adapter; used by dashboard summary. */
export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { useApi = true, initialParams = DEFAULT_PARAMS } = options;
  const params = {
    page: initialParams?.page ?? 1,
    per_page: initialParams?.per_page ?? 10,
    unread_only: initialParams?.unread_only,
  };

  const listQuery = useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationsApi.getNotifications(params),
    enabled: useApi,
  });
  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: false,
  });

  const { refetch: refetchList } = listQuery;
  const { refetch: refetchUnread } = unreadQuery;
  const fetchNotifications = useCallback(() => refetchList(), [refetchList]);
  const fetchUnreadCount = useCallback(() => refetchUnread(), [refetchUnread]);

  const data = listQuery.data?.data;
  const notifications = Array.isArray(data) ? (data as NotificationSummary[]) : EMPTY_NOTIFICATIONS;
  const unreadCount =
    unreadQuery.data?.unread_count ??
    (listQuery.data as { unread_count?: number } | undefined)?.unread_count ??
    0;
  const loading = listQuery.isLoading;
  const error = listQuery.isError
    ? listQuery.error?.message || "Failed to load notifications"
    : null;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
  };
};
