import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ImageWithBasePath from "@/app/shell/imageWithBasePath";
import { all_routes } from "@/router/all_routes";
import { Button, Icon } from "@/shared/components/ui";
import { useResetPassword } from "../hooks/useResetPassword";
import styles from "../styles/login.page.module.css";

/**
 * Public reset-password page — accepts token from query string and sets a new password.
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { submit, loading, error, success } = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const displayError = formError ?? error;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      if (!token) {
        setFormError(
          t("auth.resetTokenMissing", {
            defaultValue: "Reset link is invalid or missing a token.",
          }),
        );
        return;
      }
      if (password.length < 8) {
        setFormError(
          t("auth.passwordMinLength", {
            defaultValue: "Password must be at least 8 characters.",
          }),
        );
        return;
      }
      try {
        await submit(token, password, confirmPassword);
        setTimeout(() => navigate(all_routes.login, { replace: true }), 2000);
      } catch {
        /* hook sets error */
      }
    },
    [token, password, confirmPassword, submit, navigate, t],
  );

  return (
    <div className="container-fuild">
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row">
          <div className="col-lg-5">
            <div
              className={`login-background position-relative d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100 ${styles.leftPanel}`}
            >
              <div className="authentication-card w-100">
                <div className={`authen-overlay-item border w-100 ${styles.leftCard}`}>
                  <h1 className="text-white mb-3">{t("auth.resetPassword")}</h1>
                  <p className="text-white mb-0">{t("auth.resetPasswordSubtitle")}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="login-wrapper d-flex align-items-center justify-content-center vh-100">
              <div className="login-content w-100">
                <form onSubmit={handleSubmit}>
                  <div className="login-userset">
                    <div className="login-logo mb-4">
                      <ImageWithBasePath src="assets/img/logo.svg" alt="logo" />
                    </div>
                    <div className="login-userheading">
                      <h3>{t("auth.resetPassword")}</h3>
                      <h4>{t("auth.resetPasswordSubtitle")}</h4>
                    </div>

                    {success && (
                      <div className="alert alert-success" role="status">
                        {t("auth.resetPasswordSuccess", {
                          defaultValue: "Password updated. Redirecting to sign in…",
                        })}
                      </div>
                    )}

                    {displayError && (
                      <div className="alert alert-danger" role="alert">
                        {displayError}
                      </div>
                    )}

                    {!success && (
                      <>
                        <div className="mb-3">
                          <label className="form-label" htmlFor="reset-password">
                            {t("auth.password")}
                          </label>
                          <div className="pass-group">
                            <input
                              id="reset-password"
                              type={passwordVisible ? "text" : "password"}
                              className="pass-input form-control"
                              required
                              minLength={8}
                              autoComplete="new-password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              disabled={loading || !token}
                              data-testid="reset-password-new"
                            />
                            <span
                              className="toggle-passwords"
                              onClick={() => setPasswordVisible((v) => !v)}
                              role="button"
                              tabIndex={0}
                              aria-label={t("auth.togglePasswordVisibility")}
                            >
                              <Icon name={passwordVisible ? "eye" : "eye-off"} />
                            </span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label" htmlFor="reset-confirm">
                            {t("auth.confirmPassword")}
                          </label>
                          <input
                            id="reset-confirm"
                            type={passwordVisible ? "text" : "password"}
                            className="form-control"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading || !token}
                            data-testid="reset-password-confirm"
                          />
                        </div>
                        <div className="mb-3">
                          <Button
                            type="submit"
                            variant="secondary"
                            className="w-100"
                            disabled={loading || !token}
                            isLoading={loading}
                            data-testid="reset-password-submit"
                          >
                            {t("auth.resetPassword")}
                          </Button>
                        </div>
                      </>
                    )}

                    <div className="text-center">
                      <Link to={all_routes.login} className="hover-a">
                        {t("auth.returnTo")} {t("auth.signIn")}
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
