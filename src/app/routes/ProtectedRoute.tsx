import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../../shared/utils/storage";
import { all_routes } from "../../router/all_routes";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute - Auth guard for authenticated routes
 * Redirects to login if user is not authenticated
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const authenticated = isAuthenticated();

  if (!authenticated) {
    // Redirect to login with return URL
    return (
      <Navigate
        to={all_routes.login}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
};
