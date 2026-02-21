import { type ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { PerformanceProvider } from "./PerformanceProvider";
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary";

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
  );
};
