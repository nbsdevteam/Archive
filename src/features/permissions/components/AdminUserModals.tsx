import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Modal, ModalFooter } from "@/shared/components/ui";
import type {
  AdminUser,
  AdminUserDetails,
  AdminUserRole,
  CreateAdminUserPayload,
  EditAdminUserPayload,
} from "../types/permissions.types";
import type { UserCapabilityPermissions } from "@/shared/types/capabilityPermissions";
import { DEFAULT_CAPABILITY_PERMISSIONS } from "@/shared/types/capabilityPermissions";

export interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAdminUserPayload) => Promise<void>;
  saving: boolean;
}

/**
 * Modal form to create a new admin-managed user.
 */
export function CreateUserModal({ open, onClose, onSubmit, saving }: CreateUserModalProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminUserRole>("employee");

  useEffect(() => {
    if (!open) return;
    setUsername("");
    setEmail("");
    setPassword("");
    setName("");
    setRole("employee");
  }, [open]);

  const handleSubmit = useCallback(async () => {
    await onSubmit({
      username: username.trim(),
      email: email.trim(),
      password,
      name: name.trim() || undefined,
      role,
    });
  }, [username, email, password, name, role, onSubmit]);

  return (
    <Modal isOpen={open} onClose={onClose} title={t("app.createUser", { defaultValue: "Create user" })}>
      <div className="mb-3">
        <label className="form-label">{t("auth.username")}</label>
        <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">{t("auth.emailAddress")}</label>
        <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">{t("auth.name")}</label>
        <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">{t("auth.password")}</label>
        <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">{t("app.role")}</label>
        <select className="form-select" value={role} onChange={(e) => setRole(e.target.value as AdminUserRole)}>
          <option value="employee">employee</option>
          <option value="manager">manager</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <ModalFooter>
        <Button variant="light" onClick={onClose} disabled={saving}>
          {t("common.cancel", { defaultValue: "Cancel" })}
        </Button>
        <Button variant="secondary" onClick={handleSubmit} disabled={saving} isLoading={saving}>
          {t("common.create", { defaultValue: "Create" })}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export interface UserDetailModalProps {
  open: boolean;
  user: AdminUserDetails | null;
  onClose: () => void;
  onSaveEdit: (userId: number, payload: EditAdminUserPayload) => Promise<void>;
  onSavePermissions: (userId: number, perms: UserCapabilityPermissions) => Promise<void>;
  saving: boolean;
}

/**
 * Modal to view/edit user profile and capability permissions.
 */
export function UserDetailModal({
  open,
  user,
  onClose,
  onSaveEdit,
  onSavePermissions,
  saving,
}: UserDetailModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AdminUserRole>("employee");
  const [perms, setPerms] = useState<UserCapabilityPermissions>(DEFAULT_CAPABILITY_PERMISSIONS);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setRole(user.role);
    setPerms(user.permissions ?? DEFAULT_CAPABILITY_PERMISSIONS);
  }, [user]);

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    await onSaveEdit(user.id, {
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      role,
    });
  }, [user, name, email, phone, role, onSaveEdit]);

  const handleSavePerms = useCallback(async () => {
    if (!user) return;
    await onSavePermissions(user.id, perms);
  }, [user, perms, onSavePermissions]);

  if (!user) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("app.userDetails", { defaultValue: "User details" })}
      size="lg"
    >
      <p className="text-muted small">
        {user.username} (ID {user.id})
      </p>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">{t("auth.name")}</label>
          <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label">{t("auth.emailAddress")}</label>
          <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label">{t("app.phone", { defaultValue: "Phone" })}</label>
          <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label">{t("app.role")}</label>
          <select className="form-select" value={role} onChange={(e) => setRole(e.target.value as AdminUserRole)}>
            <option value="employee">employee</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
        </div>
      </div>

      <hr className="my-4" />
      <h6>{t("app.capabilityPermissions", { defaultValue: "Capabilities" })}</h6>
      <div className="form-check mb-2">
        <input
          id="perm-delete"
          type="checkbox"
          className="form-check-input"
          checked={perms.can_delete_files}
          onChange={(e) => setPerms((p) => ({ ...p, can_delete_files: e.target.checked }))}
        />
        <label className="form-check-label" htmlFor="perm-delete">
          {t("app.canDeleteFiles", { defaultValue: "Can delete files" })}
        </label>
      </div>
      <div className="form-check mb-2">
        <input
          id="perm-multi"
          type="checkbox"
          className="form-check-input"
          checked={perms.can_upload_multiple}
          onChange={(e) => setPerms((p) => ({ ...p, can_upload_multiple: e.target.checked }))}
        />
        <label className="form-check-label" htmlFor="perm-multi">
          {t("app.canUploadMultiple", { defaultValue: "Can upload multiple files" })}
        </label>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="perm-limit">
          {t("app.uploadLimit", { defaultValue: "Upload limit" })}
        </label>
        <input
          id="perm-limit"
          type="number"
          min={1}
          className="form-control"
          style={{ maxWidth: 120 }}
          value={perms.upload_limit}
          onChange={(e) =>
            setPerms((p) => ({ ...p, upload_limit: Math.max(1, Number(e.target.value) || 1) }))
          }
        />
      </div>

      <ModalFooter>
        <Button variant="light" onClick={onClose} disabled={saving}>
          {t("common.close", { defaultValue: "Close" })}
        </Button>
        <Button variant="secondary" onClick={handleSaveProfile} disabled={saving} isLoading={saving}>
          {t("common.save", { defaultValue: "Save profile" })}
        </Button>
        <Button variant="primary" onClick={handleSavePerms} disabled={saving} isLoading={saving}>
          {t("app.savePermissions", { defaultValue: "Save permissions" })}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export interface DeactivateUserModalProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onConfirm: (userId: number) => Promise<void>;
  saving: boolean;
}

