# Preview Cache Invalidation - Implementation Guide

## Overview

This document explains the automatic cache invalidation system for file previews when new document versions are uploaded.

## Problem Statement

Previously, when a user uploaded a new version of a document, the preview section would continue showing the cached (old) version of the file. Users had to manually refresh the page to see the updated preview.

## Solution

A simple key-value cache system where:
1. Cache key = `documentId-versionId-attachmentId` 
2. When a new version is uploaded, the version ID changes
3. Different cache key = cache miss = automatic re-download
4. No complex version comparison needed - the cache key itself handles versioning

## Implementation Details

### 1. Enhanced Cache Structure

**Location:** `src/shared/components/FilePreview/FilePreview.tsx`

```typescript
interface CacheMetadata {
  blobUrl: string;              // The blob URL for preview
  latestVersionId?: number;     // Version ID when cached
  timestamp: number;            // Cache timestamp
}

const enhancedPreviewCache = new Map<string, CacheMetadata>();
```

### 2. Simple Cache Lookup

```typescript
// Cache key includes version ID
const cacheKey = buildPreviewCacheKey(documentId, versionId, attachmentId);

// Simple key-value lookup - no version comparison needed
const cachedMetadata = enhancedPreviewCache.get(cacheKey);
if (cachedMetadata) {
  // Cache hit - serve from cache
  return cachedMetadata.blobUrl;
}

// Cache miss - download and cache
```

### 3. Automatic Cache Invalidation

No manual invalidation needed! When version changes:
1. Component receives new `versionId` from version history
2. Cache key changes (includes version ID)
3. Cache lookup fails (different key)
4. File is automatically downloaded
5. Cached with the new key

### 4. Component Integration

**FilePreview Component:**
- Pass `versionId` to download a specific version
- Cache key includes version ID
- Different version = different key = automatic cache miss

**Usage Example:**

```tsx
// Get current version from version history (first item, sorted newest first)
const currentVersionId = document.versions?.[0]?.id;

<FilePreview
  documentId={123}
  versionId={currentVersionId}  // Download this specific version
  fileName="document.pdf"
  maxHeight="500px"
/>
```

**How it works:**
- Version 1: `versionId={456}` → cache key = `"123-456-none"` → downloads and caches
- Version 2 uploaded: `versionId={789}` → cache key = `"123-789-none"` → cache miss → downloads new version
- Simple key-value logic - no complex version comparison needed!

## Files Modified

### Core Implementation
- **`src/shared/components/FilePreview/FilePreview.tsx`**
  - Added cache metadata structure
  - Implemented version-based cache validation
  - Added automatic invalidation on version mismatch
  - Exported `clearPreviewCache` utility function

### Component Updates
- **`src/features/folders/pages/FolderDetail/FolderDetailPreviewSection.tsx`**
  - Extracts latest version ID from document
  - Passes to FilePreview component

- **`src/features/documents/components/detail/DocumentDetailTabsGroup1.tsx`**
  - Passes latest version ID to preview tab

## How Version History Validation Works

### 1. Document Structure
```typescript
interface DocumentDetail {
  id: number;
  versions: DocumentVersion[];  // Sorted by upload date (newest first)
  // ... other fields
}

interface DocumentVersion {
  id: number;           // Version ID used for cache validation
  version_number: number;
  file_name: string;
  upload_date: string;
  // ... other fields
}
```

### 2. Version Extraction
```typescript
// Get the latest version ID (first item in versions array)
const latestVersionId = document?.versions?.length 
  ? document.versions[0]?.id 
  : undefined;
```

### 3. Cache Key Structure
```typescript
// Cache key format: "documentId-versionId-attachmentId"
// Examples:
// - "123-latest-none"      (document 123, latest version, no attachment)
// - "123-456-none"         (document 123, specific version 456)
// - "123-latest-789"       (document 123, attachment 789)
```

