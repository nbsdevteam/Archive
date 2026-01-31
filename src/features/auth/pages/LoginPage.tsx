import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import { useLogin } from "../hooks/useLogin";
import { LoginRoleToggle, type LoginRole } from "../components/LoginRoleToggle";
import { clearTokens } from "../../../shared/utils/storage";
import { Icon } from "../../../shared/components/ui";
import styles from "../styles/login.page.module.css";

const USER_STORAGE_KEY = "user";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error: apiError } = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginAs, setLoginAs] = useState<LoginRole>("user");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const displayError = formError ?? apiError;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      try {
        const response = await login({ username, password });

        if (loginAs === "admin" && response.user && !response.user.is_admin) {
          clearTokens();
          try {
            localStorage.removeItem(USER_STORAGE_KEY);
          } catch {
            /* ignore */
          }
          setFormError("Admin access required. Your account is not an administrator.");
          return;
        }

        navigate(all_routes.dashboard, { replace: true });
      } catch {
        // useLogin already sets apiError
      }
    },
    [login, username, password, loginAs, navigate]
  );

  const handleSubmitWrapped = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSubmit(e);
    },
    [handleSubmit]
  );

  return (
    <div className="container-fuild">
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row">
          <div className="col-lg-5">
            <div className={`login-background position-relative d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100 ${styles.leftPanel}`}>
              <div className="authentication-card w-100">
                <div className={`authen-overlay-item border w-100 ${styles.leftCard}`}>
                  <div className={styles.leftCarousel} data-role={loginAs}>
                    <section className={styles.leftSlide} aria-hidden={loginAs !== "admin"}>
                      <h1 className={`text-white display-1 ${styles.leftTitle}`}>
                        NBS Archive Admin
                      </h1>
                      <p className={`text-white fs-20 fw-semibold text-center ${styles.leftSubtitle}`}>
                        Govern records, manage approvals, and monitor system-wide
                        archive activity with confidence.
                      </p>
                      <div className={styles.leftVisual}>
                        <ImageWithBasePath
                          src="assets/img/bg/archive-admin.svg"
                          alt="Admin archive dashboard"
                          className={`${styles.leftImage} ${styles.leftImageActive}`}
                        />
                      </div>
                    </section>
                    <section className={styles.leftSlide} aria-hidden={loginAs !== "user"}>
                      <h1 className={`text-white display-1 ${styles.leftTitle}`}>
                        NBS Archive Workspace
                      </h1>
                      <p className={`text-white fs-20 fw-semibold text-center ${styles.leftSubtitle}`}>
                        Upload, organize, and retrieve documents fast with
                        secure access to your archive folders.
                      </p>
                      <div className={styles.leftVisual}>
                        <ImageWithBasePath
                          src="assets/img/bg/archive-user.svg"
                          alt="User archive workspace"
                          className={`${styles.leftImage} ${styles.leftImageActive}`}
                        />
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-7 col-md-12 col-sm-12">
            <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
              <div className="col-md-7 mx-auto vh-100">
                <form className="vh-100" onSubmit={handleSubmitWrapped}>
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className="mx-auto mb-5 text-center">
                      <ImageWithBasePath
                        src="assets/img/logo-2.svg"
                        className="img-fluid"
                        alt="NBS Archive System"
                      />
                    </div>
                    <div className="">
                      <div className="text-center mb-3">
                        <h2 className="mb-2">Sign In</h2>
                        <p className="mb-0">Access your archive workspace securely</p>
                      </div>

                      <LoginRoleToggle
                        value={loginAs}
                        onChange={setLoginAs}
                        disabled={loading}
                        aria-label="Login as"
                      />

                      {displayError && (
                        <div className={`alert alert-danger ${styles.errorAlert}`} role="alert">
                          {displayError}
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="form-label" htmlFor="login-username">
                          Username
                        </label>
                        <div className="input-group">
                          <input
                            id="login-username"
                            type="text"
                            className="form-control border-end-0"
                            required
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                          />
                          <span className="input-group-text border-start-0">
                            <Icon name="user" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="login-password">
                          Password
                        </label>
                        <div className="pass-group">
                          <input
                            id="login-password"
                            type={passwordVisible ? "text" : "password"}
                            className="pass-input form-control"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                          />
                          <span
                            className="toggle-passwords"
                            onClick={() => setPasswordVisible((v) => !v)}
                            role="button"
                            tabIndex={0}
                            aria-label="Toggle password visibility"
                          >
                            <Icon name={passwordVisible ? "eye" : "eye-off"} />
                          </span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="form-check form-check-md mb-0">
                            <input className="form-check-input" id="remember_me" type="checkbox" />
                            <label htmlFor="remember_me" className="form-check-label mt-0">
                              Remember Me
                            </label>
                          </div>
                        </div>
                        <div className="text-end">
                          <Link to={all_routes.forgotPassword} className="link-danger">
                            Forgot Password?
                          </Link>
                        </div>
                      </div>
                      <div className="mb-3">
                        <button type="submit" className="btn btn-secondary w-100" disabled={loading}>
                          {loading ? "Signing in…" : "Sign In"}
                        </button>
                      </div>
                      <div className="text-center">
                        <h6 className="fw-normal text-dark mb-0">
                          Don’t have an account?{" "}
                          <Link to={all_routes.register} className="hover-a">
                            Create Account
                          </Link>
                        </h6>
                      </div>
                    </div>
                    <div className="mt-5 pb-4 text-center">
                      <p className="mb-0 text-gray-9">Copyright © 2024 - NBS Archive System</p>
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
