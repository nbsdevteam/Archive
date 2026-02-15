/** Preview and download operations for documents */

import { inferPreviewContentType } from './utils';

/** Cache name for document/attachment preview blobs; survives full page reload. */
const PREVIEW_CACHE_NAME = 'nbs-document-previews';

/**
 * Returns a Response from the Cache API if present, otherwise fetches, stores in cache, and returns.
 * Uses the request URL as cache key so reloads reuse the same preview without hitting the API.
 */
async function getCachedOrFetchPreview(fullUrl: string, fetchOptions: RequestInit): Promise<Response> {
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(PREVIEW_CACHE_NAME);
      const cached = await cache.match(fullUrl);
      if (cached) return cached;
    } catch {
      // Cache API unavailable (e.g. private mode); fall through to fetch.
    }
  }
  const response = await fetch(fullUrl, fetchOptions);
  if (response.ok && typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(PREVIEW_CACHE_NAME);
      await cache.put(new Request(fullUrl), response.clone());
    } catch {
      // Ignore cache write failures.
    }
  }
  return response;
}

/**
 * Clears all cached preview entries for a specific document from the Cache API.
 * This ensures the latest version is fetched when returning to the document detail page.
 * @param documentId - The document ID to clear cache for
 */
export async function clearDocumentPreviewCache(documentId: number): Promise<void> {
  if (typeof caches === 'undefined') return;
  
  try {
    const cache = await caches.open(PREVIEW_CACHE_NAME);
    
    // Get all cached requests and delete ones matching this document ID
    const requests = await cache.keys();
    const deletePromises = requests
      .filter((request) => {
        const url = request.url;
        return url.includes(`/documents/${documentId}/download`);
      })
      .map((request) => cache.delete(request));
    
    await Promise.all(deletePromises);
  } catch (error) {
    // Silently fail if cache clearing fails
    console.warn('Failed to clear document preview cache:', error);
  }
}

/**
 * Download document or specific version.
 */
export async function downloadDocument(documentId: number, versionId?: number): Promise<Blob> {
  const apiClient = (await import('../client')).default;
  const url = versionId
    ? `/api/documents/${documentId}/download?version_id=${versionId}`
    : `/api/documents/${documentId}/download`;
  
  const response = await apiClient.get(url, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Get document blob for preview (doesn't trigger download).
 * Uses fetch + Cache API so previews survive full page reloads; in-memory cache in
 * FilePreview only avoids refetch within the same session.
 */
export async function getDocumentForPreview(
  documentId: number,
  versionId?: number,
  fileName?: string,
  useCache = true
): Promise<Blob> {
  // Add cache-busting parameter when cache is disabled to force fresh fetch
  const cacheBuster = useCache ? '' : `&_=${Date.now()}`;
  const url = versionId
    ? `/api/documents/${documentId}/download?version_id=${versionId}&preview=1${cacheBuster}`
    : `/api/documents/${documentId}/download?preview=1${cacheBuster}`;

  const token = localStorage.getItem('access_token');
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = `${baseURL}${url}`;

  const fetchOptions: RequestInit = {
    method: 'GET',
    credentials: 'include',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      Accept: '*/*',
      // Force no-cache headers when cache is disabled
      ...(useCache ? {} : {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }),
    },
  };

  const response = useCache
    ? await getCachedOrFetchPreview(fullUrl, fetchOptions)
    : await fetch(fullUrl, { ...fetchOptions, cache: 'no-store' });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to fetch document for preview: ${response.statusText} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const headerType = (response.headers.get('content-type') || '').toLowerCase();
  const ext = (fileName?.split('.').pop() || '').toLowerCase();

  const inferredType = inferPreviewContentType(headerType, ext);

  return new Blob([arrayBuffer], { type: inferredType });
}

/**
 * Download attachment blob.
 */
export async function downloadAttachment(documentId: number, attachmentId: number): Promise<Blob> {
  const apiClient = (await import('../client')).default;
  const url = `/api/documents/${documentId}/attachments/${attachmentId}/download`;
  const response = await apiClient.get(url, { responseType: 'blob' });
  return response.data;
}

/**
 * Get attachment blob for preview (doesn't trigger download).
 * Uses fetch + Cache API for persistence across page reloads.
 */
export async function getAttachmentForPreview(
  documentId: number,
  attachmentId: number,
  fileName: string
): Promise<Blob> {
  const url = `/api/documents/${documentId}/attachments/${attachmentId}/download?preview=1`;
  const token = localStorage.getItem('access_token');
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const fullUrl = `${baseURL}${url}`;

  const fetchOptions: RequestInit = {
    method: 'GET',
    credentials: 'include',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      Accept: '*/*',
    },
  };

  const response = await getCachedOrFetchPreview(fullUrl, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to fetch attachment for preview: ${response.statusText} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const headerType = (response.headers.get('content-type') || '').toLowerCase();
  const ext = (fileName?.split('.').pop() || '').toLowerCase();
  const inferredType = inferPreviewContentType(headerType, ext);

  return new Blob([arrayBuffer], { type: inferredType });
}
