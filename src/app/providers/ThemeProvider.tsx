import { type ReactNode, useEffect } from "react";
import { usePrefersColorScheme } from "../../shared/hooks";

type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * ThemeProvider - Applies system theme preference
 * Keeps DOM theme attributes in sync with the user's OS setting.
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const { prefersDark } = usePrefersColorScheme();
  const resolvedTheme = prefersDark ? "dark" : "light";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-bs-theme", resolvedTheme);
    document.documentElement.setAttribute("data-theme-mode", resolvedTheme);
    document.body.setAttribute("data-theme", resolvedTheme);
    document.body.setAttribute("data-theme-mode", resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return <>{children}</>;
};
