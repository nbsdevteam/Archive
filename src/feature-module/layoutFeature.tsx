import { useSelector } from "react-redux";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../core/common/header";
import Sidebar from "../core/common/sidebar";
import { useEffect, useState, useMemo } from "react";
import HorizontalSidebar from "../core/common/horizontal-sidebar";
import TwoColumnSidebar from "../core/common/two-column";
import StackedSidebar from "../core/common/stacked-sidebar";
import DeleteModal from "../core/modals/deleteModal";
import React from "react";
import type { AppRootState as RootState } from "../core/data/redux/store";

// Layout configuration mapping with all necessary attributes
const layoutConfig: Record<string, { 
  dataLayout: string; 
  bodyClass: string;
  dataWidth?: string;
  dataTheme?: string;
  rtlClass?: string;
  removeTopbarColor?: boolean;
}> = {
  "/layout-horizontal": { dataLayout: "horizontal", bodyClass: "menu-horizontal" },
  "/layout-horizontal-single": { dataLayout: "horizontal-single", bodyClass: "" },
  "/layout-horizontal-overlay": { dataLayout: "horizontal-overlay", bodyClass: "" },
  "/layout-horizontal-box": { dataLayout: "horizontal-box", bodyClass: "layout-box-mode", dataWidth: "box" },
  "/layout-horizontal-sidemenu": { dataLayout: "horizontal-sidemenu", bodyClass: "", removeTopbarColor: true },
  "/layout-detached": { dataLayout: "detached", bodyClass: "" },
  "/layout-modern": { dataLayout: "modern", bodyClass: "" },
  "/layout-twocolumn": { dataLayout: "twocolumn", bodyClass: "" },
  "/layout-hovered": { dataLayout: "hovered", bodyClass: "" },
  "/layout-box": { dataLayout: "mini", bodyClass: "mini-sidebar layout-box-mode", dataWidth: "box" },
  "/layout-transparent": { dataLayout: "transparent", bodyClass: "" },
  "/layout-without-header": { dataLayout: "without-header", bodyClass: "" },
  "/layout-rtl": { dataLayout: "rtl", bodyClass: "layout-mode-rtl", rtlClass: "layout-mode-rtl" },
  "/layout-dark": { dataLayout: "default", bodyClass: "", dataTheme: "dark" },
  "/layout-default": { dataLayout: "default", bodyClass: "" },
  "/layout-mini": { dataLayout: "mini", bodyClass: "mini-sidebar" },
};

