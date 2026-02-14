import { useEffect, useState, useMemo } from 'react';
import { documentsApi } from '../../../app/adapter/api/documents.api';
import { Spinner } from '../ui/Spinner';
import styles from './FilePreview.module.css';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
const PDF_EXTENSION = 'pdf';

// ─── Module-level blob URL cache ────────────────────────────────────────────
// Keeps blob URLs in memory so the same file is only requested once per session.
// Persistence across full page reloads is handled in the API layer (Cache API in
// documents.api getDocumentForPreview / getAttachmentForPreview).
//
// ─── Version-based cache invalidation ───────────────────────────────────────
// When a new file version is uploaded, the cache is automatically invalidated:
// 1. Parent component passes `latestVersionId` from version history (first item)
// 2. FilePreview compares cached version ID with the latest version ID
// 3. If they differ, cache is invalidated and file is re-downloaded
// 4. New preview is cached with the latest version ID for future comparisons
//
// This ensures users always see the most recent file after upload without manual refresh.

/** Maximum number of cached blob URLs before the oldest entry is evicted. */
const MAX_PREVIEW_CACHE_SIZE = 20;

/** Legacy cache for backward compatibility - will be migrated to enhancedPreviewCache */
const previewCache = new Map<string, string>();

/** 
 * Cache metadata structure to track version information 
 * This allows us to invalidate cache when a new version is uploaded
 */
interface CacheMetadata {
  blobUrl: string;
  latestVersionId?: number;
  timestamp: number;
}

/** Enhanced cache that stores both blob URL and version metadata */
const enhancedPreviewCache = new Map<string, CacheMetadata>();

/** Builds a unique cache key from the preview identifiers. */
function buildPreviewCacheKey(
  documentId: number,
  versionId?: number,
  attachmentId?: number,
): string {
  return `${documentId}-${versionId ?? 'latest'}-${attachmentId ?? 'none'}`;
}

/** Evicts the oldest cache entry (first inserted) and revokes its blob URL to prevent memory leaks. */
function evictOldestIfNeeded(): void {
  const totalSize = previewCache.size + enhancedPreviewCache.size;
  if (totalSize <= MAX_PREVIEW_CACHE_SIZE) return;
  
  // Try to evict from legacy cache first
  if (previewCache.size > 0) {
    const oldestKey = previewCache.keys().next().value;
    if (oldestKey != null) {
      const oldUrl = previewCache.get(oldestKey);
      if (oldUrl) window.URL.revokeObjectURL(oldUrl);
      previewCache.delete(oldestKey);
    }
  } else if (enhancedPreviewCache.size > 0) {
    const oldestKey = enhancedPreviewCache.keys().next().value;
    if (oldestKey != null) {
      const metadata = enhancedPreviewCache.get(oldestKey);
      if (metadata?.blobUrl) window.URL.revokeObjectURL(metadata.blobUrl);
      enhancedPreviewCache.delete(oldestKey);
    }
  }
}

/**
 * Checks if the cached preview is outdated by comparing version IDs.
 * Returns true if cache should be invalidated and re-downloaded.
 */
function isCacheStale(
  cacheKey: string,
  latestVersionId?: number,
): boolean {
  const cached = enhancedPreviewCache.get(cacheKey);
  if (!cached) return false;
  
  // If we have version information from both cache and latest, compare them
  if (latestVersionId != null && cached.latestVersionId != null) {
    const isStale = cached.latestVersionId !== latestVersionId;
    if (isStale) {
      console.log(`[isCacheStale] Version mismatch - cached: ${cached.latestVersionId}, latest: ${latestVersionId}`);
    }
    return isStale;
  }
  
  // If we have a new latestVersionId but cache doesn't have one, consider it stale
  if (latestVersionId != null && cached.latestVersionId == null) {
    console.log(`[isCacheStale] Cache has no version info but latest version is ${latestVersionId}, considering stale`);
    return true;
  }
  
  return false;
}

/**
 * Invalidates cache entry for a specific document when a new version is detected.
 * Revokes the blob URL to free memory.
 */
function invalidateCache(cacheKey: string): void {
  const cachedMetadata = enhancedPreviewCache.get(cacheKey);
  if (cachedMetadata?.blobUrl) {
    window.URL.revokeObjectURL(cachedMetadata.blobUrl);
    enhancedPreviewCache.delete(cacheKey);
  }
  
  // Also check legacy cache
  const legacyUrl = previewCache.get(cacheKey);
  if (legacyUrl) {
    window.URL.revokeObjectURL(legacyUrl);
    previewCache.delete(cacheKey);
  }
}

/**
 * Public utility function to manually clear preview cache for a specific document.
 * Useful when you need to force a re-download (e.g., after uploading a new version).
 * 
 * @param documentId - The document ID
 * @param versionId - Optional specific version ID
 * @param attachmentId - Optional attachment ID
 * 
 * @example
 * ```ts
 * // Clear cache for latest version of document 123
 * clearPreviewCache(123);
 * 
 * // Clear cache for specific version
 * clearPreviewCache(123, 456);
 * 
 * // Clear cache for attachment
 * clearPreviewCache(123, undefined, 789);
 * ```
 */
