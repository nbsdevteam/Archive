import { useEffect, useRef, useState } from "react";
import { all_routes } from "../../../router/all_routes";
import { useNotificationStore } from "../stores/notificationStore";

export const useNotificationsPageContainer = () => {
  const routes = all_routes;
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearError,
  } = useNotificationStore();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const didRunRef = useRef(false);
  const lastFilterRef = useRef<"all" | "unread" | null>(null);

  useEffect(() => {
    if (didRunRef.current && lastFilterRef.current === filter) return;
    didRunRef.current = true;
    lastFilterRef.current = filter;
    fetchNotifications(filter === "unread");
    return () => {
      setTimeout(() => {
        didRunRef.current = false;
      }, 0);
    };
  }, [filter, fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleRetry = () => {
    clearError();
    fetchNotifications(filter === "unread");
  };

  return {
    routes,
    notifications,
    unreadCount,
    isLoading,
    error,
    filter,
    setFilter,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleRetry,
  };
};
