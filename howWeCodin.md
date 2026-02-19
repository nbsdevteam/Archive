# How We Code — Development Style & Rules

This document describes our coding style, project conventions, and rules so new projects and contributors stay consistent.

---

## 1. Stack & tooling

- **Runtime**: React 19, TypeScript (strict), Vite
- **State**: Zustand where needed; local state with `useState` / `useReducer`
- **Forms**: react-hook-form + @hookform/resolvers
- **i18n**: react-i18next (en + ar); keys in `src/i18n/en.json` and `ar.json`
- **UI**: MUI (@mui/material), custom shared components under `src/shared/components`
- **Tests**: Vitest + React Testing Library (unit/integration)
- **Lint**: ESLint 9 (flat config) with TypeScript, React, React Hooks, jsx-a11y, import order, and a **local hook-order rule**
- **Format**: Prettier as default formatter; format on save (see `.vscode/settings.json`)

---

## 2. Project structure

- **`src/features/<feature>/`** — Feature modules (e.g. `documents`, `folders`, `dashboard`). Each may have:
  - `pages/` — Route-level page components (thin; they use containers and present UI)
  - `containers/` — `use*PageContainer` hooks that hold state and business logic
  - `hooks/` — Feature-specific hooks (e.g. `useDocumentsTableSort`, `useDocumentListWithFilters`)
  - `components/` — Feature UI components
  - `utils/` — Feature-specific helpers and column configs
  - `stores/` — Zustand stores when needed
  - `types/` — Feature-specific types
- **`src/shared/`** — Shared hooks, components, utils, services, layout
- **`src/core/`** — Common UI (e.g. header, sidebar, collapse-header) and core hooks/utils
- **`src/app/`** — App shell: adapter (API clients), providers, router

---

## 3. Path aliases (tsconfig)

Use these instead of long relative paths:

- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/hooks/*` → `src/core/hooks/*`
- `@/utils/*` → `src/core/utils/*`
- `@/types/*` → `src/core/data/types/*`
- `@/assets/*` → `src/assets/*`
- `@/styles/*` → `src/assets/scss/*`

---

## 4. Naming

- **Components**: PascalCase (`DocumentsPage`, `DocumentsToolbar`)
- **Hooks**: `use` prefix (`useDocumentsPageContainer`, `useSelection`)
- **Containers**: `use*PageContainer` or `use*Container`
- **Handlers**: `handle*` (`handlePageChange`, `handleOpenUpload`)
- **Pure getters / helpers**: `get*` (`getDocumentStatusKind`, `getDocumentTableColumns`)
- **Constants**: UPPER_SNAKE or camelCase for config objects
- **Types**: PascalCase; interfaces for object shapes, `type` for unions/intersections

---

## 5. Code style (enforced by ESLint)

- **Quotes**: Single for JS/TS
- **Indent**: 2 spaces; no tabs
- **Semicolons**: Required
- **Line length**: Max 100 (ESLint `max-len`); ignore URLs, strings, template literals
- **Import order**: Groups — builtin → external → internal → parent → sibling → index; newlines between groups; alphabetized within group
- **No**: `var`, `any` (use proper types), `console.*` in app code (warn), `debugger` (error), duplicate imports
- **Prefer**: `const`/`let`, arrow callbacks, template literals, destructuring, optional chaining, nullish coalescing (`??`), object spread
- **Functions**: Max params 4 (warn); max statements per function 20 (warn); max lines per file 300 (warn)
- **Complexity**: Cyclomatic complexity cap 10 (warn)
- **React**: No array index as key; self-closing components; no deprecated APIs

---

## 6. React hook order (local ESLint rule)

Hooks must be declared in this order:

1. **State**: `useState`, `useReducer`
2. **Router / i18n / other “environment”**: `useNavigate`, `useLocation`, `useParams`, `useTranslation`, other `use*` that are not state/ref/memo/callback/effect
3. **Refs**: `useRef`
4. **Memo**: `useMemo`
5. **Callbacks**: `useCallback`
6. **Effects**: `useEffect`, `useLayoutEffect`

Custom hooks that follow this order are also checked. The rule is in `eslint-rules/hook-order.js`.

---

## 7. Containers & pages

- **Containers** (`use*PageContainer`):
  - Own all page-level state, API calls, and event handlers.
  - Return a **single object** grouped by concern so the page can destructure once, e.g.:
    - `data` (documents, routes, pagination, etc.)
    - `loading`, `error`
    - `filter` (handlers and filter state)
    - `selection` (selected ids, config, batch actions)
    - `paging` (pagination, handlePageChange, handlePerPageChange)
    - `actions` (all handle* / confirm* handlers)
    - `modals` (open flags and counts for modals)
  - Keep containers testable by passing in dependencies or mocking at the boundary (e.g. API modules).

- **Pages**:
  - Thin: one main container, layout, and composition of toolbar/table/modals.
  - Use `useTranslation()` for all user-facing strings (no hardcoded copy).
  - Prefer keeping page files under ~250 lines; split into subcomponents or hooks if they grow.

---

## 8. Navigate with state to reduce API calls

When the **parent** already has data from its API and the **child** route would otherwise refetch the same (or related) data, pass that data in **navigation state** so the child can use it and skip duplicate API calls.

**Pattern:**

1. **Parent** (e.g. documents list, folder detail): when navigating to a child (e.g. document detail, attachment view), call a shared navigation helper and pass the data you already have.
2. **Navigation helper** (e.g. in `src/shared/utils/navigation/navigateWithState.ts`): builds the path and calls `navigate(path, { state: { prefetchedDocument, ... } })` only when the prefetched payload matches the target (e.g. same document id).
3. **Child** (e.g. document detail page): in the data hook, read `useLocation().state`. If state contains prefetched data and the id matches the route param, use it and **do not** call the API. If state is missing (direct URL, refresh, back from elsewhere), **fall back to fetch** as normal.

**Conventions:**

- Define **typed route state** interfaces (e.g. `DocumentDetailRouteState`, `AttachmentViewRouteState`) and use `satisfies` in the navigate call so state is type-safe.
- Include a **prefetchedAt** (and optional **prefetchedFrom**) in state if you need to reason about staleness or debugging.
- Child must **validate** that the state applies to the current route (e.g. `routeState?.prefetchedDocument?.id === docId`) before using it; never trust state blindly (user can open a direct link or refresh).

**Where we use it:**

- **Document detail**: Parent (list or folder detail) passes `prefetchedDocument`; `useDocumentDetailData` uses it when ids match, else fetches.
- **Attachment view**: Parent passes `prefetchedDocTitle` and/or `prefetchedAttachments`; attachment view uses them to avoid extra `getDocument` / listAttachments calls.

This pattern is implemented in many places and significantly reduces redundant API calls when moving from list/detail parent views into child views.

---

## 9. Comments & documentation

- Add a **brief comment** on each function and on **complex hook usage** (e.g. non-obvious state or effect logic).
- For **services or pure modules** that encode non-trivial rules, add a short “HOW IT WORKS” or “CONSUMERS” block at the top (see e.g. `documentBatchActionsService.ts`).
- Use JSDoc where it helps (params, return, exported types).

---

## 10. TypeScript

- **Strict** mode on; no `any` (ESLint error); avoid non-null assertion when possible (warn).
- Prefer **optional chaining** and **nullish coalescing**.
- Use **`type`** for API entities and DTOs when re-exported from adapter; use **interfaces** for object shapes that may be extended.
- In tests, `@typescript-eslint/no-explicit-any` is turned off so mocks can use `any` where needed.

---

## 11. Services & pure logic

- Keep **business rules** in pure, framework-agnostic modules under `shared/services` or feature `utils` when they don’t need React.
- Document the contract (inputs, outputs, main rules) at the top of the file.
- Example: batch action visibility lives in `documentBatchActionsService`; containers call it and wire results to UI.

---

## 12. Testing

- **Unit / integration**: Vitest + React Testing Library. Test files **colocated** with source: `*.test.ts` or `*.test.tsx`.

**Production test rules:**

1. Tests must **only delete or modify** folders/files **that the test itself created**.
2. Do **not** add: delete folder, permanent delete, batch delete from list pages, or delete/trash of **existing** attachments/documents.
3. The **only** deletion allowed is of file(s) that the **same test** created.
4. When a test includes deletion, the **deletion flow must come last** — after every other operation in that test.

---

## 13. Git & workflow

- After every **AI-assisted code completion**, make a **git commit** with a **clear, proper commit message** (e.g. “feat(documents): add table sort by group column”, “fix(toolbar): disable batch trash when main docs selected”).

---

## 14. i18n

- All user-visible strings go through **react-i18next**: `const { t } = useTranslation();` then `t('common.save')`, `t('documents.uploadSuccess')`, etc.
- Keys are structured in JSON by namespace (e.g. `common`, `documents`, `folders`). Keep `en.json` and `ar.json` in sync.

---

## 15. Summary checklist

- [ ] Feature-based folders; path aliases for imports
- [ ] Containers own state and return grouped object; pages stay thin
- [ ] When navigating parent → child, pass already-fetched data in navigate state to avoid duplicate API calls; child validates and falls back to fetch when state missing
- [ ] Hooks in order: state → router/i18n → ref → memo → callback → effect
- [ ] Brief comments on functions and complex hooks; HOW IT WORKS on non-trivial services
- [ ] No `any`; strict TypeScript; optional chaining / nullish coalescing
- [ ] All copy via `t(...)`; keys in en.json / ar.json
- [ ] Tests only touch data they create; deletion last
- [ ] Commit after AI completion with a proper message

Use this as the single reference for “how we code” when starting or onboarding to another project.
