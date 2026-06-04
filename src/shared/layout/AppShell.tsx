import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../../app/shell/header";
import Sidebar from "../../app/shell/sidebar";
import ThemeSettings from "../../app/shell/theme-settings";
import { useSidebarUiStore } from "../stores/sidebarUiStore";
import { ShortcutsProvider } from "../shortcuts/ShortcutsContext";
import { ShortcutsOverlay } from "../components/ShortcutsOverlay";
import { DocumentExpiryReminderMarquee } from "../components/reminders/DocumentExpiryReminderProvider";

/** Prevents event from bubbling so sidebar overlay does not close sidebar on click. */
function stopSidebarOverlayPropagation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export const AppShell = () => {
  const location = useLocation();
  const {
    mobileSidebar,
    miniSidebar,
    headerCollapse,
    resetMobileSidebar,
  } = useSidebarUiStore();

  useEffect(() => {
    const body = document.body;
    body.classList.toggle("mini-sidebar", miniSidebar);
    body.classList.toggle("header-collapse", headerCollapse);
    return () => {
      body.classList.remove("mini-sidebar", "header-collapse");
    };
  }, [miniSidebar, headerCollapse]);

  useEffect(() => {
    resetMobileSidebar();
  }, [location.pathname, resetMobileSidebar]);

  return (
    <ShortcutsProvider>
      <div className={`main-wrapper ${mobileSidebar ? "slide-nav" : ""}`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {/* Backdrop when sidebar is open; click does not close sidebar (outside click disabled) */}
        {mobileSidebar && (
          <div
            className="sidebar-overlay opened"
            aria-hidden="true"
            onClick={stopSidebarOverlayPropagation}
            onPointerDown={stopSidebarOverlayPropagation}
            style={{ pointerEvents: "auto", cursor: "default" }}
          />
        )}
        <Header />
        <DocumentExpiryReminderMarquee />
        <Sidebar />
        <Outlet />
        <ThemeSettings />
      </div>
      <ShortcutsOverlay />
    </ShortcutsProvider>
  );
};
