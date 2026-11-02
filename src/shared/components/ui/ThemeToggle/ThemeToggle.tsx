import { useTranslation } from "react-i18next";
import { useThemeModeStore } from "../../../stores/themeModeStore";
import { Icon } from "../Icon";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
  className?: string;
  /** "bordered" (default) is a standalone icon button; "menubar" matches the app header icon buttons. */
  variant?: "bordered" | "menubar";
}

/**
 * ThemeToggle - icon button that switches between light and dark mode.
 * Shows the icon of the mode it will switch to.
 */
export const ThemeToggle = ({ className = "", variant = "bordered" }: ThemeToggleProps) => {
  const { t } = useTranslation();
  const mode = useThemeModeStore((s) => s.mode);
  const toggleMode = useThemeModeStore((s) => s.toggleMode);
  const isDark = mode === "dark";
  const label = isDark ? t("auth.switchToLightTheme") : t("auth.switchToDarkTheme");
  const isMenubar = variant === "menubar";

  return (
    <button
      type="button"
      className={`${isMenubar ? "btn btn-menubar" : styles.toggle} ${className}`.trim()}
      onClick={toggleMode}
      aria-label={label}
      title={label}
      data-testid="theme-toggle-btn"
    >
      <Icon
        name={isDark ? "sun" : "moon"}
        style={isMenubar ? { width: 16, height: 16 } : undefined}
      />
    </button>
  );
};
