/**
 * useDashboard - Hook for dashboard
 * Provides dashboard stats and activities with static fallback by default
 */

import { useState, useEffect } from "react";
import { getDashboardStats, getRecentActivities } from "../services/dashboard.service";
import type { DashboardStats, DashboardActivity } from "../types/dashboard.types";

interface UseDashboardOptions {
  useApi?: boolean;
}

export const useDashboard = (options: UseDashboardOptions = {}) => {
  const { useApi = false } = options;
  const [stats, setStats] = useState<DashboardStats>({});
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, activitiesData] = await Promise.all([
          getDashboardStats(useApi),
          getRecentActivities(useApi),
        ]);
        setStats(statsData);
        setActivities(activitiesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [useApi]);

  return {
    stats,
    activities,
    loading,
    error,
  };
};
