import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./i18n/config";

// Self-hosted Inter (font-display: swap) — first so FCP isn’t blocked by Google Fonts
import "./shared/styles/fonts.css";

// Run theme and layout stores at bootstrap so CSS vars and data-* are set before first paint
import "./shared/stores/themeColorStore";
import "./shared/stores/layoutStore";

// Global CSS: Bootstrap LTR/RTL from head link (pre-paint); app SCSS; icon fonts (Font Awesome + Tabler only — others removed for performance)
import "../src/assets/scss/custom.scss";
import "../src/shared/styles/arabic-font.scss";
import "../src/shared/styles/rtl-overrides.scss";
import "../src/assets/css/fontawesome/css/fontawesome.min.css";
import "../src/assets/css/fontawesome/css/all.min.css";
import "../src/assets/icon/tabler-icons/webfont/tabler-icons.css";
import "@nbs/component-library/dist/styles.css";
import "../src/shared/styles/nbs-sidebar-overrides.css";
import "../src/shared/styles/nbs-theme-bridge.css";
import "../src/shared/styles/theme-primary-overrides.css";
import "../src/shared/styles/control-heights.css";
import "../src/shared/styles/skip-link.css";
import "../src/shared/styles/mobile-view-overrides.css";
import "../src/assets/js/bootstrap.bundle.min.js";

// Import the new App component (replaces the old provider/router setup)
import { App } from "./app/App";

// StrictMode doubles effects in dev (mount, unmount, remount), causing duplicate API calls.
// We disable it in development to ensure each effect runs only once during QA.
// Production builds don't have this double-invocation behavior, so we keep it there.
createRoot(document.getElementById("root")!).render(
  import.meta.env.DEV ? (
    <App />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  ),
);
