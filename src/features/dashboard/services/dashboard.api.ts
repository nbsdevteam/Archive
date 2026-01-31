/**
 * Dashboard API service
 * Delegates to adapter API layer
 */

import { adminApi } from "../../../app/adapter/api/admin.api";
import type { DashboardStats } from "../../../app/adapter/api/admin.api";

/**
 * Get dashboard stats
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return await adminApi.getDashboardStats();
};
