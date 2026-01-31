import { useEffect, useState, useMemo } from 'react';
import { documentsApi } from '../../../app/adapter/api/documents.api';
import { Spinner } from '../ui/Spinner';
import styles from './FilePreview.module.css';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
const PDF_EXTENSION = 'pdf';

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

    let blobUrlToRevoke: string | null = null;
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
        blobUrlToRevoke = url;
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

    return () => {
      isCancelled = true;
      if (blobUrlToRevoke) {
        window.URL.revokeObjectURL(blobUrlToRevoke);
      }
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
