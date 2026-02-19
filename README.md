# SmartHR React Admin Template

A comprehensive, performance-optimized React admin template built with TypeScript, Vite, and modern React patterns.

## 🚀 Features

- **Modern React 19** with TypeScript support
- **Performance Optimized** with React.memo, useMemo, and useCallback
- **Code Splitting** with React.lazy and Suspense
- **Virtual Scrolling** for large datasets
- **Debounced Search** with optimized filtering
- **Zustand** stores for feature state (`src/features/*/stores/*Store.ts`)
- **Comprehensive Error Handling** with Error Boundaries
- **Testing** with Vitest and React Testing Library
- **Bundle Analysis** with webpack-bundle-analyzer
- **Performance Monitoring** with real-time metrics

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Analyze bundle size
npm run build:analyze

# Run tests
npm test

# Run performance analysis
npm run performance
```

## 🏗️ Project Structure

```
src/
├── app/                 # API adapters, providers, router
├── core/                # Common components, providers, hooks
├── features/            # Feature-based modules
│   ├── activity/        # Audit logs, folder activity
│   ├── auth/            # Login, session
│   ├── documents/       # Document list, detail, upload, stores
│   ├── folders/         # Folder list, detail, containers, hooks
│   ├── notes/           # Notes hooks, components
│   ├── search/          # Search store and UI
│   ├── signatures/      # Signature requests store and UI
│   └── ...              # Other features (edit-requests, notifications, etc.)
├── shared/              # Shared UI components, hooks, utils
├── router/              # Routing configuration
└── assets/              # Static assets, SCSS
```

Feature state is held in **Zustand** stores under `src/features/*/stores/` (e.g. `documentStore`, `signatureStore`, `searchStore`).

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
# Base URL for the NBS Archive API
# For development: leave VITE_API_BASE_URL unset so the Vite proxy is used (proxy target: http://192.168.116.15:8070)
# For production: set to your backend URL, e.g. http://192.168.116.15:8070
# VITE_API_BASE_URL=http://192.168.116.15:8070

# Optional: App configuration
VITE_APP_NAME=SmartHR
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

**Note**: The `VITE_API_BASE_URL` environment variable is used by the API client. **Leave it unset in development** so requests go to `/api/...` and the Vite proxy forwards them to the backend (e.g. `http://192.168.116.15:8070`). If you set it to a full URL, the app will call that URL directly (no proxy). All API endpoints are prefixed with `/api/`.

### Trigger NBS Archive APIs (login, upload, create folder)

A script triggers the login, upload document, and create folder APIs so you can verify success or errors without using the UI.

**Usage:**

```bash
# Backend must be reachable at the base URL (default: http://localhost:8070)
npm run trigger-apis
```

**Environment (optional):** Set `API_BASE_URL` or `VITE_API_BASE_URL` when the backend is not on `http://localhost:8070` (e.g. when using the same host as the Vite proxy):

```bash
# Windows (PowerShell)
$env:API_BASE_URL="http://192.168.116.15:8070"; npm run trigger-apis

# Linux/macOS
API_BASE_URL=http://192.168.116.15:8070 npm run trigger-apis
```

**What it does:** Logs in with `admin` / `admin`, then calls upload document (plain JSON) and create folder (JSON-RPC). It fetches the first department and document type for the upload.

**Success/error reporting:** For each step the script prints HTTP status, `success`/`error`, and `data.id` when present. Login failure (e.g. 401 or missing `access_token`) exits with code 1; upload and folder steps always run and report success or error in the output.

### Performance Settings

Configure performance options in `src/main.tsx`:

```typescript
<PerformanceProvider
  enableProfiling={false}
  enableMemoization={true}
  enableVirtualization={true}
>
```

## 🎯 Performance Optimizations

### 1. Component Optimization

- **React.memo**: Prevents unnecessary re-renders
- **useMemo**: Memoizes expensive calculations
- **useCallback**: Memoizes event handlers

### 2. Search Optimization

- **Debounced Search**: 300ms delay prevents excessive filtering
- **Virtual Scrolling**: Only renders visible items
- **Lazy Loading**: Images and components load on demand

### 3. Bundle Optimization

- **Code Splitting**: Feature-based chunks
- **Tree Shaking**: Removes unused code
- **Bundle Analysis**: Monitor bundle sizes

## 🧪 Testing

### Running Tests

Tests use **Vitest**. Run them with:

```bash
# Run all tests (single run)
npm run test -- --run

# Run tests in watch mode
npm test

# Run tests with coverage
npm run test -- --run --coverage

# Run a specific test file
npm run test -- --run src/features/folders/containers/useFolderDetailPageContainer.test.tsx
```

### Test Structure

Test files sit alongside source code (e.g. `*.test.ts`, `*.test.tsx`):

- `src/features/*/containers/*.test.tsx` – container/hook tests
- `src/features/*/hooks/*.test.tsx` – hook unit tests
- `src/shared/utils/**/*.test.ts` – utility tests

### E2E testing (Cypress)

End-to-end tests run against the local Vite dev server (port 3003). Use **UI login** (admin/admin) so the session persists and the app does not log you out on refresh.

**Run slow walkthrough (see mouse move, step-by-step):**

```bash
npm run e2e:slow
```

Runs only the walkthrough spec with a 600ms delay after each click/type so you can watch the flow. Logs in as **admin** / **admin**, then clicks the main **Upload Document** button on the dashboard (no `/upload` route), fills the form, and submits.

**Run full suite headed (visible browser):**

```bash
npm run e2e:headed
```

Starts the dev server, then runs all Cypress specs in headed mode (Chrome).

**Run headless (CI):**

```bash
npm run e2e:ci
```

**Run Cypress only (server already running):**

```bash
npm run cypress:run:headed
```

Requires the app at `http://localhost:3003` (e.g. `npm run dev`).

