import { useEffect, useState, useMemo } from 'react';
import { documentsApi } from '../../../app/adapter/api/documents.api';
import { Spinner } from '../ui/Spinner';
import styles from './FilePreview.module.css';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
const PDF_EXTENSION = 'pdf';

// ─── In-memory blob URL cache ──────────────────────────────────────────────
// Keeps blob URLs in memory so the same file is only requested once per session.
// - Cache key: `${documentId}-${versionId}-${attachmentId}`
// - Stores blob URL + version metadata for automatic invalidation
// - Evicts oldest entry when MAX_PREVIEW_CACHE_SIZE is exceeded
//
// Persistence across full page reloads is handled in the API layer (Cache API in
// documents/preview.ts getDocumentForPreview / getAttachmentForPreview).
//
// ─── Version-based cache invalidation ───────────────────────────────────────
// When a new file version is uploaded, the cache key changes automatically,
// ensuring users always see the most recent file after upload without manual refresh.

/** Maximum number of cached blob URLs before the oldest entry is evicted. */
const MAX_PREVIEW_CACHE_SIZE = 20;

/** 
 * Cache metadata structure to track version information and blob URL.
 * This allows us to invalidate cache when a new version is uploaded.
 */
interface CacheMetadata {
  blobUrl: string;
  latestVersionId?: number;
  timestamp: number;
}

/** In-memory cache that stores blob URLs with version metadata for automatic invalidation */
const previewCache = new Map<string, CacheMetadata>();

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
  if (previewCache.size <= MAX_PREVIEW_CACHE_SIZE) return;
  
  const oldestKey = previewCache.keys().next().value;
  if (oldestKey != null) {
    const metadata = previewCache.get(oldestKey);
    if (metadata?.blobUrl) window.URL.revokeObjectURL(metadata.blobUrl);
    previewCache.delete(oldestKey);
  }
}

/**
 * Invalidates cache entry for a specific document when a new version is detected.
 * Revokes the blob URL to free memory.
 */
function invalidateCache(cacheKey: string): void {
  const cachedMetadata = previewCache.get(cacheKey);
  if (cachedMetadata?.blobUrl) {
    window.URL.revokeObjectURL(cachedMetadata.blobUrl);
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
  /** 
   * Version ID to preview. When provided, downloads that specific version.
   * When omitted, downloads the current/latest version from the server.
   * Cache key includes version ID, so different versions are cached separately.
   */
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
  /** When true, always fetch from network and skip local preview caching. */
  disableCache?: boolean;
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
  disableCache = false,
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

    // Simple key-value cache: key = documentId-versionId-attachmentId
    // If version changes, the key changes = automatic cache miss = re-download
    const cacheKey = buildPreviewCacheKey(documentId, versionId, attachmentId);

    if (!disableCache) {
      // Check if we have this exact version cached (simple key-value lookup)
      const cachedMetadata = previewCache.get(cacheKey);
      if (cachedMetadata) {
        setBlobUrl(cachedMetadata.blobUrl);
        setIsLoading(false);
        return;
      }
    }

    let isCancelled = false;

    const loadFile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const blob =
          attachmentId != null
            ? await documentsApi.getAttachmentForPreview(documentId, attachmentId, fileName)
            : await documentsApi.getDocumentForPreview(documentId, versionId, fileName, !disableCache);

        if (isCancelled) return;

        const url = window.URL.createObjectURL(blob);

        // Store in cache with the specific version ID as part of the key.
        if (!disableCache) {
          previewCache.set(cacheKey, {
            blobUrl: url,
            latestVersionId: versionId,
            timestamp: Date.now(),
          });
          evictOldestIfNeeded();
        }
        setBlobUrl(url);
        setIsLoading(false);
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load file for preview';
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
  }, [documentId, versionId, attachmentId, fileName, isPreviewable, errorMessage, disableCache]);

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