### 4. Simple Cache Flow
```
┌─────────────────────────────────────────────────────┐
│ User uploads new version                            │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Version history updated                             │
│ versions[0].id = 789 (was 456)                      │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Component re-renders with new versionId=789         │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ FilePreview builds cache key: "123-789-none"        │
│ (was "123-456-none")                                │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Cache lookup with new key                           │
└───────┬────────────────────────────────────┬────────┘
        │                                    │
     MISS│                                   │HIT
        ▼                                    ▼
┌──────────────────┐              ┌─────────────────┐
│ Download file    │              │ Use cached blob │
│ Cache with key   │              └─────────────────┘
│ "123-789-none"   │
└──────────────────┘
```

## Manual Cache Clearing

For edge cases or manual control:

```typescript
import { clearPreviewCache } from '@/shared/components/FilePreview';

// Clear cache for latest version
clearPreviewCache(documentId);

// Clear cache for specific version
clearPreviewCache(documentId, versionId);

// Clear cache for attachment
clearPreviewCache(documentId, undefined, attachmentId);
```

## Testing the Feature

### Test Scenario 1: New Version Upload
1. Open a folder detail page with a document preview
2. The preview shows the current file (cached)
3. Upload a new version via the "Upload New Version" feature
4. **Expected:** Preview automatically updates to show new file without page refresh

### Test Scenario 2: Version History Tab
1. Navigate to document detail page
2. View "Version History" tab to see all versions
3. Component receives latest version ID from versions[0]
4. Preview tab automatically shows latest version

### Test Scenario 3: Cache Persistence
1. View a document preview (caches the file)
2. Navigate away and return to the same document
3. **Expected:** Preview loads from cache instantly (no re-download)
4. Upload new version
5. **Expected:** Cache invalidates, new file downloads

## Performance Considerations

### Memory Management
- **Cache Size Limit:** 20 entries (configurable via `MAX_PREVIEW_CACHE_SIZE`)
- **Eviction Strategy:** Oldest entries evicted first (FIFO)
- **Blob URL Cleanup:** URLs properly revoked to prevent memory leaks

### Network Optimization
- **Skip Downloads:** Cached previews skip network requests entirely
- **Stale Detection:** Only re-downloads when version ID changes
- **API Layer Caching:** Browser Cache API persists across full page reloads

## Edge Cases Handled

1. **No Version History:** Works gracefully when versions array is empty
2. **Legacy Cache:** Backward compatible with old cache format
3. **Concurrent Requests:** Cancellation tokens prevent race conditions
4. **Memory Leaks:** Blob URLs properly revoked on cache eviction

## Future Enhancements

Possible improvements for the future:
- Add timestamp-based invalidation for attachments
- Implement size-based cache eviction strategy
- Add cache statistics/monitoring
- Support for cache preloading

## Troubleshooting

### Preview not updating after version upload?
1. Check browser console for errors
2. Verify version history API returns updated versions array
3. Ensure `latestVersionId` prop is being passed correctly
4. Try manually clearing cache: `clearPreviewCache(documentId)`

### Memory usage growing?
1. Check `MAX_PREVIEW_CACHE_SIZE` setting
2. Verify blob URLs are being revoked (check DevTools Memory)
3. Ensure eviction is working (test with >20 different previews)

## Related Files

- API Reference: `NBS_ARCHIVE_API_REFERENCE_FRONTEND.md` (Section 5.6 - List Versions)
- Document Types: `src/app/adapter/api/documents.api.ts`
- Store: `src/features/documents/stores/documentStore.ts`

## Git Commit Message

```
feat: Add automatic cache invalidation for file previews on version upload

- Implement version-based cache validation in FilePreview component
- Track latest version ID from document version history
- Auto-invalidate and re-download when new version detected
- Add clearPreviewCache utility for manual cache control
- Update FolderDetailPreviewSection to pass version metadata
- Update DocumentDetailTabsGroup1 preview tab integration
- Add comprehensive inline documentation

Resolves issue where cached previews showed outdated files after
version uploads. Users now see latest file automatically without
manual page refresh.
```
