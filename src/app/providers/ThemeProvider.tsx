import { type ReactNode, useEffect } from "react";
import { useAppSelector } from "../../core/data/redux/store";

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

  useEffect(() => {
    if (dataTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, [dataTheme]);

  return <>{children}</>;
};
