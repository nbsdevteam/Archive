import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240,
    }),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
    }),
  ],
  resolve: {
    /** Ensures a single React instance so MUI and app share the same hooks (avoids Invalid hook call). */
    dedupe: ["react", "react-dom"],
    alias: {
      global: "globalthis", // 👈 critical for "global is not defined"
      "@": path.resolve(__dirname, "src"),
      moment: "moment/moment.js",
    },
  },
  optimizeDeps: {
    /** Pre-bundle React so MUI and other deps resolve to this copy (single React instance). */
    include: ["react", "react-dom"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
  server: {
    /**
     * Dev server settings (only used when you run `vite`/`npm run dev`).
     * strictPort: true ensures the server fails if 3003 is in use (no fallback port).
     */
    port: 3003,
    strictPort: true,
    host: true,
    proxy: {
      /**
       * Proxy rules (development only).
       *
       * Why proxy?
       * - Your frontend is served from `http://localhost:3003`
       * - Your backend is on a different origin (different host/port)
       * - Browsers enforce CORS rules across origins
       * - Proxying makes requests look "same-origin" from the browser's perspective
       *
       * Result:
       * - Your frontend code can call `/api/...`
       * - Vite forwards that request to the backend target below
       */
      "/api": {
        target: "http://192.168.116.211:8069",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
      /**
       * WebSocket proxy (development only).
       * If the backend exposes WS at `/websocket`, the frontend can connect to:
       *   ws://localhost:3003/websocket
       * and Vite will forward it to the backend WS server.
       */
      "/websocket": {
        target: "ws://192.168.116.211:8069",
        /**
         * Enables WebSocket proxying. Without this, WS upgrade requests won't be forwarded.
         */
        ws: true,
      },
    },
  },
  build: {
    /** Target modern browsers for smaller output; tree shaking works best with ESM. */
    target: "es2022",
    /**
     * Stop Vite from adding <link rel="modulepreload"> for lazy feature/chart chunks.
     * By default Vite preloads ALL dynamic-import targets, which makes every feature
     * chunk download on every page — defeating lazy loading entirely.
     * We keep vendor preloads (react, router, i18n, etc.) for fast initial paint,
     * but skip feature-* and heavy optional vendors so they only load on demand.
     */
    modulePreload: {
      resolveDependencies(_url: string, deps: string[]) {
        return deps.filter(
          (dep) =>
            !dep.includes("/feature-") &&
            !dep.includes("/charts-vendor") &&
            !dep.includes("/xyflow-vendor") &&
            !dep.includes("/http-vendor") &&
            !dep.includes("/floating-vendor") &&
            !dep.includes("/AuditLogs"),
        );
      },
    },
    /** Single predictable CSS bundle so we can safely preload `/assets/index.css` in index.html. */
    cssCodeSplit: false,
    /** Enable Rollup tree shaking: remove unused exports and dead code. */
    rollupOptions: {
      treeshake: {
        moduleSideEffects: "no-external",
        propertyReadSideEffects: false,
      },
      output: {
        /** Named chunks improve caching and allow better tree-shaken vendor splits. */
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? "";
          if (name.endsWith(".css")) return "assets/index.css";
          return "assets/[name]-[hash][extname]";
        },
        manualChunks(id) {
          const normalizedId = id.split("\\").join("/");
          // React core — must load first
          if (
            normalizedId.includes("node_modules/react/") ||
            normalizedId.includes("node_modules/react-dom/")
          ) {
            return "react-vendor";
          }
          // React Router — separate from react core
          if (normalizedId.includes("node_modules/react-router")) {
            return "router-vendor";
          }
          // ApexCharts — very large, only used on Dashboard page
          if (
            normalizedId.includes("node_modules/apexcharts") ||
            normalizedId.includes("node_modules/react-apexcharts")
          ) {
            return "charts-vendor";
          }
          // Form libraries
          if (
            normalizedId.includes("node_modules/react-hook-form") ||
            normalizedId.includes("node_modules/@hookform")
          ) {
            return "forms-vendor";
          }
          // i18n
          if (
            normalizedId.includes("node_modules/i18next") ||
            normalizedId.includes("node_modules/react-i18next")
          ) {
            return "i18n-vendor";
          }
          // XYFlow
          if (normalizedId.includes("node_modules/@xyflow")) {
            return "xyflow-vendor";
          }
          // NBS component library
          if (normalizedId.includes("node_modules/@nbs")) {
            return "nbs-vendor";
          }
          // Lucide icons — consolidate into one chunk so icons aren't duplicated
          // across feature chunks (tree-shaking already eliminates unused icons,
          // but without this they get inlined separately into each chunk that uses them).
          if (normalizedId.includes("node_modules/lucide-react")) {
            return "lucide-vendor";
          }
          // Do NOT split out react-datepicker/react-select/date-fns into datepicker-vendor:
          // it created a circular chunk (feature-dashboard -> feature-auth -> datepicker-vendor -> feature-dashboard)
          // and "cannot access r before initialization" at runtime. Keep them in feature-auth (and in
          // the lazy DateRangePickerModal chunk when used from documents/folders).
          // HTTP client — shared across features
          if (normalizedId.includes("node_modules/axios")) {
            return "http-vendor";
          }
          // Floating UI (tooltips, popovers) — used by react-select and others
          if (normalizedId.includes("node_modules/@floating-ui")) {
            return "floating-vendor";
          }
          // Feature-level chunks — each feature loads independently
          if (normalizedId.includes("/src/features/")) {
            const match = normalizedId.match(/\/src\/features\/([^/]+)\//);
            if (match) {
              const name = match[1];
              // Notes and documents import each other; merge to avoid circular chunk warning.
              if (name === "notes" || name === "documents") return "feature-documents-notes";
              return `feature-${name}`;
            }
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 1,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    /** Skip compressed size report for faster builds; use build:analyze when needed. */
    reportCompressedSize: true,
  },
});
