import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../../core/common/header";
import Sidebar from "../../core/common/sidebar";
import ThemeSettings from "../../core/common/theme-settings";
import { useSidebarUiStore } from "../stores/sidebarUiStore";

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
    <div className={`main-wrapper ${mobileSidebar ? "slide-nav" : ""}`}>
      <Header />
      <Sidebar />
      <Outlet />
      <ThemeSettings />
    </div>
  );
};
