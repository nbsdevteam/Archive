/**
 * routes.config - Re-exports current route configuration
 * This provides a centralized import point for route constants
 * while maintaining backward compatibility with existing code.
 */

// Re-export route constants
export { all_routes } from "../../router/all_routes";

// Re-export route definitions (for future migration)
export { authRoutes, publicRoutes, layoutRoutes } from "../../router/router.link";

// Export route guards
export { ProtectedRoute } from "./ProtectedRoute";
export { PublicRoute } from "./PublicRoute";
