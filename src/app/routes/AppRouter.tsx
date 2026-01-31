import ALLRoutes from "../../router/router";

/**
 * AppRouter - Adapter that renders the existing router
 * This allows us to gradually migrate routing logic while keeping
 * the current router implementation intact.
 */
export const AppRouter = () => {
  return <ALLRoutes />;
};
