/**
 * Notifications Service Layer
 * Orchestrates API calls and provides static data fallback
 */

import * as notificationsApi from "./notifications.api";
import type {
  Notification,
  NotificationListParams,
  NotificationListResponse,
} from "../types/notifications.types";

/**
 * Get notifications (with static fallback)
 */
export const getNotifications = async (
  params: NotificationListParams = {},
  useApi: boolean = false
): Promise<NotificationListResponse> => {
  if (useApi) {
    return notificationsApi.listNotifications(params);
  }

  // Static mock data
  return {
    notifications: [
      {
        id: 1,
        user_id: 1,
        type: "document_uploaded",
        title: "New document uploaded",
        message: "Invoice_2024_Q1.xlsx was uploaded",
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        user_id: 1,
        type: "edit_request_approved",
        title: "Edit request approved",
        message: "Your edit request for Service_Agreement.pdf was approved",
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 3,
        user_id: 1,
        type: "folder_created",
        title: "Folder created",
        message: "New folder 'Legal / 2024' was created",
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  };
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: number,
  useApi: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  if (useApi) {
    return notificationsApi.markNotificationAsRead(notificationId);
  }

  // Static mock response
  return { success: true };
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (
  useApi: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  if (useApi) {
    return notificationsApi.markAllNotificationsAsRead();
  }

  // Static mock response
  return { success: true };
};

/**
 * Get unread count
 */
export const getUnreadCount = async (
  useApi: boolean = false
): Promise<{ count: number; error?: string }> => {
  if (useApi) {
    return notificationsApi.getUnreadCount();
  }

  // Static mock response
  return { count: 2 };
};
