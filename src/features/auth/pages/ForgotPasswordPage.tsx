import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "@/app/shell/imageWithBasePath";
import styles from "../styles/login.page.module.css";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const navigation = useNavigate();

  const navigationPath = (event: React.FormEvent) => {
    event.preventDefault();
    navigation(routes.resetPassword);
  };

  return (
    <div className="container-fuild">
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row">
          <div className="col-lg-5">
            <div className={`login-background position-relative d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100 ${styles.leftPanel}`}>
              <div className="authentication-card w-100">
                <div className={`authen-overlay-item border w-100 ${styles.leftCard}`}>
                  <h2 className={`text-white display-1 ${styles.leftTitle}`}>
                    NBS Archive
                  </h2>
                  <p className={`text-white fs-20 fw-semibold text-center ${styles.leftSubtitle}`}>
                    Recover access to your archive workspace. We'll send reset instructions to your email.
                  </p>
                  <div className={styles.leftVisual}>
                    <ImageWithBasePath
                      src="assets/img/bg/archive-user.svg"
                      alt="Archive workspace"
                      className={`${styles.leftImage} ${styles.leftImageActive}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-7 col-md-12 col-sm-12">
            <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
              <div className="col-md-7 mx-auto vh-100">
                <form className="vh-100" onSubmit={navigationPath}>
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className="mx-auto mb-5 text-center">
                      <ImageWithBasePath
                        src="assets/img/logo.svg"
                        className="img-fluid"
                        alt="NBS Archive System"
                      />
                    </div>
                    <div>
                      <div className="text-center mb-3">
                        <h1 className="mb-2">{t("auth.forgotPassword")}</h1>
                        <p className="mb-0">
                          {t("auth.forgotPasswordSubtitle")}
                        </p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="email">{t("auth.emailAddress")}</label>
                        <div className="input-group">
                          <input
                            id="email"
                            type="email"
                            defaultValue=""
                            className="form-control border-end-0"
                            required
                            autoComplete="email"
                          />
                          <span className="input-group-text border-start-0">
                            <i className="ti ti-mail" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <button type="submit" className="btn btn-primary w-100">
                          {t("auth.submit")}
                        </button>
                      </div>
                      <div className="text-center">
                        <p className="fw-normal text-dark mb-0 fs-5">
                          {t("auth.returnTo")}{" "}
                          <Link to={all_routes.login} className="hover-a ms-1">
                            {t("auth.signIn")}
                          </Link>
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 pb-4 text-center">
                      <p className="mb-0 text-gray-9">{t("auth.copyright")}</p>
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
};

export default ForgotPasswordPage;
