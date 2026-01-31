The project should follow the feature based architecture exactly as defined below, Take the architecture as an example and scaffold it. Structure folder and files according to needs as they follow the architecture.

**Most important**
**FOLLOW KISS and DRY Approach**
 -> function and variable anming should be stupid simple
 -> Wrtie brief comments on each function and complex logics
 -> Never use inline functions on event handlers and when passing to child components wrap them in useCallback  with appropriate dependencies when passing to the child components.
**Follow this approach for hooks heirarchy wise**
 ->UseState on top then useRefs > useMemo > useCallback > functions > lastly just before return part should be the useEffects. 
 No static code inside the page static code, map generation,object generation all should be made outside the page file and then imported into the page file if needed. Keep them in utils folder if needed. 
 Pages should only be used to display the UI data no calculation no generation inside of it, should be moved to hooks and utils if needed.
 

## Project Structure Example

```
src/
├── app/
│   ├── providers/
│   │   ├── AppProviders.tsx          # Composition of all providers
│   │   ├── ThemeProvider.tsx         # Theme context
│   │   └── ErrorBoundary.tsx         # Error boundary wrapper
│   │
│   ├── router/
│   │   ├── AppRouter.tsx             # Main router component
│   │   ├── routes.tsx                # Route definitions
│   │   ├── ProtectedRoute.tsx        # Auth guard
│   │   ├── PublicRoute.tsx           # Guest-only routes
│   │   └── index.ts
│   │
│   ├── store/
│   │   ├── index.ts                  # Store exports
│   │   ├── useAuthStore.ts           # Auth state (Zustand)
│   │   ├── useUIStore.ts             # UI state (Zustand)
│   │   ├── useUserStore.ts           # User preferences
│   │   └── middleware/
│   │       ├── persist.ts            # Persist configuration
│   │       └── devtools.ts           # Devtools configuration
│   │
│   ├── styles/
│   │   ├── globals.css               # Global styles + Tailwind directives
│   │   ├── tailwind.config.ts        # Tailwind configuration
│   │   └── theme.ts                  # Theme tokens/variables
│   │
│   ├── App.tsx                       # Root component
│   └── main.tsx                      # Entry point + providers
│
├── features/
│   │
│   ├── auth/
│   │   ├── api/
│   │   │   ├── authApi.ts            # Axios API calls
│   │   │   └── index.ts
│   │   │
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── SocialLoginButtons.tsx
│   │   │   ├── PasswordStrength.tsx
│   │   │   ├── OAuthCallback.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useLogin.ts           # Login logic with Actions
│   │   │   ├── useRegister.ts
│   │   │   ├── useAuth.ts            # Auth state from Zustand
│   │   │   ├── usePasswordReset.ts
│   │   │   ├── useOAuth.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   ├── VerifyEmailPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── schemas/
│   │   │   ├── loginSchema.ts        # Zod schemas
│   │   │   ├── registerSchema.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── styles/
│   │   │   ├── LoginPage.css
│   │   │   ├── RegisterPage.css
│   │   │   ├── ForgotPasswordPage.css
│   │   │   ├── ResetPasswordPage.css
│   │   │   ├── VerifyEmailPage.css
│   │   │   └── index.ts
│   │   │
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── user.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── token.ts
│   │   │   ├── storage.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                  # Public API
│   │
│   ├── dashboard/
│   │   ├── api/
│   │   │   ├── dashboardApi.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── components/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── ActivityList.tsx
│   │   │   ├── RecentOrders.tsx
│   │   │   ├── ChartWidget.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDashboardData.ts
│   │   │   ├── useDashboardFilters.ts
│   │   │   ├── useStatsCalculation.ts
│   │   │   ├── useExportData.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── store/
│   │   │   ├── useDashboardStore.ts  # Zustand store
│   │   │   └── index.ts
│   │   │
│   │   ├── styles/
│   │   │   ├── DashboardPage.css
│   │   │   ├── AnalyticsPage.css
│   │   │   ├── ReportsPage.css
│   │   │   └── index.ts
│   │   │
│   │   ├── types/
│   │   │   ├── dashboard.types.ts
│   │   │   ├── analytics.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── chartHelpers.ts
│   │   │   ├── dataTransform.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── products/
│   │   ├── api/
│   │   │   ├── productsApi.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductFilters.tsx
│   │   │   ├── ProductDetails.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductImage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useProducts.ts
│   │   │   ├── useProductFilters.ts
│   │   │   ├── useProductActions.ts  # CRUD operations
│   │   │   ├── useProductSearch.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── CreateProductPage.tsx
│   │   │   ├── EditProductPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── schemas/
│   │   │   ├── productSchema.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── store/
│   │   │   ├── useProductsStore.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── styles/
│   │   │   ├── ProductsPage.css
│   │   │   ├── ProductDetailPage.css
│   │   │   ├── CreateProductPage.css
│   │   │   ├── EditProductPage.css
│   │   │   └── index.ts
│   │   │
│   │   ├── types/
│   │   │   ├── product.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── productHelpers.ts
│   │   │   ├── pricing.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   └── users/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── schemas/
│       ├── store/
│       ├── styles/
│       ├── types/
│       ├── utils/
│       └── index.ts
│
├── shared/
│   │
│   ├── components/
│   │   ├── ui/                       # Base UI components (shadcn-style)
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── button.variants.ts
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Input/
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Input.test.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ModalHeader.tsx
│   │   │   │   ├── ModalBody.tsx
│   │   │   │   ├── ModalFooter.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Card/
│   │   │   ├── Table/
│   │   │   ├── Select/
│   │   │   ├── Dropdown/
│   │   │   ├── Spinner/
│   │   │   ├── Toast/
│   │   │   ├── Avatar/
│   │   │   ├── Badge/
│   │   │   ├── Tabs/
│   │   │   ├── Accordion/
│   │   │   ├── Alert/
│   │   │   ├── Progress/
│   │   │   ├── Skeleton/
│   │   │   ├── Tooltip/
│   │   │   ├── Popover/
│   │   │   ├── Dialog/
│   │   │   ├── Checkbox/
│   │   │   ├── Radio/
│   │   │   ├── Switch/
│   │   │   └── index.ts
│   │   │
│   │   ├── form/                     # Form components
│   │   │   ├── FormField/
│   │   │   ├── FormError/
│   │   │   ├── FormLabel/
│   │   │   └── index.ts
│   │   │
│   │   ├── feedback/                 # User feedback
│   │   │   ├── ErrorBoundary/
│   │   │   ├── EmptyState/
│   │   │   ├── LoadingState/
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── layouts/
│   │   ├── MainLayout/
│   │   │   ├── MainLayout.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── AuthLayout/
│   │   │   ├── AuthLayout.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── DashboardLayout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── components/
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── UserMenu.tsx
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── SidebarNav.tsx
│   │   │   │   ├── SidebarItem.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── Footer/
│   │   │   └── Breadcrumbs/
│   │   │
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useSessionStorage.ts
│   │   ├── useClickOutside.ts
│   │   ├── useIntersectionObserver.ts
│   │   ├── usePagination.ts
│   │   ├── useToggle.ts
│   │   ├── useTimeout.ts
│   │   ├── useInterval.ts
│   │   ├── useCopyToClipboard.ts
│   │   ├── useEventListener.ts
│   │   ├── useWindowSize.ts
│   │   ├── useOnScreen.ts
│   │   ├── usePrevious.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── format/
│   │   │   ├── date.ts
│   │   │   ├── currency.ts
│   │   │   ├── number.ts
│   │   │   ├── string.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── validation/
│   │   │   ├── email.ts
│   │   │   ├── password.ts
│   │   │   ├── phone.ts
│   │   │   ├── url.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── cn.ts                     # tailwind-merge + clsx
│   │   ├── storage.ts
│   │   ├── api.ts
│   │   ├── error.ts
│   │   ├── logger.ts
│   │   ├── sentry.ts
│   │   └── index.ts
│   │
│   ├── lib/
│   │   ├── axios.ts                  # Axios instance & interceptors
│   │   ├── i18n.ts                   # i18next config
│   │   └── index.ts
│   │
│   ├── constants/
│   │   ├── routes.ts                 # Route paths
│   │   ├── config.ts                 # App config
│   │   ├── api-endpoints.ts          # API URLs
│   │   ├── regex.ts                  # Common regex patterns
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── api.types.ts              # API response types
│   │   ├── common.types.ts           # Shared types
│   │   ├── env.d.ts                  # Environment variables
│   │   └── index.ts
│   │
│   └── styles/
│       └── tailwind/
│           ├── plugins.ts            # Custom Tailwind plugins
│           └── animations.ts         # Custom animations
│
├── assets/
│   ├── images/
│   │   ├── logos/
│   │   ├── backgrounds/
│   │   └── illustrations/
│   │
│   ├── icons/
│   │   └── index.ts
│   │
│   └── fonts/
│       └── index.ts
│
├── tests/
│   ├── setup.ts
│   ├── utils/
│   │   ├── test-utils.tsx            # Custom render with providers
│   │   ├── mocks/
│   │   │   ├── handlers.ts           # MSW handlers
│   │   │   ├── server.ts             # MSW server
│   │   │   └── data.ts               # Mock data
│   │   └── index.ts
│   │
│   └── e2e/                          # Playwright/Cypress tests
│       ├── auth.spec.ts
│       ├── products.spec.ts
│       └── dashboard.spec.ts
│
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── manifest.json
│
└── config files (root)
    ├── .env.example
    ├── .env.local
    ├── .eslintrc.cjs
    ├── .prettierrc
    ├── .gitignore
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── vitest.config.ts
    └── package.json
```

