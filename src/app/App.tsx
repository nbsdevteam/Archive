import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./routes/AppRouter";
import { base_path } from "../environment";
import { usePrefersColorScheme } from "../shared/hooks";
import { LiveAnnouncerProvider } from "../shared/components/a11y/LiveAnnouncer";

const RTL_BODY_CLASS = "layout-mode-rtl";

/**
 * Syncs body class for RTL when Arabic is active.
 */
function RtlSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language === "ar") {
      document.body.classList.add(RTL_BODY_CLASS);
    } else {
      document.body.classList.remove(RTL_BODY_CLASS);
    }
    return () => document.body.classList.remove(RTL_BODY_CLASS);
  }, [i18n.language]);
  return null;
}

/**
 * ToastContainer with resolved theme from Redux + system preference.
 */
const ThemedToastContainer = () => {
  const { prefersDark } = usePrefersColorScheme();
  const resolvedTheme = prefersDark ? "dark" : "light";

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
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
          <RtlSync />
          <AppRouter />
          <ThemedToastContainer />
        </LiveAnnouncerProvider>
      </AppProviders>
    </BrowserRouter>
  );
};
