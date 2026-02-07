import { Outlet } from "react-router-dom";

export const AuthShell = () => {
  return (
    <div className="bg-linear-gradiant">
      <div className="main-wrapper">
        <Outlet />
      </div>
    </div>
  );
};
