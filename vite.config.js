import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import path from "path";
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
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
                target: "http://192.168.116.15:8070",
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
                target: "ws://192.168.116.15:8070",
                /**
                 * Enables WebSocket proxying. Without this, WS upgrade requests won't be forwarded.
                 */
                ws: true,
            },
        },
    },
    build: {
        /** Target modern browsers for smaller output; tree shaking works best with ESM. */
        target: "es2020",
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
                assetFileNames: "assets/[name]-[hash][extname]",
                manualChunks(id) {
                    const normalizedId = id.split("\\").join("/");
                    if (normalizedId.includes("node_modules")) {
                        if (normalizedId.includes("react") ||
                            normalizedId.includes("react-dom") ||
                            normalizedId.includes("react-router-dom")) {
                            return "react-vendor";
                        }
                        if (normalizedId.includes("@mui") ||
                            normalizedId.includes("@emotion")) {
                            return "mui-vendor";
                        }
                        if (normalizedId.includes("react-bootstrap") ||
                            normalizedId.includes("react-feather") ||
                            normalizedId.includes("apexcharts")) {
                            return "ui-vendor";
                        }
                    }
                    const featureMatch = normalizedId.match(/\/src\/features\/([^/]+)\//);
                    if (featureMatch) {
                        return `feature-${featureMatch[1]}`;
                    }
                    return undefined;
                },
            },
        },
        chunkSizeWarningLimit: 1000,
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
