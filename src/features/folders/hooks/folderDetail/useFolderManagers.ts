import { useEffect, useState } from "react";
import { adminApi } from "@/app/adapter/api/admin.api";

export type Manager = { id: number; name: string; login?: string };

/**
 * Fetches managers for a department (e.g. for signature picker).
 */
export function useFolderManagers(departmentId: number | undefined) {
  const [managers, setManagers] = useState<Manager[]>([]);

  useEffect(() => {
    if (departmentId == null) return;
    adminApi
      .getManagers(departmentId)
      .then((r) => setManagers(r.data ?? []))
      .catch(() => setManagers([]));
  }, [departmentId]);

  return { managers };
}
