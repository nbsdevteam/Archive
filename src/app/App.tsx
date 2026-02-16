import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppProviders } from "./providers/AppProviders";
import { BootstrapDirectionSync } from "./providers/BootstrapDirectionSync";
import { AppRouter } from "./routes/AppRouter";
import { base_path } from "../environment";
import { usePrefersColorScheme } from "../shared/hooks";
import { LiveAnnouncerProvider } from "../shared/components/a11y/LiveAnnouncer";

const RTL_BODY_CLASS = "layout-mode-rtl";

/**
 * Syncs html dir/lang and body class for RTL when Arabic is active; leaves EN unchanged.
 */
function RtlSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const isAr = i18n.language === "ar";
    const root = document.documentElement;
    root.dir = isAr ? "rtl" : "ltr";
    root.lang = isAr ? "ar" : "en";
    if (isAr) {
      document.body.classList.add(RTL_BODY_CLASS);
    } else {
      document.body.classList.remove(RTL_BODY_CLASS);
    }
    return () => {
      root.dir = "ltr";
      root.lang = "en";
      document.body.classList.remove(RTL_BODY_CLASS);
    };
  }, [i18n.language]);
  return null;
}

/**
 * ToastContainer with resolved theme and RTL when Arabic is active.
 */
const ThemedToastContainer = () => {
  const { i18n } = useTranslation();
  const { prefersDark } = usePrefersColorScheme();
  const resolvedTheme = prefersDark ? "dark" : "light";
  const isRtl = i18n.language === "ar";

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={isRtl}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={resolvedTheme}
    />
  );
};

/**
 * App - Root component that composes providers and router
 * This is the new entry point that can replace the current main.tsx
 * once we're ready to fully migrate.
 */
export const App = () => {
  return (
    <BrowserRouter basename={base_path}>
      <AppProviders>
        <LiveAnnouncerProvider>
          <BootstrapDirectionSync />
          <RtlSync />
          <AppRouter />
          <ThemedToastContainer />
        </LiveAnnouncerProvider>
      </AppProviders>
    </BrowserRouter>
  );
};
