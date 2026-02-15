import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import styles from "../styles/login.page.module.css";

export type LoginRole = "admin" | "user";

interface LoginRoleToggleProps {
  value: LoginRole;
  onChange: (role: LoginRole) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

const ROLE_ADMIN: LoginRole = "admin";
const ROLE_USER: LoginRole = "user";

export function LoginRoleToggle({
  value,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
}: LoginRoleToggleProps) {
  const { t } = useTranslation();
  const resolvedAriaLabel = ariaLabel ?? t("auth.loginAs");
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value as LoginRole;
    if (v === ROLE_ADMIN || v === ROLE_USER) onChange(v);
  };

  return (
    <div
      className={styles.roleToggle}
      role="group"
      aria-label={resolvedAriaLabel}
    >
      <div
        className={styles.roleToggleTrack}
        data-value={value}
      >
        <div className={styles.slider} aria-hidden="true" />
        <div className={styles.roleOption}>
          <input
            type="radio"
            name="loginRole"
            value={ROLE_ADMIN}
            id="login-role-admin"
            className={styles.roleOptionInput}
            checked={value === ROLE_ADMIN}
            onChange={handleChange}
            disabled={disabled}
            aria-checked={value === ROLE_ADMIN}
            aria-label={t("auth.loginAsAdmin")}
          />
          <label htmlFor="login-role-admin" className={styles.roleOptionLabel}>
            Admin
          </label>
        </div>
        <div className={styles.roleOption}>
          <input
            type="radio"
            name="loginRole"
            value={ROLE_USER}
            id="login-role-user"
            className={styles.roleOptionInput}
            checked={value === ROLE_USER}
            onChange={handleChange}
            disabled={disabled}
            aria-checked={value === ROLE_USER}
            aria-label={t("auth.loginAsUser")}
          />
          <label htmlFor="login-role-user" className={styles.roleOptionLabel}>
            User
          </label>
        </div>
      </div>
    </div>
  );
}
