/**
 * Dashboard service layer
 * Orchestrates API calls and provides feature-level business logic
 * Can fall back to static data when useApi is false
 */

import * as dashboardApi from "./dashboard.api";
import type { DashboardStats, DashboardActivity } from "../types/dashboard.types";

/**
 * Static mock data (current implementation)
 */
const staticDashboardStats: DashboardStats = {
  total_documents: 1248,
  total_folders: 214,
  archived_documents: 156,
  active_documents: 1092,
  storage_used: "3.7 TB",
  recent_uploads: 24,
  pending_approvals: 8,
};

const staticActivities: DashboardActivity[] = [
  { action: "Uploaded", item: "Project-Alpha.pdf", when: "5 mins ago", type: "document" },
  { action: "Created folder", item: "Legal / 2024", when: "30 mins ago", type: "folder" },
  { action: "Updated", item: "Invoice_2024_Q1.xlsx", when: "2 hrs ago", type: "document" },
  { action: "Archived", item: "Old_Policy_2019.pdf", when: "Yesterday", type: "document" },
];

/**
 * Get dashboard statistics
 * @param useApi - Whether to use API (default: false for static fallback)
 */
export const getDashboardStats = async (
  useApi: boolean = false
): Promise<DashboardStats> => {
  if (useApi) {
    try {
      const raw = await dashboardApi.getDashboardStats();
      const stats = (raw as { stats?: Record<string, unknown> }).stats;
      return stats ? ({ ...stats } as DashboardStats) : staticDashboardStats;
    } catch (error) {
      console.error("Failed to fetch dashboard stats from API:", error);
      return staticDashboardStats;
    }
  }
  return staticDashboardStats;
};

/**
 * Get recent activities
 * @param useApi - Whether to use API (default: false)
 */
export const getRecentActivities = async (
  useApi: boolean = false
): Promise<DashboardActivity[]> => {
  if (useApi) {
    try {
      // TODO: Implement API call for activities when endpoint is available
      return staticActivities;
    } catch (error) {
      console.error("Failed to fetch activities from API:", error);
      return staticActivities;
    }
  }
  return staticActivities;
};
