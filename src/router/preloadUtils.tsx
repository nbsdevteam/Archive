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
  switch (userRole) {
    case "admin":
      preloadComponent(() => import("../features/dashboard/pages/DashboardPage"))();
      preloadComponent(() => import("../features/archive/pages/ArchiveFolders"))();
      break;
    case "employee":
      preloadComponent(() => import("../features/dashboard/pages/DashboardPage"))();
      preloadComponent(() => import("../features/archive/pages/ArchiveDocuments"))();
      break;
    default:
      preloadComponent(() => import("../features/dashboard/pages/DashboardPage"))();
  }
};

// Preload components based on current route (archive + reports only)
export const preloadRouteComponents = (currentPath: string): void => {
  if (currentPath.includes("/archive")) {
    preloadComponent(() => import("../features/archive/pages/ArchiveFolders"))();
    preloadComponent(() => import("../features/archive/pages/ArchiveDocuments"))();
    preloadComponent(() => import("../features/archive/pages/ArchiveUpload"))();
    preloadComponent(() => import("../features/archive/pages/ArchiveTrash"))();
    preloadComponent(() => import("../features/archive/pages/ArchiveActivity"))();
  }

};

// Preload components on user interaction (hover, focus) – archive & reports only
export const preloadOnInteraction = (componentPath: string): void => {
  const preloadMap: Record<string, () => void> = {
    "/archive/folders": () =>
      preloadComponent(() => import("../features/archive/pages/ArchiveFolders"))(),
    "/archive/documents": () =>
      preloadComponent(() => import("../features/archive/pages/ArchiveDocuments"))(),
    "/archive/upload": () =>
      preloadComponent(() => import("../features/archive/pages/ArchiveUpload"))(),
    "/archive/trash": () =>
      preloadComponent(() => import("../features/archive/pages/ArchiveTrash"))(),
    "/archive/activity": () =>
      preloadComponent(() => import("../features/archive/pages/ArchiveActivity"))(),
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
