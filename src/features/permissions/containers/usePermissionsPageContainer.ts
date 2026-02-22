import { useCallback, useEffect, useRef, useState } from "react";
import { all_routes } from "../../../router/all_routes";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { useAuth } from "@/shared/auth";
import { listAdminUsers } from "../services/permissions.api";
import type { AdminUser } from "../types/permissions.types";

export const usePermissionsPageContainer = () => {
  const routes = all_routes;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || (user as { is_admin?: boolean })?.is_admin === true;

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchUsers = useCallback(async (search: string) => {
    try {
      setLoading(true);
      setError(null);
      const list = await listAdminUsers(search.trim() || undefined);
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const didRunRef = useRef(false);
  const lastSearchRef = useRef<string | null>(null);
  useEffect(() => {
    if (didRunRef.current && lastSearchRef.current === debouncedSearch) return;
    didRunRef.current = true;
    lastSearchRef.current = debouncedSearch;
    fetchUsers(debouncedSearch);
    return () => {
      setTimeout(() => {
        didRunRef.current = false;
      }, 0);
    };
  }, [debouncedSearch, fetchUsers]);

  const displayName = (u: AdminUser) => u.name ?? u.username ?? "-";
  const displayEmail = (u: AdminUser) => u.email ?? "-";
  const displayDepartments = (u: AdminUser) =>
    u.department_ids?.length ? u.department_ids.join(", ") : "-";

  return {
    routes,
    isAdmin,
    searchTerm,
    users,
    loading,
    error,
    setSearchTerm,
    displayName,
    displayEmail,
    displayDepartments,
  };
};
