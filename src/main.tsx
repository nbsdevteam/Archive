import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React from "react";

import "./i18n/config";

// Run theme and layout stores at bootstrap so CSS vars and data-* are set before first paint
import "./shared/stores/themeColorStore";
import "./shared/stores/layoutStore";

// Global CSS: Bootstrap, app SCSS, icon fonts (Tabler + Font Awesome used in UI; others auditable for removal)
import "../src/assets/css/bootstrap.min.css";
import "../src/assets/css/feather.css";
import "../src/assets/scss/custom.scss";
import "../src/assets/icon/boxicons/boxicons/css/boxicons.min.css";
import "../src/assets/icon/weather/weathericons.css";
import "../src/assets/icon/typicons/typicons.css";
import "../src/assets/css/fontawesome/css/fontawesome.min.css";
import "../src/assets/css/fontawesome/css/all.min.css";
import "../src/assets/icon/ionic/ionicons.css";
import "../src/assets/icon/tabler-icons/webfont/tabler-icons.css";
import "@nbs/component-library/dist/styles.css";
import "../src/shared/styles/nbs-sidebar-overrides.css";
import "../src/shared/styles/nbs-theme-bridge.css";
import "../src/shared/styles/theme-primary-overrides.css";
import "../src/shared/styles/control-heights.css";
import "../src/assets/js/bootstrap.bundle.min.js";

// Initialize preloading for better performance
import { initializePreloading } from "./router/preloadUtils";
initializePreloading();

// Import the new App component (replaces the old provider/router setup)
import { App } from "./app/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </StrictMode>
);