---



React Router dom
Core
* React 19 - UI library with new compiler, actions, and improved hooks
* TypeScript 5+ - Type safety and developer experience
* Vite 6 - Fast build tool and dev server
* React Router DOM v7  - Client-side routing 
* React Context - Theme, auth context when needed
* Zustand - Lightweight state management (primary)
* Styling
    * Tailwind CSS v3+ - Utility-first CSS framework
    * CSS Modules - Component-scoped styles (when needed)
    * clsx / tailwind-merge - Conditional class management
* Data Fetching & API
   * Axios - HTTP client
   * Zod - Runtime validation & type inference
* Forms & Validation
   * React Hook Form - Performant form management
   * Zod - Schema validation
   * @hookform/resolvers - Integration between RHF and Zod
   * ------------------------
* UI Components
      * Framer Motion - Animation library
      * Lucide React - Icon library
* ----------
* Additional Tools
         *  day.js - Date manipulation
         *  sonner - Toast notifications

---

## Fonts & Typography (Global)

Use **Inter** for labels and headings, and **Roboto** for numeric value text. All typography is controlled via global CSS classes so font styling stays consistent across the app.

### Folder structure

- `src/app/styles/`
  - `globals.css` — Global reset, theme tokens, typography utilities
  - `fonts.css` — Google Fonts imports for Inter and Roboto
  - `typography.css` — Global semantic classes (labels, headings, values)
