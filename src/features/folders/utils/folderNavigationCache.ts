/**
 * Cache for folder navigation state (company info, etc.) in localStorage.
 * Persists across page reloads so company field remains prefilled.
 */

export interface CachedFolderInfo {
  id: number;
  name?: string;
  code?: string;
  company_id?: number;
  company_name?: string;
  department_id?: number;
  cached_at: number; // timestamp
}

const CACHE_KEY_PREFIX = "folder_nav_cache_";
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Saves folder info to localStorage keyed by folder ID.
 */
export function saveFolderToCache(folderInfo: Omit<CachedFolderInfo, "cached_at">): void {
  try {
    const cached: CachedFolderInfo = {
      ...folderInfo,
      cached_at: Date.now(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${folderInfo.id}`, JSON.stringify(cached));
    
    if (import.meta.env.DEV) {
      console.log("[folderNavigationCache] Saved to localStorage:", cached);
    }
  } catch (error) {
    console.error("[folderNavigationCache] Failed to save:", error);
  }
}

/**
 * Retrieves folder info from localStorage by folder ID.
 * Returns null if not found or expired.
 */
export function getFolderFromCache(folderId: number): Omit<CachedFolderInfo, "cached_at"> | null {
  try {
    const key = `${CACHE_KEY_PREFIX}${folderId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    const cached: CachedFolderInfo = JSON.parse(raw);
    const age = Date.now() - cached.cached_at;
    
    // Check if expired
    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      if (import.meta.env.DEV) {
        console.log("[folderNavigationCache] Cache expired for folder", folderId);
      }
      return null;
    }
    
    if (import.meta.env.DEV) {
      console.log("[folderNavigationCache] Retrieved from localStorage:", cached);
    }
    
    // Return without cached_at timestamp
    const { cached_at, ...folderInfo } = cached;
    return folderInfo;
  } catch (error) {
    console.error("[folderNavigationCache] Failed to retrieve:", error);
    return null;
  }
}

/**
 * Clears cache for a specific folder ID.
 */
export function clearFolderFromCache(folderId: number): void {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${folderId}`);
  } catch (error) {
    console.error("[folderNavigationCache] Failed to clear:", error);
  }
}

/**
 * Clears all folder navigation caches (e.g., on logout).
 */
export function clearAllFolderCaches(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    if (import.meta.env.DEV) {
      console.log("[folderNavigationCache] Cleared all folder caches");
    }
  } catch (error) {
    console.error("[folderNavigationCache] Failed to clear all:", error);
  }
}
