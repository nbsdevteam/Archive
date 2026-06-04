import { useEffect } from "react";
import { bootstrapAuthSession } from "@/features/auth/services/sessionBootstrap";
import { isAuthenticated } from "@/shared/utils/storage";

/**
 * Re-hydrates user, capability permissions, and marquee settings when a session already exists.
 */
export function AuthSessionBootstrap() {
  useEffect(() => {
    if (!isAuthenticated()) return;
    bootstrapAuthSession().catch((err) => {
      console.warn("Session bootstrap failed:", err);
    });
  }, []);

  return null;
}
