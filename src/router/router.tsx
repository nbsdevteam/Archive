import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { authRoutes, publicRoutes, layoutRoutes } from "./router.link";
import { LoadingSpinner } from "../core/common/LoadingSpinner";
import { ProtectedRoute } from "../app/routes/ProtectedRoute";

// Lazy load the main feature components
const LazyFeature = lazy(() => import("../feature-module/feature"));
const LazyAuthFeature = lazy(() => import("../feature-module/authFeature"));
const LazyLayoutFeature = lazy(() => import("../feature-module/layoutFeature"));

const ALLRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Main application routes - require authentication */}
        <Route
          element={
            <ProtectedRoute>
              <Suspense
                fallback={<LoadingSpinner text="Loading application..." />}
              >
                <LazyFeature />
              </Suspense>
            </ProtectedRoute>
          }
        >
          {publicRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                  {route.element}
                </Suspense>
              }
              key={idx}
            />
          ))}
        </Route>

        {/* Layout demo routes - protected, same as main app */}
        <Route
          element={
            <ProtectedRoute>
              <Suspense
                fallback={<LoadingSpinner text="Loading layout..." />}
              >
                <LazyLayoutFeature />
              </Suspense>
            </ProtectedRoute>
          }
        >
          {layoutRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                  {route.element}
                </Suspense>
              }
              key={`layout-${idx}`}
            />
          ))}
        </Route>

        {/* Authentication routes */}
        <Route
          element={
            <Suspense
              fallback={<LoadingSpinner text="Loading authentication..." />}
            >
              <LazyAuthFeature />
            </Suspense>
          }
        >
          {authRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                  {route.element}
                </Suspense>
              }
              key={idx}
            />
          ))}
        </Route>
      </Routes>
    </>
  );
};

export default ALLRoutes;
