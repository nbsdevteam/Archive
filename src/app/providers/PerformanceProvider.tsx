import React from "react";

/** Minimal performance context: optional tracking for render/interaction (no consumers in app). */
const PerformanceContext = React.createContext<{
  trackRender: (componentName: string, renderTime: number) => void;
  trackInteraction: (componentName: string, interactionType: string) => void;
}>({
  trackRender: () => {},
  trackInteraction: () => {},
});

interface PerformanceProviderProps {
  children: React.ReactNode;
  enableProfiling?: boolean;
  enableMemoization?: boolean;
  enableVirtualization?: boolean;
}

/** Wraps the app with performance context; used by AppProviders. Options reserved for future use. */
export const PerformanceProvider = React.memo(
  ({
    children,
    enableProfiling = false,
    enableMemoization = true,
    enableVirtualization = true,
  }: PerformanceProviderProps) => {
    const value = React.useMemo(
      () => ({
        trackRender: (_componentName: string, _renderTime: number) => {
          if (enableProfiling) {
            // Reserved for future profiling
          }
        },
        trackInteraction: (_componentName: string, _interactionType: string) => {
          if (enableProfiling) {
            // Reserved for future profiling
          }
        },
      }),
      [enableProfiling]
    );

    return (
      <PerformanceContext.Provider value={value}>
        {children}
      </PerformanceContext.Provider>
    );
  }
);

PerformanceProvider.displayName = "PerformanceProvider";
