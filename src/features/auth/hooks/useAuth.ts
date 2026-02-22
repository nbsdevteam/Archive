/**
 * Re-export so existing mocks and imports from features/auth resolve.
 * Shell and app should import from @/shared/auth to avoid loading feature-auth on /dashboard.
 */
export { useAuth } from "@/shared/auth";