- `src/assets/fonts/` — Optional; reserved for future self-hosted font files. For now, fonts are loaded via Google Fonts.

### Font loading (Google Fonts)

- **Inter** — UI labels and headings
- **Roboto** — Numeric-heavy value text and tabular numerals

Load these in `fonts.css` (or existing SCSS variables) via `@import` or `<link>` from Google Fonts.

### Font family + weight primitives

Global classes that set font family and weight only. Use these when you need explicit Inter/Roboto styling:

| Class    | Meaning        | Use |
|---------|----------------|-----|
| `.InterL`  | Inter Light    | Light labels |
| `.InterN`  | Inter Normal   | Body / default text |
| `.InterM`  | Inter Medium   | Emphasized labels |
| `.InterSB` | Inter SemiBold | Subheadings |
| `.InterB`  | Inter Bold     | Headings |
| `.RobotoN` | Roboto Normal  | Numeric body |
| `.RobotoM` | Roboto Medium  | Numeric emphasis |
| `.RobotoB` | Roboto Bold    | Key numbers |
| `.Num`     | Numeric utility | Sets `font-family: Roboto, ...`, `font-variant-numeric: tabular-nums`, `letter-spacing: normal` for numbers |

### Semantic text roles (headings, labels, values)

Use these global classes by default so typography stays consistent:

