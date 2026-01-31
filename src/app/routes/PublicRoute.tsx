import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../shared/utils/storage";
import { all_routes } from "../../router/all_routes";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * PublicRoute - Guest-only routes (login, register, etc.)
 * Redirects to dashboard if user is already authenticated
 */
export const PublicRoute = ({
  children,
  redirectTo = all_routes.dashboard,
}: PublicRouteProps) => {
  const authenticated = isAuthenticated();

  if (authenticated) {
    // Redirect to dashboard if already logged in
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
