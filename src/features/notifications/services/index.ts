/**
 * Notifications Services Public API
 */

// Export API functions
export * from "./notifications.api";

// Export service functions with explicit names to avoid conflicts
export {
  getNotifications,
  markNotificationAsRead as markNotificationAsReadService,
  markAllNotificationsAsRead as markAllNotificationsAsReadService,
  getUnreadCount as getUnreadCountService,
} from "./notifications.service";
