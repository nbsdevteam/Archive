import { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";

export interface PrefetchedFolderFromNav {
  id: number;
  name?: string;
  code?: string;
  company_id?: number;
  company_name?: string;
  department_id?: number;
}

/**
 * Parses and validates folder id from route params.
 * Also reads prefetched folder info from navigation state (company_id, company_name, etc.).
 * Returns null if the id is missing or not a valid number.
 */
export function useFolderDetailIds() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  
  const folderId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);
  
  const prefetchedFolder = useMemo(() => {
    const state = location.state as { prefetchedFolder?: PrefetchedFolderFromNav } | null;
    const folder = state?.prefetchedFolder;
    
    if (import.meta.env.DEV && folder) {
      console.log("[useFolderDetailIds] Prefetched folder from navigation:", folder);
    }
    
    return folder ?? null;
  }, [location.state]);
  
  return { folderId, prefetchedFolder };
}
