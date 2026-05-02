import { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getFolderFromCache } from "../../utils/folderNavigationCache";

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
 * Also reads prefetched folder info from:
 * 1. Navigation state (when navigating from folders list)
 * 2. localStorage cache (when page is reloaded)
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
    const folderFromNav = state?.prefetchedFolder;
    
    // First try navigation state (fresh navigation)
    if (folderFromNav) {
      if (import.meta.env.DEV) {
        console.log("[useFolderDetailIds] Using folder from navigation state:", folderFromNav);
      }
      return folderFromNav;
    }
    
    // Fallback to localStorage cache (page reload)
    if (folderId != null) {
      const folderFromCache = getFolderFromCache(folderId);
      if (folderFromCache) {
        if (import.meta.env.DEV) {
          console.log("[useFolderDetailIds] Using folder from localStorage cache:", folderFromCache);
        }
        return folderFromCache;
      }
    }
    
    if (import.meta.env.DEV && folderId != null) {
      console.log("[useFolderDetailIds] No prefetched folder data available (not in nav state or cache)");
    }
    
    return null;
  }, [location.state, folderId]);
  
  return { folderId, prefetchedFolder };
}