- **Headings (card sections)**  
  - `.tHeading1` — Card header / primary section title (largest)  
  - `.tHeading2` — Sub-section header (smaller)
- **Labels**  
  - `.tLabel` — Field label / descriptor  
  - `.tLabelMuted` — Secondary label
- **Values**  
  - `.tValue` — Field value (slightly heavier than label)  
  - `.tValueStrong` — Key metric  
  - `.tValueNum` — Value with numeric font (e.g. `.tValue.Num` or combined class)

### Size hierarchy (“3 levels” card rule)

Use a descending hierarchy on cards and detail views:

1. **Card header** — `.tHeading1` (largest)
2. **Row label** — `.tLabel` (smallest)
3. **Row value** — `.tValue` (between label and header, heavier weight)
4. **Secondary section** — `.tHeading2` + `.tValue` (slightly smaller than the first section)

Example (pseudo-JSX):

```jsx
<div className="card">
  <h2 className="tHeading1">Document details</h2>
  <div className="row">
    <span className="tLabel">Created</span>
    <span className="tValue">Jan 15, 2025</span>
  </div>
  <h3 className="tHeading2">Metadata</h3>
  <div className="row">
    <span className="tLabel">Size</span>
    <span className="tValue Num tValueNum">1.2 MB</span>
  </div>
</div>
```

---

## Styling: Tailwind + CSS Modules

- **Global CSS** (`src/app/styles/`) is for tokens, typography, and layout primitives (including the classes above).
- **Feature/page CSS Modules** (`*.module.css`, `*.module.scss`) are for component- and page-scoped structure only; avoid duplicating typography rules there.
- If Tailwind is added later, typography role classes (e.g. `tHeading1`, `tLabel`, `tValue`) can be implemented in `@layer utilities` or kept in global CSS.

---

## CSS nesting rules (page-scoped styles)

Applies to:

- `*.module.css` (with PostCSS nesting enabled via `postcss-nesting`)
- `*.module.scss` (native SCSS nesting)

Conventions:

1. **Single root class per page** — Use one top-level class for the page (e.g. `.page`, `.dashboardPage`).
2. **Nest children under the root** — Keep all selectors under that root using `&` so styles stay page-scoped:

   ```css
   .page {
     & .header { ... }
     & .content { ... }
     & .card { ... }
   }
   ```

3. **No top-level global element selectors in CSS Modules** — Do not define bare `div`, `h1`, etc. at the top level; nest them under the page root (e.g. `.page div`, `.page h1`) to avoid leaking styles.

---

## Build & chunk splitting (Vite 6)

- **Route-level code splitting** — Lazy `import()` in the router (e.g. `src/router/lazyRoutes.tsx`) already creates separate chunks per route.
- **Replace hardcoded `manualChunks`** — The current `vite.config.ts` uses a long list of paths under `src/feature-module/...`. Prefer a **pattern-based** strategy aligned with `src/features/`:
  - One vendor chunk per major dependency group (e.g. react-vendor, ui-vendor).
  - One chunk per feature: `src/features/<featureName>/` → chunk name `feature-<featureName>`.
  - Put `src/shared/` in a single `shared` chunk.

Example `manualChunks(id)` (conceptual):

```ts
manualChunks(id) {
  if (id.includes('node_modules')) {
    if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
    if (id.includes('antd') || id.includes('react-bootstrap')) return 'ui-vendor';
    return 'vendor';
  }
  if (id.includes('/src/features/')) {
    const match = id.match(/\/src\/features\/([^/]+)\//);
    return match ? `feature-${match[1]}` : undefined;
  }
  if (id.includes('/src/shared/')) return 'shared';
}
```

- **Preloading** — Helpers like `src/router/preloadUtils.tsx` should preload **feature-route chunks** (paths under `src/features/...`), not legacy `feature-module` chunks, as the app migrates to the new structure.