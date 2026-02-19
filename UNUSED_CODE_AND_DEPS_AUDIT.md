# Unused Code, Imports & Packages Audit

This document listed unused components/functions/hooks/types, unused imports, and unused npm packages. **Cleanup applied:** unused code and safe-to-remove packages were deleted. **Build-related or config-related packages were kept** (see below).

---

## A. Removed (cleanup applied)

### Unused components & code
- **CreateFolderSidePanel** – Removed `src/features/folders/components/CreateFolderSidePanel.tsx` and `src/features/folders/utils/CreateFolderSidePanel.validations.ts`; removed exports from `src/features/folders/components/index.ts`. The component was never rendered; the API `createFolder` is still used elsewhere (e.g. upload flow).
- **Pagination (UI)** – Removed `src/shared/components/ui/Pagination/` (Pagination.tsx + index.ts). The app uses **PaginationSection** everywhere; this duplicate was not exported from the ui barrel.
- **DepartmentDonutItem** – Removed from barrel export in `src/features/dashboard/components/index.ts`. The type remains internal to `DepartmentDonutChart.tsx`.

### Unused packages removed (not needed at build)
- **dependencies:** `@mui/icons-material`, `clsx`, `react-error-boundary`, `react-perfect-scrollbar`, `react-quill-new`, `tailwind-merge`.
- **devDependencies:** `@ant-design/icons`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`, `@fullcalendar/react`, `@fullcalendar/timegrid`, `clipboard-copy`, `dragula`, `@types/dragula`, `jquery`, `leaflet`, `@types/leaflet`, `moment`, `quill`, `react-awesome-stars-rating`, `react-bootstrap-daterangepicker`, `react-chartjs-2`, `react-country-flag`, `react-countup`, `react-datepicker`, `react-feather`, `react-icons`, `react-input-mask`, `@types/react-input-mask`, `react-simple-wysiwyg`, `react-slick`, `@types/react-slick`, `react-tag-input`, `react-time-picker`, `slick-carousel`, `swiper`, `weather-icons-react`, `yet-another-react-lightbox`.

---

## B. Kept (may be needed at build or config)

- **@jridgewell/sourcemap-codec** – Often used by build/source-map tooling.
- **rollup-plugin-node-polyfills** – May be used in Rollup config.
- **@rollup/plugin-inject** – Check Rollup config before removing.
- **vite-plugin-node-polyfills** – Check Vite config before removing.
- **autoprefixer**, **postcss-nesting** – PostCSS/build.
- **bootstrap** – Styles/scripts.
- **resolve-url-loader** – Build config.
- **rimraf**, **rollup**, **vite**, **typescript** – Scripts/build.
- **@vitest/coverage-v8** – Coverage runs.
- **@testing-library/user-event** – Tests.
- **@fortawesome/fontawesome-free** – CSS imported in `main.tsx`.
- **react-router** – Peer of `react-router-dom`.
- **primeicons**, **primereact** – Check if used in styles or components.
- **web-vitals** – Check if used in entry or analytics.
- **rtlcss** – Used in `build:bootstrap-rtl` script.

---

## C. Optional / future

- **documentBatchActionsService** – Exports `getDocumentStatusKind`, `DocumentStatusKind`, `DocumentForBatchActions` are used only inside the service and in its test. You can keep them as public API or make them module-internal.
- **Unused imports** – Run `npm run lint` and fix any `no-unused-vars` / unused import warnings. Optionally add `eslint-plugin-unused-imports` for a file-by-file list.

---

## Summary

- Unused UI code (CreateFolderSidePanel, duplicate Pagination, DepartmentDonutItem barrel export) has been removed.
- Unused dependencies and devDependencies that are not required for build or config have been removed.
- Packages that may be needed at build or in config were **not** removed; see section B.
