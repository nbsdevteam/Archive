# Lighthouse dashboard verification (authenticated)

To confirm that **feature-auth** and **feature-documents-notes** are not loaded on initial `/dashboard` (so they don’t show as “unused JavaScript” there):

1. Serve the build: `npm run preview -- --port 4173`
2. Open **http://localhost:4173** in Chrome (not incognito).
3. Log in so you have a session.
4. Go to **http://localhost:4173/dashboard**.
5. Open DevTools (F12) → **Lighthouse** tab.
6. Select **Performance**, then **Analyze page load**.
7. In the report, open **“Reduce unused JavaScript”** (or the performance audit that lists script URLs).
8. Confirm that **feature-auth** and **feature-documents-notes** do **not** appear in the list of scripts loaded on that page (or appear only as lazy-loaded after scroll/interaction). **charts-vendor** may appear if the donut chart is in view; it should load only when the chart enters the viewport (IntersectionObserver).

If those feature chunks still appear on dashboard load, the cause is likely a remaining static import from dashboard (or a shared module used by dashboard) into auth or documents; the earlier fixes (shared `useFolders`/`useNotifications`, `modulePreload` filter) are intended to prevent that.
