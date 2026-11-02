import { type ReactNode, useEffect } from "react";
import { useThemeModeStore } from "../../shared/stores/themeModeStore";

type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * ThemeProvider - Applies the active theme mode (user toggle, falling back to
 * the OS preference on first visit) to the DOM theme attributes.
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const resolvedTheme = useThemeModeStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-bs-theme", resolvedTheme);
    document.documentElement.setAttribute("data-theme-mode", resolvedTheme);
    document.documentElement.setAttribute("data-nbs-theme", resolvedTheme);
    document.body.setAttribute("data-theme", resolvedTheme);
    document.body.setAttribute("data-theme-mode", resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return <>{children}</>;
};
