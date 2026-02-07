import React from "react";
import { Route, Routes } from "react-router-dom";
import { authRoutes, publicRoutes } from "./router.link";
import { ProtectedRoute } from "../app/routes/ProtectedRoute";
import { AppShell } from "../shared/layout/AppShell";
import { AuthShell } from "../shared/layout/AuthShell";

const ALLRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {publicRoutes.map((route, idx) => (
          <Route path={route.path} element={route.element} key={`app-${idx}`} />
        ))}
      </Route>

      <Route element={<AuthShell />}>
        {authRoutes.map((route, idx) => (
          <Route path={route.path} element={route.element} key={`auth-${idx}`} />
        ))}
      </Route>
    </Routes>
  );
};

export default ALLRoutes;