**Interactive runner (recommended for slow/visible runs; avoids Windows exit code 1):**

Use two terminals so the dev server and Cypress run separately. This avoids `start-server-and-test` killing the server (which on Windows can trigger a `wmic.exe` error and exit code 1).

1. **Terminal A:** start the app and leave it running:
   ```bash
   npm run dev
   ```
2. **Terminal B:** open the Cypress interactive runner:
   ```bash
   npm run e2e:open
   ```
   Or open only the slow smoke and walkthrough specs:
   ```bash
   npm run e2e:slow:open
   ```
   In the Cypress UI, choose a spec and run it. You can watch every step; no automatic server kill, so the process exits cleanly.

**Real API (CRUD on test-created data only):** Use `slow-smoke-real-api.cy.ts` to run against the real backend. It creates one main document (unique name), then reads, updates, and adds/edits an attachment on that document only. Delete and permanent delete are disabled (blocked with 403). Ensure the backend is running and reachable at the app’s API base URL.

**Auth:** Use `loginAsAdmin()` in specs to log in via the UI (default username/password **admin** / **admin**). Override with `CYPRESS_LOGIN_USER` / `CYPRESS_LOGIN_PASSWORD`. For stubbed APIs, `loginByToken(path)` seeds `access_token` in `localStorage` without UI login.

**Key data-testids for E2E:** `login-submit-btn`, `upload-document-btn` (dashboard), `upload-documents-btn` (documents toolbar), `upload-in-folder-btn` (folder detail), `upload-document-open-btn` (upload page), `upload-document-submit`, `confirm-modal-confirm`, `document-detail-add-attachment-btn`, `attachment-edit-save`, `trash-restore-selected`, `transfer-folder-select`, `transfer-confirm-btn`.

## 📊 Performance Monitoring

### Performance Dashboard

Access the performance dashboard to monitor:

- Component render times
- Memory usage
- Bundle sizes
- Slow components

### Performance Metrics

- **Average Render Time**: Target < 16ms
- **Bundle Size**: Target < 500KB initial
- **Memory Usage**: Monitor for leaks

