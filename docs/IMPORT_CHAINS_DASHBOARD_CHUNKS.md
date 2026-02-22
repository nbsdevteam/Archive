# Import chains that caused mui-vendor and feature-auth on /dashboard

## 1. feature-auth chunk on /dashboard (FIXED)

**Root cause:** The app shell (Header) statically imported `useAuth` from `features/auth/hooks/useAuth`. Vite’s `manualChunks` puts everything under `src/features/auth/` into the `feature-auth` chunk, so that chunk was loaded on every page that renders the shell (including /dashboard).

**Full chain:**
```
main.tsx → App → AppRouter → router.tsx → router.link → (route render)
  → ProtectedRoute → AppShell → Header
    → import { useAuth } from "../../../features/auth/hooks/useAuth"
      → feature-auth chunk (entire auth feature)
```

**Fix:** `useAuth` was moved to `shared/auth` and the shell (and all other consumers) now import from `@/shared/auth`. The shell no longer imports from `features/auth`, so the `feature-auth` chunk is not loaded on /dashboard. It loads only when an auth route (e.g. Login) is visited.

**Files changed:**
- Added `src/shared/auth/useAuth.ts`, `types.ts`, `index.ts`.
- Header and containers now import from `@/shared/auth`.
- `features/auth/hooks/useAuth.ts` re-exports from `@/shared/auth` for backward compatibility and mocks.

---

## 2. mui-vendor chunk on /dashboard (MITIGATED)

**Observation:** The only static imports of `@mui/*` in the app are in `shared/components/Activity/AuditLogsTimeline.tsx`. So mui-vendor should only be pulled in by code that eventually imports AuditLogsTimeline (or the Activity barrel that re-exports it).

**Possible cause:** Document and folder detail pages imported `AuditActivityPanel` from the Activity **barrel** (`@/shared/components/Activity`). The barrel re-exports `AuditLogsTimeline` and other modules. Depending on bundler/tree-shaking, importing from the barrel can pull in other barrel exports or their dependency graph. If that graph is shared with the initial route chunk, mui-vendor could load earlier than intended.

**Mitigation:** Document and folder detail no longer use the Activity barrel for `AuditActivityPanel`. They import directly from `@/shared/components/Activity/AuditActivityPanel` (and types from `@/shared/components/Activity/types`). This keeps the dependency graph to AuditActivityPanel only; `AuditLogsTimeline` stays lazy inside AuditActivityPanel, so MUI is only loaded when the audit UI is shown.

**Static import of @mui in codebase:**
- `src/shared/components/Activity/AuditLogsTimeline.tsx` — `@mui/lab`, `@mui/material` (Paper, Typography, Tooltip).

**Activity barrel:** `src/shared/components/Activity/index.ts` re-exports ActivityViewSwitcher, AuditLogsTimeline, AuditActivityPanel, etc. Consumers that only need `AuditActivityPanel` now import it by file path, not from the barrel.

**Files changed:**
- `DocumentDetailTabsGroup2.tsx`: `@/shared/components/Activity` → `@/shared/components/Activity/AuditActivityPanel`.
- `FolderDetailActivitySection.tsx`: same.

---

## Summary

| Chunk        | Cause                                                                 | Fix                                                                 |
|-------------|-----------------------------------------------------------------------|---------------------------------------------------------------------|
| feature-auth | Header → `features/auth/hooks/useAuth`                                | useAuth moved to `shared/auth`; shell imports from `@/shared/auth` |
| mui-vendor   | Possible barrel/tree-shake pulling AuditLogsTimeline (only MUI user)  | Direct imports for AuditActivityPanel; no barrel for these pages   |
