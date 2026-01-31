/**
 * Notifications API module
 * Direct API calls based on API_DOCUMENTATION.md
 * All endpoints use JSON-RPC 2.0
 */

import { jsonRpcRequest } from "../../../shared/lib/http";
import type {
  Notification,
  NotificationListParams,
  NotificationListResponse,
} from "../types/notifications.types";

/**
 * List notifications
 * POST /api/notifications (type=jsonrpc)
 */
export const listNotifications = async (
  params: NotificationListParams = {}
): Promise<NotificationListResponse> => {
  const result = await jsonRpcRequest<NotificationListResponse>(
    "/api/notifications",
    {
      unread_only: params.unread_only || false,
      page: params.page || 1,
      per_page: params.per_page || 20,
    }
  );

  // Handle different response shapes
  if (Array.isArray(result)) {
    return { notifications: result as Notification[] };
  }
  if (typeof result === "object" && "notifications" in result) {
    return result as NotificationListResponse;
  }
  return { notifications: [] };
};

/**
 * Mark notification as read
 * POST /api/notifications/<notification_id>/mark-read (type=jsonrpc)
 */
export const markNotificationAsRead = async (
  notificationId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    await jsonRpcRequest(
      `/api/notifications/${notificationId}/mark-read`,
      {}
    );

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to mark notification as read",
    };
  }
};

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read (type=jsonrpc)
 */
export const markAllNotificationsAsRead = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await jsonRpcRequest(
      "/api/notifications/mark-all-read",
      {}
    );

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to mark all notifications as read",
    };
  }
};

/**
 * Get unread count
 * POST /api/notifications/unread-count (type=jsonrpc)
 */
export const getUnreadCount = async (): Promise<{ count: number; error?: string }> => {
  try {
    const result = await jsonRpcRequest<{ count: number }>(
      "/api/notifications/unread-count",
      {}
    );

    const r = result as { count?: number; unread_count?: number } | undefined;
    return {
      count: r?.count ?? r?.unread_count ?? 0,
    };
  } catch (error: any) {
    return {
      count: 0,
      error: error?.message || "Failed to get unread count",
    };
  }
};
