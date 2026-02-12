# Fix for Duplicate API Calls

## Problem
Multiple API endpoints were being called 2-3 times across different pages:
- `/archive/activity` - `api/audit-logs` running 3 times
- `/notes` - `api/notes` running 2 times
- `/folders` - `api/departments` and `api/folders` running 2 times each
- `/documents` - `api/departments` running 2 times
- `/dashboard` - multiple APIs running 2 times each (documents, trash, dashboard, notifications, unread-count, folders)

## Root Causes Identified

1. **Double StrictMode Wrapper**: The app was wrapped in both `<StrictMode>` and `<React.StrictMode>` in `main.tsx`, causing effects to run twice in development mode.

2. **Hook Dependency Issues**: Several hooks had callback functions in their `useEffect` dependencies, causing re-runs whenever those callbacks changed:
   - `useNotes` - depended on `loadNotes` callback
   - `useFolders` - depended on `fetchFolders` callback
   - `useNotifications` - depended on `fetchNotifications` and `fetchUnreadCount` callbacks
   - `useAuditLogs` - depended on `fetchLogs` callback

3. **useRunOnceOnMount Hook Issue**: Had the callback function `fn` in its dependency array, causing re-runs when the function reference changed.

4. **Departments API**: Called directly in multiple components without caching, resulting in duplicate calls across pages.

## Solutions Implemented

### 1. Fixed StrictMode Double Wrapper
**File**: `src/main.tsx`
- Removed duplicate `<React.StrictMode>` wrapper
- Kept single `<StrictMode>` wrapper

### 2. Fixed useRunOnceOnMount Hook
**File**: `src/shared/hooks/useRunOnceOnMount.ts`
- Removed `fn` from dependency array
- Used `useRef` to store the callback without triggering re-renders
- Added empty dependency array to truly run once

### 3. Fixed Hook Dependencies
Updated the following hooks to depend on primitive values instead of callback functions:

**`src/features/notes/hooks/useNotes.ts`**
- Changed from depending on `loadNotes` callback
- Now depends on: `autoLoad, documentId, folderId, includePrivate, perPage`

**`src/features/folders/hooks/useFolders.ts`**
- Changed from depending on `fetchFolders` callback
- Now depends on: `useApi, stateParam, departmentIdParam, folderTypeParam`

**`src/features/notifications/hooks/useNotifications.ts`**
- Changed from depending on `fetchNotifications` and `fetchUnreadCount` callbacks
- Now depends on: `useApi, JSON.stringify(initialParams)`

**`src/features/activity/hooks/useAuditLogs.ts`**
- Changed from depending on `fetchLogs` callback
- Now depends on: `enabled, initialParamsKey`

### 4. Created Centralized Departments Store
**File**: `src/shared/stores/departmentsStore.ts` (NEW)
- Created Zustand store for departments data
- Implements singleton pattern - fetches only once and caches
- Provides `fetchDepartments()` and `clearDepartments()` actions
- Includes `useDepartments()` hook for easy consumption

### 5. Updated Components to Use Departments Store
**Files Modified**:
- `src/features/folders/containers/useFoldersPageContainer.ts`
- `src/features/documents/containers/useDocumentsPageContainer.ts`

Changes:
- Removed local `departments` state and `useEffect` with `adminApi.getDepartments()`
- Now use `useDepartmentsStore()` to access cached departments
- Departments are fetched once and reused across all components

### 6. Integrated Departments Initialization with Authentication
**File**: `src/features/auth/hooks/useLogin.ts`
- Added automatic departments fetch after successful login
- Ensures departments are preloaded before user navigates to any page

**File**: `src/features/auth/hooks/useAuth.ts`
- Added `clearDepartments()` call on logout
- Ensures fresh data on next login

## Expected Results

After these changes:
- ✅ All API calls should run exactly **once** per page load
- ✅ Departments API runs only **once** on login and is cached
- ✅ No more duplicate calls in development mode (StrictMode)
- ✅ No more duplicate calls in production
- ✅ Better performance and reduced server load

## Testing Checklist

Test each page and verify API calls (use browser DevTools Network tab):
- [ ] `/archive/activity` - audit-logs called once
- [ ] `/notes` - notes API called once
- [ ] `/folders` - departments & folders APIs called once each
- [ ] `/documents` - departments & documents APIs called once each
- [ ] `/dashboard` - all APIs (documents, trash, dashboard, notifications, unread-count, folders) called once each
- [ ] Login - departments API called once after successful login
- [ ] Logout - departments cleared from cache
- [ ] Navigate between pages - no duplicate API calls

## Files Modified

1. `src/main.tsx`
2. `src/shared/hooks/useRunOnceOnMount.ts`
3. `src/features/notes/hooks/useNotes.ts`
4. `src/features/folders/hooks/useFolders.ts`
5. `src/features/notifications/hooks/useNotifications.ts`
6. `src/features/activity/hooks/useAuditLogs.ts`
7. `src/shared/stores/departmentsStore.ts` (NEW)
8. `src/features/auth/hooks/useLogin.ts`
9. `src/features/auth/hooks/useAuth.ts`
10. `src/features/folders/containers/useFoldersPageContainer.ts`
11. `src/features/documents/containers/useDocumentsPageContainer.ts`

## Notes

- The `useRunOnceOnMount` hook now truly runs once, even in React.StrictMode
- Departments store implements lazy loading - only fetches when first accessed
- All changes are backward compatible and don't affect functionality
- ESLint warnings for exhaustive-deps are intentionally disabled where necessary with inline comments
