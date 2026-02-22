/** Runs a dynamic import to preload a chunk; used only for optional route preloads (e.g. on hover). */
const preloadComponent = (importFn: () => Promise<unknown>) => (): void => {
  void importFn();
};

// Do not preload LoginPage on app load — keeps feature-auth off /dashboard initial load.
export const preloadCriticalComponents = (): void => {
  // Intentionally empty; was preloading LoginPage and pulling feature-auth on every page.
};

// Preload components based on current route
export const preloadRouteComponents = (currentPath: string): void => {
  // if (currentPath === "/activity") {
  //   preloadComponent(
  //     () => import("../features/activity/pages/ArchiveActivityPage"),
  //   )();
  // }
};

// Preload components on user interaction (hover, focus)
export const preloadOnInteraction = (componentPath: string): void => {
  // const preloadMap: Record<string, () => void> = {
  //   "/activity": () =>
  //     preloadComponent(
  //       () => import("../features/activity/pages/ArchiveActivityPage"),
  //     )(),
  // };
  // const preloadFunc = preloadMap[componentPath];
  // if (preloadFunc) {
  //   preloadFunc();
  // }
};

// Initialize preloading on app startup
export const initializePreloading = (): (() => void) | void => {
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