## 🔍 Development Guidelines

### 1. Component Development

```typescript
// Use React.memo for components
const MyComponent = React.memo(({ data, onAction }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => expensiveCalculation(data), [data]);

  // Memoize event handlers
  const handleClick = useCallback(() => {
    onAction(processedData);
  }, [onAction, processedData]);

  return <div onClick={handleClick}>{/* JSX */}</div>;
});
```

### 2. State Management

```typescript
// Use Zustand stores (e.g. src/features/documents/stores/documentStore.ts)
import { useDocumentStore } from "@/features/documents/stores/documentStore";

const MyComponent = () => {
  const { documents, fetchDocuments, isLoading } = useDocumentStore();

  const handleRefresh = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);
};
```

### 3. Error Handling

```typescript
// Use Error Boundaries
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => {
    // Log error to monitoring service
    logError(error, errorInfo);
  }}
>
  <MyComponent />
</ErrorBoundary>
```

## 📖 Developer Documentation

This section describes how the application is structured, how data flows, and how key features (documents, folders, selection, batch actions) work. Use it when adding or changing behavior in documents/folders or shared services.

### High-level architecture

- **Feature modules** (`src/features/*`): Each feature owns its pages, containers (hooks that compose state and handlers), hooks, stores, and UI. Examples: `documents`, `folders`, `activity`, `notes`, `search`.
- **Shared** (`src/shared/`): Reusable hooks (selection, confirm dialog, pagination, debounce), UI components, layout, utils, and **shared services** (e.g. document batch-action visibility). No feature-specific logic.
- **Core** (`src/core/`): App-wide components and providers (header, sidebar, theme, performance). The header search lives here.
- **App** (`src/app/`): API adapters (clients that call the backend), router, and top-level providers.

### State management (Zustand)

Feature state is held in **Zustand** stores under `src/features/*/stores/`:

- **documentStore**: Document list, fetch, loading, error, pagination. Used by document list pages and folder detail (load folder documents).
- **searchStore**: Search results, global/barcode search, clear. Used by the search page and header search.
- **departmentsStore** / **companiesStore** (shared): Department and company lists for filters and dropdowns.

Containers read from stores and from URL (e.g. `usePaginationFromUrl`), then expose a single object (data, loading, actions, modals) to the page component.

### Data flow

1. **Page** → uses a **container** hook (e.g. `useDocumentsPageContainer`).
2. **Container** → uses **stores**, **shared hooks** (selection, pagination, confirm dialog), and **feature hooks** (e.g. `useDocumentListWithFilters`, `useDocumentOperations`).
3. **Feature hooks** → call **API adapters** (`documentsApi`, `adminApi`, etc.) and update store or local state.
4. **UI** → receives from container: data, loading, error, selection, batch action flags, and action handlers (e.g. `confirmTrash`, `handleConfirmBatchMove`).

### Selection and batch actions

- **Selection**: Table row selection is managed by the shared hook **useSelection** (in `src/shared/hooks/useSelection.ts`). It takes the current list of rows and a `getId` function, and returns `selectedIds`, `selectionConfig` (for DataTable), `clear`, `setAll`, and `deselectIds`. Containers pass the current page's documents (or sub-docs/attachments) into useSelection and use `selectedIds` for batch APIs and for batch-action visibility.
- **Batch action visibility**: The shared service **documentBatchActionsService** (`src/shared/services/documentBatchActionsService.ts`) computes which batch actions are allowed for the current selection:
  - **Rule**: "Common-only" — an action is shown only if it is valid for **every** selected document (intersection). So we never show "Transfer" if any selected document is a main document (main docs cannot be transferred).
  - **Status**: Documents are classified as active, archived, trashed, or unknown. Allowed actions depend on status and on whether the document is a main document (main docs cannot be trashed or transferred in batch).
