import { Outlet } from "react-router-dom";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export const AuthShell = () => {
  return (
    <div className="auth-shell">
      <ThemeToggle className="auth-theme-toggle" />
      <div className="main-wrapper">
        <Outlet />
      </div>
    </div>
  );
};
