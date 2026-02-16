// Local helper: run a dynamic import to preload the chunk (no export from lazyRoutes)
const preloadComponent =
  (importFn: () => Promise<unknown>) => (): void => {
    void importFn();
  };

// Preload critical components for better UX
export const preloadCriticalComponents = (): void => {
  preloadComponent(() => import("../features/auth/pages/LoginPage"))();
  preloadComponent(() => import("../features/dashboard/pages/DashboardPage"))();
};

// Preload components based on user role (archiving system: admin / employee only)
export const preloadRoleBasedComponents = (userRole: string): void => {
  preloadComponent(() => import("../features/dashboard/pages/DashboardPage"))();
};

// Preload components based on current route
export const preloadRouteComponents = (currentPath: string): void => {
  if (currentPath === "/activity") {
    preloadComponent(() => import("../features/activity/pages/ArchiveActivityPage"))();
  }
};

// Preload components on user interaction (hover, focus)
export const preloadOnInteraction = (componentPath: string): void => {
  const preloadMap: Record<string, () => void> = {
    "/activity": () =>
      preloadComponent(() => import("../features/activity/pages/ArchiveActivityPage"))(),
    "/dashboard": () =>
      preloadComponent(() => import("../features/dashboard/pages/DashboardPage"))(),
  };

  const preloadFunc = preloadMap[componentPath];
  if (preloadFunc) {
    preloadFunc();
  }
};

// Initialize preloading on app startup
export const initializePreloading = (): (() => void) | void => {
  preloadCriticalComponents();

  if (typeof window !== "undefined") {
    const handleRouteChange = (): void => {
      preloadRouteComponents(window.location.pathname);
    };

    window.addEventListener("popstate", handleRouteChange);

    return (): void => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }
};