export function clearPreviewCache(
  documentId: number,
  versionId?: number,
  attachmentId?: number,
): void {
  const cacheKey = buildPreviewCacheKey(documentId, versionId, attachmentId);
  invalidateCache(cacheKey);
}

// ─── Component ──────────────────────────────────────────────────────────────

export interface FilePreviewProps {
  documentId: number;
  versionId?: number;
  /** When set, preview is loaded via attachment endpoint instead of document version. */
  attachmentId?: number;
  fileName: string;
  className?: string;
  maxHeight?: string | number;
  /** Optional i18n message when file type is not previewable */
  notPreviewableMessage?: string;
  /** Optional i18n message for load error */
  errorMessage?: string;
  /**
   * The latest version ID from version history. Used to detect when a new version
   * has been uploaded and cache should be invalidated.
   */
  latestVersionId?: number;
}

export function FilePreview({
  documentId,
  versionId,
  attachmentId,
  fileName,
  className = '',
  maxHeight = '600px',
  notPreviewableMessage = 'Preview not available for this file type',
  errorMessage,
  latestVersionId,
}: FilePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileExt = useMemo(() => (fileName.split('.').pop() || '').toLowerCase(), [fileName]);
  const isImage = useMemo(() => IMAGE_EXTENSIONS.includes(fileExt), [fileExt]);
  const isPdf = useMemo(() => fileExt === PDF_EXTENSION, [fileExt]);
  const isPreviewable = useMemo(() => isImage || isPdf, [isImage, isPdf]);

  useEffect(() => {
    if (!isPreviewable || !documentId) {
      setIsLoading(false);
      return;
    }
    if (attachmentId != null && attachmentId <= 0) {
      setIsLoading(false);
      return;
    }

    const cacheKey = buildPreviewCacheKey(documentId, versionId, attachmentId);

    // Check if cache exists and if it's stale (new version uploaded)
    const isStale = isCacheStale(cacheKey, latestVersionId);
    if (isStale) {
      // Invalidate stale cache - new version detected from version history
      console.log(`[FilePreview] Cache stale detected for document ${documentId}, invalidating and re-downloading`);
      invalidateCache(cacheKey);
    }

    // Serve from enhanced cache if already downloaded and not stale
    const cachedMetadata = enhancedPreviewCache.get(cacheKey);
    if (cachedMetadata && !isStale) {
      console.log(`[FilePreview] Serving from cache for document ${documentId}, version ${cachedMetadata.latestVersionId}`);
      setBlobUrl(cachedMetadata.blobUrl);
      setIsLoading(false);
      return;
    }

    // Fallback to legacy cache for backward compatibility
    const legacyCached = previewCache.get(cacheKey);
    if (legacyCached && !isStale) {
      console.log(`[FilePreview] Serving from legacy cache for document ${documentId}`);
      setBlobUrl(legacyCached);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadFile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log(`[FilePreview] Downloading preview for document ${documentId}, latest version ${latestVersionId}`);

        const blob =
          attachmentId != null
            ? await documentsApi.getAttachmentForPreview(documentId, attachmentId, fileName)
            : await documentsApi.getDocumentForPreview(documentId, versionId, fileName);

        if (isCancelled) return;

        const url = window.URL.createObjectURL(blob);

        // Store in enhanced cache with version metadata for future validation
        enhancedPreviewCache.set(cacheKey, {
          blobUrl: url,
          latestVersionId: latestVersionId,
          timestamp: Date.now(),
        });
        evictOldestIfNeeded();

        console.log(`[FilePreview] Cached preview for document ${documentId}, version ${latestVersionId}`);
        setBlobUrl(url);
        setIsLoading(false);
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load file for preview';
          console.error(`[FilePreview] Error loading preview for document ${documentId}:`, err);
          setError(errorMessage ?? msg);
          setIsLoading(false);
        }
      }
    };

    loadFile();

    // Cleanup only cancels in-flight requests; blob URLs are owned by the cache
    // and revoked only on eviction, not on component unmount.
    return () => {
      isCancelled = true;
    };
  }, [documentId, versionId, attachmentId, fileName, isPreviewable, errorMessage, latestVersionId]);

  if (!isPreviewable) {
    return (
      <div
        className={`${styles.notPreviewable} ${className}`}
        style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
      >
        <span className="text-muted">
          {notPreviewableMessage} ({fileExt || 'unknown'})
        </span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`${styles.loading} ${className}`}
        style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
      >
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${styles.error} ${className}`}
        style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
      >
        <span className="text-danger">{error}</span>
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div
        className={`${styles.notPreviewable} ${className}`}
        style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
      >
        <span className="text-muted">No preview available</span>
      </div>
    );
  }

  const containerStyle = { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight };

  return (
    <div className={`${styles.root} ${className}`} style={containerStyle}>
      {isImage && (
        <img
          src={blobUrl}
          alt={fileName}
          className={styles.image}
          style={containerStyle}
        />
      )}
      {isPdf && (
        <iframe
          src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          title={fileName}
          className={styles.iframe}
          style={containerStyle}
        />
      )}
    </div>
  );
}
