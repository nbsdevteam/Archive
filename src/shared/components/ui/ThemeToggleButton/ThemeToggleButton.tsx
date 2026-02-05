import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Moon, Sun } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../../../core/data/redux/store";
import { setDataTheme } from "../../../../core/data/redux/themeSettingSlice";
import { usePrefersColorScheme } from "../../../hooks";

export const ThemeToggleButton = () => {
  const dispatch = useAppDispatch();
  const dataTheme = useAppSelector((state) => state.themeSetting.dataTheme);
  const { prefersDark } = usePrefersColorScheme();

  const isDark = prefersDark || dataTheme === "dark";
  const label = isDark ? "Dark" : "Light";

  const handleToggle = () => {
    const nextTheme = dataTheme === "dark" ? "light" : "dark";
    dispatch(setDataTheme(nextTheme));
  };

  const button = (
    <button
      type="button"
      className="btn btn-menubar d-inline-flex align-items-center gap-2"
      style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6 }}
      onClick={handleToggle}
      disabled={prefersDark}
      aria-label={`Theme: ${label}. Click to switch to ${isDark ? "light" : "dark"} mode.`}
    >
      <Sun size={18} style={{ opacity: isDark ? 0.6 : 1, flexShrink: 0 }} aria-hidden />
      <Moon size={18} style={{ opacity: isDark ? 1 : 0.6, flexShrink: 0 }} aria-hidden />
      <span style={{ fontSize: "0.8125rem" }}>{label}</span>
    </button>
  );

  if (!prefersDark) {
    return button;
  }

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        <Tooltip id="theme-toggle-tooltip">
          System theme is set to Dark Mode. Theme is locked.
        </Tooltip>
      }
    >
      <span className="d-inline-flex" tabIndex={0}>
        {button}
      </span>
    </OverlayTrigger>
  );
};
