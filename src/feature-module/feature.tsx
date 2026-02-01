import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../core/common/header";
import Sidebar from "../core/common/sidebar";
import ThemeSettings from "../core/common/theme-settings";
import ThemeInitializer from "../core/common/ThemeInitializer";
import { useEffect, useState, useMemo, useCallback } from "react";
import { LoadingSpinner } from "../core/common/LoadingSpinner";
import HorizontalSidebar from "../core/common/horizontal-sidebar";
import TwoColumnSidebar from "../core/common/two-column";
import StackedSidebar from "../core/common/stacked-sidebar";
import DeleteModal from "../core/modals/deleteModal";
import { setResetMobileSidebar } from "../core/data/redux/sidebarSlice";
import React from "react";
import type {
  AppRootState as RootState,
  AppDispatch,
} from "../core/data/redux/store";

const Feature = React.memo(() => {
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const headerCollapse = useSelector(
    (state: RootState) => state.themeSetting.headerCollapse
  );

  const mobileSidebar = useSelector(
    (state: RootState) => state.sidebarSlice.mobileSidebar
  );
  const miniSidebar = useSelector(
    (state: RootState) => state.sidebarSlice.miniSidebar
  );
  const dataWidth = useSelector(
    (state: RootState) => state.themeSetting.dataWidth
  );
  const dataLayout = useSelector(
    (state: RootState) => state.themeSetting.dataLayout
  );
  const dataLoader = useSelector(
    (state: RootState) => state.themeSetting.dataLoader
  );
  const dataTheme = useSelector(
    (state: RootState) => state.themeSetting.dataTheme
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
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

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

  // Memoize the body class names
  const bodyClasses = useMemo(() => {
    const classes = [
      dataLayout === "mini" || dataWidth === "box" ? "mini-sidebar" : "",
      dataLayout === "horizontal" ||
      dataLayout === "horizontal-single" ||
      dataLayout === "horizontal-overlay" ||
      dataLayout === "horizontal-box"
        ? "menu-horizontal"
        : "",
      miniSidebar && dataLayout !== "mini" ? "mini-sidebar" : "",
      dataWidth === "box" ? "layout-box-mode" : "",
      headerCollapse ? "header-collapse" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return classes;
  }, [dataLayout, dataWidth, miniSidebar, headerCollapse]);

  // Apply classes to body tag
  useEffect(() => {
    const body = document.body;
    // Remove old classes (except expand-menu which is handled by sidebar on hover)
    body.classList.remove(
      "mini-sidebar",
      "menu-horizontal",
      "layout-box-mode",
      "header-collapse"
    );
    // Add new classes
    if (bodyClasses) {
      const classArray = bodyClasses.split(" ").filter(Boolean);
      classArray.forEach((cls) => body.classList.add(cls));
    }
    // Cleanup on unmount
    return () => {
      body.classList.remove(
        "mini-sidebar",
        "menu-horizontal",
        "layout-box-mode",
        "header-collapse",
        "expand-menu"
      );
    };
  }, [bodyClasses]);

  // Memoize the inner wrapper class
  const innerWrapperClass = useMemo(
    () => `main-wrapper ${mobileSidebar ? "slide-nav" : ""}`,
    [mobileSidebar]
  );

  // Memoize the reset mobile sidebar effect
  const resetMobileSidebar = useCallback(() => {
    dispatch(setResetMobileSidebar());
  }, [dispatch]);

  useEffect(() => {
    if (dataTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, [dataTheme]);

  // Apply data-size attribute for hoverview on html tag
  useEffect(() => {
    const html = document.documentElement;
    if (dataLayout === "hoverview") {
      html.setAttribute("data-size", "hoverview");
    } else {
      html.removeAttribute("data-size");
    }
    // Cleanup on unmount
    return () => {
      html.removeAttribute("data-size");
    };
  }, [dataLayout]);

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

  useEffect(() => {
    resetMobileSidebar();
  }, [location.pathname, resetMobileSidebar]);

  const sidebarContent = useMemo(() => {
    const horizontalLayouts = [
      "horizontal",
      "horizontal-single",
      "horizontal-overlay",
      "horizontal-box",
      "horizontal-sidemenu",
    ];

    if (dataLayout === "twocolumn") {
      return <TwoColumnSidebar />;
    }

    if (dataLayout === "stacked") {
      return <StackedSidebar />;
    }

    if (horizontalLayouts.includes(dataLayout)) {
      return <HorizontalSidebar />;
    }

    return <Sidebar />;
  }, [dataLayout]);

  // Memoize the main content
  const mainContent = useMemo(
    () => (
      <div className={innerWrapperClass}>
        <ThemeInitializer />
        <Header />
        {sidebarContent}
        <Outlet />
        <DeleteModal />
        {!location.pathname.includes("layout") && <ThemeSettings />}
      </div>
    ),
    [innerWrapperClass, location.pathname, sidebarContent]
  );

  return (
    <>
      <style>{cssVariablesString}</style>
      <>
        {showLoader ? (
          <>
            <LoadingSpinner />
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

Feature.displayName = "Feature";

export default Feature;