/** Confirmation modal before deactivating a user. */
export function DeactivateUserModal({
  open,
  user,
  onClose,
  onConfirm,
  saving,
}: DeactivateUserModalProps) {
  const { t } = useTranslation();

  const handleConfirm = useCallback(async () => {
    if (!user) return;
    await onConfirm(user.id);
  }, [user, onConfirm]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("app.deactivateUser", { defaultValue: "Deactivate user" })}
    >
      <p>
        {t("app.deactivateUserConfirm", {
          defaultValue: "Deactivate {{name}}? They will no longer be able to sign in.",
          name: user?.name ?? user?.username ?? "",
        })}
      </p>
      <ModalFooter>
        <Button variant="light" onClick={onClose} disabled={saving}>
          {t("common.cancel", { defaultValue: "Cancel" })}
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={saving} isLoading={saving}>
          {t("app.deactivate", { defaultValue: "Deactivate" })}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export interface AdminResetPasswordModalProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSubmit: (userId: number, password: string, confirm: string) => Promise<void>;
  saving: boolean;
}

/** Admin sets a new password for a user. */
export function AdminResetPasswordModal({
  open,
  user,
  onClose,
  onSubmit,
  saving,
}: AdminResetPasswordModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirm("");
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    await onSubmit(user.id, password, confirm);
  }, [user, password, confirm, onSubmit]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("app.resetUserPassword", { defaultValue: "Reset user password" })}
    >
      <p className="text-muted small">{user?.username}</p>
      <div className="mb-3">
        <label className="form-label">{t("auth.password")}</label>
        <input
          type="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">{t("auth.confirmPassword")}</label>
        <input
          type="password"
          className="form-control"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <ModalFooter>
        <Button variant="light" onClick={onClose} disabled={saving}>
          {t("common.cancel", { defaultValue: "Cancel" })}
        </Button>
        <Button variant="secondary" onClick={handleSubmit} disabled={saving} isLoading={saving}>
          {t("auth.resetPassword")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