- **Trigger**: Containers call `getAllowedBatchActionsForDocumentsSelection(documents, selectedDocumentIds)` (often inside a `useMemo`) and pass the result to the page as `batchActions`. The toolbar shows batch buttons (Transfer, Archive, Trash, Restore, Unarchive) based on these booleans. When the user confirms, the container's batch handler (e.g. `confirmBatchTrash`, `handleConfirmBatchMove`) calls the API and then clears selection and refetches.

### Document lifecycle and constraints

- **Active** → can be archived or (if sub-document) trashed or transferred.
- **Archived** → can be unarchived or (if sub-document) trashed.
- **Trashed** → can be restored or permanently deleted (subject to permissions).
- **Main documents** cannot be transferred or batch-trashed; the UI blocks batch trash when main files are selected (e.g. "main files block modal" on the documents page) and deselects them so the user can retry with sub-docs only.

### Folder detail composition

The folder detail page is orchestrated by **useFolderDetailPageContainer**, which composes several sub-hooks:

- **useFolderDetailIds**: Reads `folderId` from the URL.
- **useFolderDetailData**: Loads folder metadata and documents (main + sub-docs), sorted; exposes `loadFolderDocuments`.
- **useFolderAttachments**: Loads attachments for the selected document (by `attachmentsDocId`); exposes `loadAttachmentsForDocument`, `handleAttachmentsDocIdChange`.
- **useFolderManagers**: Loads managers for the folder's department.
- **useFolderAuditLogs**: Activity logs for the folder.
- **useSelection** (x2): One for sub-documents table, one for attachments list; both feed into batch-action visibility and transfer.
- **useNotes** / **useNoteMutations** / **useNoteEditorHandlers**: Notes CRUD and editor state.
- **useFolderTransfer**: Transfer modal state and confirm handler (move docs/attachments to another folder).
- **useFolderUploadPanel**: Upload-in-folder and add-attachment panel state.
- **useFolderSignaturesAndEditRequests**: Signature and edit-request modals and submit handlers.
- **useDocumentOperations** / **useAttachmentOperations**: Archive, trash, restore, download, delete attachment.

The container returns a single typed state object (data, loading, errors, selection, actions, modals) so the page component stays thin.

### Testing

- **Unit tests**: Vitest; test files sit next to source (`*.test.ts`, `*.test.tsx`). Run with `npm run test -- --run`. Key areas: `src/features/*/containers/*.test.tsx`, `src/features/*/hooks/*.test.tsx`, `src/shared/utils/**/*.test.ts`, `src/shared/services/documentBatchActionsService.test.ts`.
- **E2E**: Cypress; see the "Testing" section above for commands (e2e:slow, e2e:headed, e2e:ci, e2e:open). Use UI login (admin/admin) for real flows; production-test rules restrict deletes to data created in the same test.

## 🚀 Deployment

### Build for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# View bundle report
open dist/bundle-report.html
```

## 📈 Performance Best Practices

### 1. Component Optimization

- Use `React.memo` for components with stable props
- Implement `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to children
- Avoid creating objects/arrays in render functions

### 2. State Management

- Use `useBatchState` for multiple state updates
- Implement debouncing for search inputs
- Use throttling for scroll/resize events
- Avoid unnecessary state updates

### 3. Rendering Optimization

- Use virtual scrolling for large lists
- Implement lazy loading for images
- Use intersection observer for on-demand loading
- Optimize re-render cycles

## 🐛 Troubleshooting

### Common Issues

1. **Performance Issues**

   - Check Performance Dashboard
   - Use React DevTools Profiler
   - Monitor bundle sizes

2. **TypeScript Errors**

   - Ensure proper type definitions
   - Use strict TypeScript configuration
   - Check store and hook types

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check Vite configuration
   - Verify import paths

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review performance guidelines
- Consult the troubleshooting section

## 🔄 Changelog

### v1.5.6

- Performance optimizations implemented
- TypeScript improvements
- Error handling enhancements
- Testing infrastructure added
- Bundle analysis tools integrated
