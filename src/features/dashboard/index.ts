/**
 * Dashboard feature public API
 */

export * from "./hooks";
export * from "./types/dashboard.types";
// Export service layer (orchestrates API calls with static fallback)
export * from "./services/dashboard.service";
// Export API layer separately to avoid naming conflicts
export {
  getDashboardStats as apiGetDashboardStats,
} from "./services/dashboard.api";
