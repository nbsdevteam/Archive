import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { all_routes } from "@/router/all_routes";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAuth } from "@/shared/auth";
import { getIsAdmin } from "@/shared/constants/access";
import {
  createAdminUser,
  deleteAdminUser,
  editAdminUser,
  getAdminUserDetails,
  getAdminUserPermissions,
  listAdminUsers,
  resetAdminUserPassword,
  setAdminUserPermissions,
} from "../services/permissions.api";
import type {
  AdminUser,
  AdminUserDetails,
  AdminUserRole,
  CreateAdminUserPayload,
  EditAdminUserPayload,
} from "../types/permissions.types";
import type { UserCapabilityPermissions } from "@/shared/types/capabilityPermissions";

/**
 * State and handlers for the admin permissions / user management page.
 */
export const usePermissionsPageContainer = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const { user } = useAuth();
  const isAdmin = getIsAdmin(user);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminUserRole | "">("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<AdminUserDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deactivateUser, setDeactivateUser] = useState<AdminUser | null>(null);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await listAdminUsers({
        search: debouncedSearch.trim() || undefined,
        role: roleFilter || undefined,
      });
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter]);

  const didRunRef = useRef(false);
  const lastKeyRef = useRef("");
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const key = `${debouncedSearch}|${roleFilter}`;
    if (didRunRef.current && lastKeyRef.current === key) return;
    didRunRef.current = true;
    lastKeyRef.current = key;
    fetchUsers();
    return () => {
      setTimeout(() => {
        didRunRef.current = false;
      }, 0);
    };
  }, [debouncedSearch, roleFilter, fetchUsers, isAdmin]);

  const openUserDetails = useCallback(async (row: AdminUser) => {
    try {
      setSaving(true);
      const details = await getAdminUserDetails(row.id);
      let permissions = details.permissions;
      if (!permissions) {
        try {
          permissions = await getAdminUserPermissions(row.id);
        } catch {
          permissions = undefined;
        }
      }
      setDetailUser({ ...details, permissions });
      setDetailOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleCreateUser = useCallback(
    async (payload: CreateAdminUserPayload) => {
      setSaving(true);
      try {
        await createAdminUser(payload);
        toast.success(t("app.userCreated", { defaultValue: "User created." }));
        setCreateOpen(false);
        await fetchUsers();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Create failed");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchUsers, t],
  );

  const handleSaveEdit = useCallback(
    async (userId: number, payload: EditAdminUserPayload) => {
      setSaving(true);
      try {
        const updated = await editAdminUser(userId, payload);
        setDetailUser((prev) => (prev?.id === userId ? { ...prev, ...updated } : prev));
        toast.success(t("app.userUpdated", { defaultValue: "User updated." }));
        await fetchUsers();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchUsers, t],
  );

  const handleSavePermissions = useCallback(
    async (userId: number, permissions: UserCapabilityPermissions) => {
      setSaving(true);
      try {
        const saved = await setAdminUserPermissions(userId, permissions);
        setDetailUser((prev) =>
          prev?.id === userId ? { ...prev, permissions: saved } : prev,
        );
        toast.success(
          t("app.permissionsSaved", { defaultValue: "Permissions saved." }),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [t],
  );

  const handleDeactivate = useCallback(
    async (userId: number) => {
      setSaving(true);
      try {
        await deleteAdminUser(userId);
        toast.success(t("app.userDeactivated", { defaultValue: "User deactivated." }));
        setDeactivateUser(null);
        setDetailOpen(false);
        setDetailUser(null);
        await fetchUsers();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Deactivate failed");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchUsers, t],
  );

  const handleAdminResetPassword = useCallback(
    async (userId: number, password: string, confirm: string) => {
      if (password !== confirm) {
        toast.error(t("auth.passwordMismatch", { defaultValue: "Passwords do not match." }));
        return;
      }
      setSaving(true);
      try {
        await resetAdminUserPassword(userId, {
          password,
          confirm_password: confirm,
        });
        toast.success(
          t("app.passwordResetSuccess", { defaultValue: "Password reset." }),
        );
        setResetUser(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Reset failed");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [t],
  );

  const displayName = (u: AdminUser) => u.name ?? u.username ?? "-";
  const displayEmail = (u: AdminUser) => u.email ?? "-";
  const displayDepartments = (u: AdminUser) =>
    u.department_ids?.length ? u.department_ids.join(", ") : "-";

  return {
    routes,
    isAdmin,
    searchTerm,
    roleFilter,
    users,
    loading,
    error,
    saving,
    setSearchTerm,
    setRoleFilter,
    displayName,
    displayEmail,
    displayDepartments,
    createOpen,
    setCreateOpen,
    detailOpen,
    setDetailOpen,
    detailUser,
    deactivateUser,
    setDeactivateUser,
    resetUser,
    setResetUser,
    openUserDetails,
    handleCreateUser,
    handleSaveEdit,
    handleSavePermissions,
    handleDeactivate,
    handleAdminResetPassword,
    refreshUsers: fetchUsers,
  };
};
