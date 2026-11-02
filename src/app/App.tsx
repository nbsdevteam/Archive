import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppProviders } from "./providers/AppProviders";
import { BootstrapDirectionSync } from "./providers/BootstrapDirectionSync";
import { AppRouter } from "./routes/AppRouter";
import { base_path } from "../environment";
import { useThemeModeStore } from "../shared/stores/themeModeStore";
import { LiveAnnouncerProvider } from "../shared/components/a11y/LiveAnnouncer";
import { DocumentExpiryReminderProvider } from "../shared/components/reminders/DocumentExpiryReminderProvider";
import { AuthSessionBootstrap } from "./providers/AuthSessionBootstrap";

const RTL_BODY_CLASS = "layout-mode-rtl";

/**
 * Syncs html dir/lang and body class for RTL when Arabic is active; leaves EN unchanged.
 */
/** True when current language is Arabic (handles ar, ar-SA, etc.). */
function isArabic(i18n: { language: string; resolvedLanguage?: string }): boolean {
  const lng = i18n.resolvedLanguage ?? i18n.language;
  return typeof lng === "string" && lng.startsWith("ar");
}

function RtlSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const isAr = isArabic(i18n);
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
  }, [i18n.language, i18n.resolvedLanguage]);
  return null;
}

/**
 * ToastContainer with resolved theme and RTL when Arabic is active.
 */
const ThemedToastContainer = () => {
  const { i18n } = useTranslation();
  const resolvedTheme = useThemeModeStore((s) => s.mode);
  const isRtl = isArabic(i18n);

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
          <AuthSessionBootstrap />
          <AppRouter />
          <ThemedToastContainer />
          <DocumentExpiryReminderProvider />
        </LiveAnnouncerProvider>
      </AppProviders>
    </BrowserRouter>
  );
};
