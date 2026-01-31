/**
 * useArchiveActivity - Hook for archive activity
 * Provides activity log data with static fallback by default
 */

import { useState, useEffect } from "react";

interface Activity {
  action: string;
  item: string;
  when: string;
}

interface UseArchiveActivityOptions {
  useApi?: boolean;
}

// Static mock data
const staticActivities: Activity[] = [
  { action: "Uploaded", item: "Project-Alpha.pdf", when: "5 mins ago" },
  { action: "Created folder", item: "Legal / 2024", when: "30 mins ago" },
  { action: "Updated", item: "Invoice_2024_Q1.xlsx", when: "2 hrs ago" },
  { action: "Deleted", item: "Draft_Contract.docx", when: "Yesterday" },
];

export const useArchiveActivity = (options: UseArchiveActivityOptions = {}) => {
  const { useApi = false } = options;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        if (useApi) {
          // TODO: Implement API call for activity log
          setActivities(staticActivities);
        } else {
          setActivities(staticActivities);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load activities");
        setActivities(staticActivities);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [useApi]);

  const exportActivities = async () => {
    // TODO: Implement export API call when useApi is true
    console.log("Export activities");
  };

  return {
    activities,
    loading,
    error,
    exportActivities,
  };
};
