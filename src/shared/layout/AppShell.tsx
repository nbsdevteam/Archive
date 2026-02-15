import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../../core/common/header";
import Sidebar from "../../core/common/sidebar";
import ThemeSettings from "../../core/common/theme-settings";
import { useSidebarUiStore } from "../stores/sidebarUiStore";
import { ShortcutsProvider } from "../shortcuts/ShortcutsContext";
import { ShortcutsOverlay } from "../components/ShortcutsOverlay";

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
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: "auto", cursor: "default" }}
          />
        )}
        <Header />
        <Sidebar />
        <Outlet />
        <ThemeSettings />
      </div>
      <ShortcutsOverlay />
    </ShortcutsProvider>
  );
};
