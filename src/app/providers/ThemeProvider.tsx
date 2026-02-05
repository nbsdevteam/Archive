import { type ReactNode, useEffect } from "react";
import { useAppSelector } from "../../core/data/redux/store";
import { usePrefersColorScheme } from "../../shared/hooks";

type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * ThemeProvider - Thin wrapper around existing Redux theme behavior
 * This adapter maintains the current theme logic while providing a consistent
 * provider interface for the new architecture.
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const dataTheme = useAppSelector((state) => state.themeSetting.dataTheme);
  const { prefersDark } = usePrefersColorScheme();
  const resolvedTheme =
    prefersDark || dataTheme === "dark" ? "dark" : "light";

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