const LayoutFeature = React.memo(() => {
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const location = useLocation();

  const mobileSidebar = useSelector(
    (state: RootState) => state.sidebarSlice.mobileSidebar
  );
  const dataLoader = useSelector(
    (state: RootState) => state.themeSetting.dataLoader
  );
  const dataSidebarAll = useSelector(
    (state: RootState) => state.themeSetting.dataSidebarAll
  );
  const dataColorAll = useSelector(
    (state: RootState) => state.themeSetting.dataColorAll
  );
  const dataTopBarColorAll = useSelector(
    (state: RootState) => state.themeSetting.dataTopBarColorAll
  );
  const dataTopbarAll = useSelector(
    (state: RootState) => state.themeSetting.dataTopbarAll
  );
  // Get other theme attributes from Redux (these won't be overridden by layout)
  const dataCard = useSelector(
    (state: RootState) => state.themeSetting.dataCard
  );
  const dataSidebar = useSelector(
    (state: RootState) => state.themeSetting.dataSidebar
  );
  const dataTopBar = useSelector(
    (state: RootState) => state.themeSetting.dataTopBar
  );
  const dataTopBarColor = useSelector(
    (state: RootState) => state.themeSetting.dataTopBarColor
  );
  const dataColor = useSelector(
    (state: RootState) => state.themeSetting.dataColor
  );
  const dataSidebarBg = useSelector(
    (state: RootState) => state.themeSetting.dataSidebarBg
  );
  const dataTopbarBg = useSelector(
    (state: RootState) => state.themeSetting.dataTopbarBg
  );
  const dataThemeRedux = useSelector(
    (state: RootState) => state.themeSetting.dataTheme
  );

  // Get layout config based on current path
  const currentLayoutConfig = useMemo(() => {
    return layoutConfig[location.pathname] || { dataLayout: "default", bodyClass: "" };
  }, [location.pathname]);

  // Memoize the CSS variables string
  const cssVariablesString = useMemo(
    () => `
    :root {
      --sidebar--rgb-picr: ${dataSidebarAll};
      --topbar--rgb-picr:${dataTopbarAll};
      --topbarcolor--rgb-picr:${dataTopBarColorAll};
      --primary-rgb-picr:${dataColorAll};
    }
  `,
    [dataSidebarAll, dataTopbarAll, dataTopBarColorAll, dataColorAll]
  );

  // All layout-specific body classes
  const layoutBodyClasses = [
    "mini-sidebar",
    "menu-horizontal",
    "layout-box-mode",
    "header-collapse",
    "expand-menu",
    "layout-mode-rtl"
  ];

  // Apply layout-specific attributes and body classes (only depends on layout config)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Remove all previous layout-specific body classes first
    layoutBodyClasses.forEach((cls) => body.classList.remove(cls));

    // Set layout-specific attributes
    html.setAttribute("data-layout", currentLayoutConfig.dataLayout);

    // Set data-width if specified by layout, otherwise use default
    html.setAttribute("data-width", currentLayoutConfig.dataWidth || "fluid");

    // Set data-theme if layout specifies it (e.g., dark layout)
    if (currentLayoutConfig.dataTheme) {
      html.setAttribute("data-theme", currentLayoutConfig.dataTheme);
    }

    // Add body classes based on layout configuration
    if (currentLayoutConfig.bodyClass) {
      const classes = currentLayoutConfig.bodyClass.split(" ").filter(Boolean);
      classes.forEach((cls) => body.classList.add(cls));
    }

    // Cleanup on unmount only - remove layout-specific classes
    return () => {
      layoutBodyClasses.forEach((cls) => body.classList.remove(cls));
    };
  }, [currentLayoutConfig]);

  // Apply theme attributes from Redux (separate effect to avoid interference)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Only set data-theme from Redux if layout doesn't specify one
    if (!currentLayoutConfig.dataTheme) {
      const themeValue = dataThemeRedux === "dark" ? "dark" : "light";
      html.setAttribute("data-theme", themeValue);
    }

    // Set other theme attributes from Redux
    html.setAttribute("data-card", dataCard);
    html.setAttribute("data-sidebar", dataSidebar);
    html.setAttribute("data-topbar", dataTopBar);
    
    // Remove or set data-topbarcolor based on layout config
    if (currentLayoutConfig.removeTopbarColor) {
      html.removeAttribute("data-topbarcolor");
    } else {
      html.setAttribute("data-topbarcolor", dataTopBarColor);
    }
    
    html.setAttribute("data-color", dataColor);
    html.setAttribute("data-loader", dataLoader);
    
    if (dataSidebarBg) {
      body.setAttribute("data-sidebarbg", dataSidebarBg);
    }
    if (dataTopbarBg) {
      body.setAttribute("data-topbarbg", dataTopbarBg);
    }
  }, [currentLayoutConfig, dataThemeRedux, dataCard, dataSidebar, dataTopBar, dataTopBarColor, dataColor, dataLoader, dataSidebarBg, dataTopbarBg]);

  // Memoize the inner wrapper class
  const innerWrapperClass = useMemo(
    () => `main-wrapper ${mobileSidebar ? "slide-nav" : ""}`,
    [mobileSidebar]
  );

  // Memoize the Preloader component
  const Preloader = useMemo(
    () => () =>
      (
        <div id="global-loader">
          <div className="page-loader"></div>
        </div>
      ),
    []
  );

  // Show preloader only on initial mount when dataLoader is enabled
  useEffect(() => {
    if (dataLoader === "enable") {
      // Show the loader on initial mount only
      setShowLoader(true);

      // Hide the loader after 2 seconds
      const timeoutId = setTimeout(() => {
        setShowLoader(false);
      }, 2000);

      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      setShowLoader(false);
    }
  }, [dataLoader]); // Only depend on dataLoader, not location.pathname

  // Scroll to top on route changes (without showing loader)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Memoize the main content
  const mainContent = useMemo(
    () => (
      <div className={innerWrapperClass}>
        <Header />
        <Sidebar />
        <HorizontalSidebar />
        <TwoColumnSidebar />
        <StackedSidebar />
        <Outlet />
        <DeleteModal />
      </div>
    ),
    [innerWrapperClass]
  );

  return (
    <>
      <style>{cssVariablesString}</style>
      <>
        {showLoader ? (
          <>
            <Preloader />
            {mainContent}
          </>
        ) : (
          mainContent
        )}
      </>
      <div className={`sidebar-overlay${mobileSidebar ? " opened" : ""}`}></div>
    </>
  );
});

LayoutFeature.displayName = "LayoutFeature";

export default LayoutFeature;

