import { type ReactNode } from "react";
import { ReduxProvider } from "./ReduxProvider";
import { ThemeProvider } from "./ThemeProvider";
import { PerformanceProvider } from "../../core/providers/PerformanceProvider";
import ErrorBoundary from "../../components/ErrorBoundary/ErrorBoundary";

type AppProvidersProps = {
  children: ReactNode;
};

/**
 * AppProviders - Composition of all providers
 * This centralizes provider composition and allows us to gradually migrate
 * from the existing setup to the new architecture.
 */
export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ReduxProvider>
      <PerformanceProvider
        enableProfiling={false}
        enableMemoization={true}
        enableVirtualization={true}
      >
        <ThemeProvider>
          <ErrorBoundary fallback={<div>Oops! An unexpected error occurred.</div>}>
            {children}
          </ErrorBoundary>
        </ThemeProvider>
      </PerformanceProvider>
    </ReduxProvider>
  );
};
