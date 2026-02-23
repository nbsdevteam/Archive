# 🎯 Complete Optimization Plan — Target 90-95+ All Categories
### Paste into Cursor in PLAN mode

```
Analyze the codebase and create a complete plan to fix ALL of the following issues.
Do NOT make any changes yet — only plan and confirm with me first.

---

## ISSUE 1 — charts-vendor (102KB) loading on every page [PERFORMANCE]

Root cause already identified:
- `src/features/dashboard/pages/DashboardPage.tsx` line 9 statically imports DepartmentDonutChart
- This pulls charts-vendor into the dashboard chunk eagerly
- `src/router/preloadUtils.tsx` may still reference DashboardPage

Plan to fix:
1. Read src/features/dashboard/pages/DashboardPage.tsx lines 1-15
2. Read src/router/preloadUtils.tsx full contents
3. Replace static import of DepartmentDonutChart with lazy:
   FROM: import { DepartmentDonutChart } from "../components/DepartmentDonutChart";
   TO:   const DepartmentDonutChart = lazy(() => import("../components/DepartmentDonutChart").then(m => ({ default: m.DepartmentDonutChart })));
4. Add lazy and Suspense to the react import if not present
5. Wrap both <DepartmentDonutChart> usages in <Suspense fallback={<div style={{ height: 300 }} />}>
6. Remove any remaining DashboardPage preload from preloadUtils.tsx

---

## ISSUE 2 — xyflow-vendor (49KB) loading on dashboard [PERFORMANCE]

Root cause:
- AuditLogsTreeView.tsx imports from @xyflow/react statically
- This component is only used on the Activity page but xyflow-vendor loads on dashboard

Plan to fix:
1. Read src/shared/components/Activity/AuditLogsTreeView.tsx lines 1-20
2. Find where AuditLogsTreeView is imported and used — it should only be in the Activity feature
3. Confirm it is already inside the lazy-loaded activity chunk
4. If AuditLogsTreeView is imported statically anywhere outside the activity feature, make it lazy

---

## ISSUE 3 — robots.txt still blocking indexing at line 3 [SEO — stuck at 63]

The audit shows: robots.txt line 3, column 0 is blocking indexing.
This means there is a Disallow: / or similar directive.

Plan to fix:
1. Read full contents of public/robots.txt
2. The file must contain ONLY these lines and nothing else:
   User-agent: *
   Allow: /
   Disallow: /api/
3. Remove any other Disallow lines, Sitemap lines, or noindex directives
4. Also grep index.html for any remaining noindex meta tag:
   grep -i "noindex" index.html

---

## ISSUE 4 — Google Fonts causing 688ms critical path delay [PERFORMANCE — FCP 1.9s]

The network tree shows: dashboard → fonts.googleapis.com (129ms) → fonts.gstatic.com (688ms)
This is the #1 reason FCP is stuck at 1.9s.

Plan to fix:
1. Find all Google Fonts references:
   grep -r "fonts.googleapis.com" index.html src/ --include="*.scss" --include="*.css" --include="*.ts"
2. Download Inter font weights 300, 400, 500 as woff2 files from https://gwfh.mranftl.com/fonts
   Save to public/assets/fonts/
3. Create src/shared/styles/fonts.css with @font-face declarations using font-display: swap
4. Import fonts.css as the FIRST import in src/main.tsx
5. Remove all Google Fonts <link> tags from index.html
6. Remove all @import url(fonts.googleapis.com) from any .scss files
7. Add preload hints in index.html for the woff2 files:
   <link rel="preload" href="/assets/fonts/inter-v13-latin-regular.woff2" as="font" type="font/woff2" crossorigin />
   <link rel="preload" href="/assets/fonts/inter-v13-latin-500.woff2" as="font" type="font/woff2" crossorigin />
8. Add preconnect for any remaining external font sources

---

## ISSUE 5 — Icon font files blocking render (Tabler 756KB, FA 155KB+116KB) [PERFORMANCE]

The network tree shows these loading in critical path:
- tabler-icons.woff2 — 756KB, 361ms
- fa-solid.woff2 — 155KB, 211ms
- fa-brands.woff2 — 116KB, 206ms

Plan to fix:
1. Check which icon libraries are actually used:
   grep -r "ti ti-\|tabler-icon" src/ --include="*.tsx" --include="*.ts" -l | wc -l
   grep -r "fa-\|fas \|fab \|far " src/ --include="*.tsx" --include="*.ts" --include="*.scss" -l | wc -l
   grep -r "bx-\|bxi-" src/ --include="*.tsx" --include="*.ts" -l | wc -l
   grep -r "ion-" src/ --include="*.tsx" --include="*.ts" -l | wc -l
2. For every icon library with ZERO usages: remove its import from main.tsx
3. For icon libraries that ARE used: add font-display: swap to their @font-face declarations
   Files to check:
   - src/assets/icon/tabler-icons/webfont/tabler-icons.css
   - src/assets/icon/boxicons/boxicons/css/boxicons.min.css
   - src/assets/icon/ionic/ionicons.css
4. Do NOT remove any icon library that has actual usages

---

## ISSUE 6 — Accessibility: contrast failures [ACCESSIBILITY — stuck at 91]

Three specific elements fail contrast:

6a — `a.text-primary` (gold #c9a86c on white #ffffff, ratio 2.25 — needs 4.5)
   This is the primary brand color used as link text.
   Fix: find where --bs-primary or .text-primary foreground color is defined in:
     src/shared/styles/theme-primary-overrides.css
     src/shared/styles/nbs-theme-bridge.css
     src/assets/scss/
   Darken ONLY the text/link color to #8a6428 (darker amber, still on-brand, passes 4.5:1)
   DO NOT change background or border uses of the primary color

6b — Active view toggle (white #fff on gold #c9a86c, ratio 2.25)
   Fix: find .folders__view-option--active or similar in src/features/folders/
   Change text color when active to #1a1a1a instead of white

6c — KBD element (grey #6b7280 on #e8e9ea, ratio 3.97)
   Fix: add to src/shared/styles/theme-primary-overrides.css:
     kbd { color: #4a5568; }

---

## ISSUE 7 — Accessibility: heading hierarchy [ACCESSIBILITY]

Audit shows h5 inside NBS Card component being used out of order.
The selector is: div.nbs__Card > div.header > div.d-flex > h5.mb-0

Plan to fix:
1. Find all places where NBS Card is used with a heading inside it:
   grep -r "CardHeader\|card-header\|mb-0.*h5\|h5.*mb-0" src/features/dashboard/ src/features/folders/ --include="*.tsx" -l
2. For each file found, check the heading level used inside the card header
3. Ensure headings inside cards follow the page hierarchy — if the page h1 is the page title
   and h2 is the section, card titles should be h3 not h5
4. Change heading tags only — do not change classNames, content, or styling

---

## ISSUE 8 — Accessibility: touch targets too small in NBS Sidebar [ACCESSIBILITY]

The audit shows NBS sidebar section toggle buttons are too small.
Selector: nbs__sidebar-module__sectionToggle

This is inside the NBS component library (StoryBook project), not this app.
Plan:
1. Note this as a StoryBook fix needed — the sidebar section toggle button needs
   min-height: 44px and min-width: 44px per WCAG touch target guidelines
2. This will be fixed in the StoryBook project separately — flag it but do not attempt
   to fix NBS internals from this app

---

## ISSUE 9 — Legacy JavaScript (8KB savings) [PERFORMANCE]

Lighthouse flagged legacy JS polyfills being included.
Plan to fix:
1. Check vite.config.ts build target — it should be 'es2020' or higher
2. Check if @babel/polyfill or core-js is imported anywhere:
   grep -r "core-js\|@babel/polyfill\|babel-polyfill" src/ --include="*.ts" --include="*.tsx"
3. If found, remove — modern browsers don't need these polyfills for es2020+ targets

---

## ISSUE 10 — Best Practices: HTTPS (currently 78, should be 96+) [BEST PRACTICES]

This is a FALSE POSITIVE caused by testing on 192.168.116.152 instead of localhost.
No code change needed.
Plan: final Lighthouse test MUST be run on http://localhost:4173/dashboard

---

## EXECUTION ORDER

After planning, execute in this exact order:
1. Issue 3 (robots.txt) — 2 min fix, immediate SEO impact
2. Issue 1 (charts-vendor lazy) — biggest JS impact
3. Issue 2 (xyflow lazy confirm) — secondary JS impact  
4. Issue 4 (self-host fonts) — biggest FCP impact
5. Issue 5 (icon font cleanup + font-display) — render blocking impact
6. Issue 6 (contrast fixes) — accessibility
7. Issue 7 (heading hierarchy) — accessibility
8. Issue 9 (legacy JS) — minor performance
9. Issue 8 (note for StoryBook) — document only

Then rebuild:
  npm run build && npm run preview

Run Lighthouse on http://localhost:4173/dashboard (NOT the IP).
Export and share the JSON report.

---

## SUCCESS CRITERIA

After all fixes:
- Performance:    90+ (from 79)
- SEO:            90+ (from 63) — robots.txt fix alone gets this
- Accessibility:  95+ (from 91) — contrast + heading fixes
- Best Practices: 95+ (from 78) — localhost testing removes false positive
- FCP:            < 1.0s (from 1.9s) — font self-hosting removes 688ms chain
- LCP:            < 1.5s (from 2.2s) — charts lazy + font fixes combined
```
