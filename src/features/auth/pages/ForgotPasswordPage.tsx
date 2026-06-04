import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ImageWithBasePath from "@/app/shell/imageWithBasePath";
import { all_routes } from "@/router/all_routes";
import { Button, Icon } from "@/shared/components/ui";
import { useForgotPassword } from "../hooks/useForgotPassword";
import styles from "../styles/login.page.module.css";

/**
 * Public forgot-password page — sends reset instructions to the user's email.
 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { submit, loading, error, success } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const displayError = formError ?? error;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      const trimmed = email.trim();
      if (!trimmed) {
        setFormError(t("auth.emailRequired", { defaultValue: "Email is required." }));
        return;
      }
      try {
        await submit(trimmed);
      } catch {
        /* hook sets error */
      }
    },
    [email, submit, t],
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
                  <h1 className="text-white mb-3">{t("auth.forgotPassword")}</h1>
                  <p className="text-white mb-0">{t("auth.forgotPasswordSubtitle")}</p>
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
                      <h3>{t("auth.forgotPassword")}</h3>
                      <h4>{t("auth.forgotPasswordSubtitle")}</h4>
                    </div>

                    {success && (
                      <div className="alert alert-success" role="status">
                        {t("auth.forgotPasswordSuccess", {
                          defaultValue:
                            "If an account exists for that email, you will receive reset instructions shortly.",
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
                          <label className="form-label" htmlFor="forgot-email">
                            {t("auth.emailAddress")}
                          </label>
                          <div className="input-group">
                            <input
                              id="forgot-email"
                              type="email"
                              className="form-control border-end-0"
                              required
                              autoComplete="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              disabled={loading}
                              data-testid="forgot-password-email"
                            />
                            <span className="input-group-text border-start-0">
                              <Icon name="user" />
                            </span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <Button
                            type="submit"
                            variant="secondary"
                            className="w-100"
                            disabled={loading}
                            isLoading={loading}
                            data-testid="forgot-password-submit"
                          >
                            {t("auth.submit")}
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
