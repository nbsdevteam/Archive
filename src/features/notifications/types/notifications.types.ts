/**
 * Notifications feature types
 * Based on API_DOCUMENTATION.md
 */

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface NotificationListParams {
  unread_only?: boolean;
  page?: number;
  per_page?: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
