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

/** Maximum number of cached blob URLs before the oldest entry is evicted. */
const MAX_PREVIEW_CACHE_SIZE = 20;

/** In-memory cache mapping composite key → blob URL. Survives component unmount/remount. */
const previewCache = new Map<string, string>();

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
    const oldUrl = previewCache.get(oldestKey);
    if (oldUrl) window.URL.revokeObjectURL(oldUrl);
    previewCache.delete(oldestKey);
  }
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

    // Serve from cache if already downloaded — skip the network request entirely
    const cached = previewCache.get(cacheKey);
    if (cached) {
      setBlobUrl(cached);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadFile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const blob =
          attachmentId != null
            ? await documentsApi.getAttachmentForPreview(documentId, attachmentId, fileName)
            : await documentsApi.getDocumentForPreview(documentId, versionId, fileName);

        if (isCancelled) return;

        const url = window.URL.createObjectURL(blob);

        // Store in cache so subsequent mounts skip the download
        previewCache.set(cacheKey, url);
        evictOldestIfNeeded();

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
  }, [documentId, versionId, attachmentId, fileName, isPreviewable, errorMessage]);

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
