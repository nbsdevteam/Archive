import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "@/app/shell/imageWithBasePath";

type PasswordField = "password" | "confirmPassword";

type PasswordVisibility = {
  password: boolean;
  confirmPassword: boolean;
};

const RegisterPage = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const navigation = useNavigate();

  const [passwordVisibility, setPasswordVisibility] =
    useState<PasswordVisibility>({
      password: false,
      confirmPassword: false,
    });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleTogglePasswordVisibility = () => togglePasswordVisibility("password");
  const handleToggleConfirmPasswordVisibility = () => togglePasswordVisibility("confirmPassword");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigation(routes.login);
  };

  return (
    <div className="container-fuild">
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row">
          <div className="col-lg-5">
            <div className="login-background position-relative d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100">
              <div className="bg-overlay-img">
                <ImageWithBasePath src="assets/img/bg/bg-01.png" className="bg-1" alt="Background pattern 1" />
                <ImageWithBasePath src="assets/img/bg/bg-02.png" className="bg-2" alt="Background pattern 2" />
                <ImageWithBasePath src="assets/img/bg/bg-03.png" className="bg-3" alt="Background pattern 3" />
              </div>
              <div className="authentication-card w-100">
                <div className="authen-overlay-item border w-100">
                  <h2 className="text-white display-1">
                    Empowering people <br /> through seamless HR <br /> management.
                  </h2>
                  <div className="my-4 mx-auto authen-overlay-img">
                    <ImageWithBasePath src="assets/img/bg/authentication-bg-01.png" alt="Authentication illustration" />
                  </div>
                  <div>
                    <p className="text-white fs-20 fw-semibold text-center">
                      Efficiently manage your workforce, streamline <br /> operations effortlessly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-7 col-md-12 col-sm-12">
            <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
              <div className="col-md-7 mx-auto vh-100">
                <form className="vh-100" onSubmit={handleSubmit}>
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className="mx-auto mb-5 text-center">
                      <ImageWithBasePath
                        src="assets/img/logo.svg"
                        className="img-fluid"
                        alt="NBS Archive System"
                      />
                    </div>
                    <div className="">
                      <div className="text-center mb-3">
                        <h1 className="mb-2">{t("auth.signUp")}</h1>
                        <p className="mb-0">{t("auth.signUpSubtitle")}</p>
                      </div>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="register-name">{t("auth.name")}</label>
                        <div className="input-group">
                          <input
                            id="register-name"
                            type="text"
                            defaultValue=""
                            className="form-control border-end-0"
                            required
                          />
                          <span className="input-group-text border-start-0">
                            <i className="ti ti-user" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="register-email">{t("auth.emailAddress")}</label>
                        <div className="input-group">
                          <input
                            id="register-email"
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
                        <label className="form-label" htmlFor="register-password">{t("auth.password")}</label>
                        <div className="pass-group">
                          <input
                            id="register-password"
                            type={passwordVisibility.password ? "text" : "password"}
                            className="pass-input form-control"
                            required
                            autoComplete="new-password"
                          />
                          <span
                            className={`ti toggle-passwords ${passwordVisibility.password ? "ti-eye" : "ti-eye-off"}`}
                            onClick={handleTogglePasswordVisibility}
                            role="button"
                            tabIndex={0}
                            aria-label={t("auth.togglePasswordVisibility")}
                          ></span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="register-confirm-password">{t("auth.confirmPassword")}</label>
                        <div className="pass-group">
                          <input
                            id="register-confirm-password"
                            type={passwordVisibility.confirmPassword ? "text" : "password"}
                            className="pass-input form-control"
                            required
                            autoComplete="new-password"
                          />
                          <span
                            className={`ti toggle-passwords ${passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"}`}
                            onClick={handleToggleConfirmPasswordVisibility}
                            role="button"
                            tabIndex={0}
                            aria-label={t("auth.togglePasswordVisibility")}
                          ></span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="form-check form-check-md mb-0">
                            <input
                              className="form-check-input"
                              id="remember_me"
                              type="checkbox"
                              required
                            />
                            <label
                              htmlFor="remember_me"
                              className="form-check-label text-dark mt-0"
                            >
                              {t("auth.agreeTermsPrivacy")}
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <button type="submit" className="btn btn-primary w-100">
                          {t("auth.signUp")}
                        </button>
                      </div>
                      <div className="text-center">
                        <h2 className="fw-normal text-dark mb-0 fs-6">
                          {t("auth.alreadyHaveAccount")}{" "}
                          <Link to={all_routes.login} className="hover-a ms-1">
                            {t("auth.signIn")}
                          </Link>
                        </h2>
                      </div>
                      <div className="login-or">
                        <span className="span-or">{t("auth.or")}</span>
                      </div>
                      <div className="mt-2">
                        <div className="d-flex align-items-center justify-content-center flex-wrap">
                          <div className="text-center me-2 flex-fill">
                            <Link
                              to="#"
                              className="br-10 p-2 btn btn-info d-flex align-items-center justify-content-center"
                              aria-label={t("auth.signInWithFacebook")}
                            >
                              <span role="presentation"><ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/facebook-logo.svg"
                                alt=""
                              /></span>
                            </Link>
                          </div>
                          <div className="text-center me-2 flex-fill">
                            <Link
                              to="#"
                              className="br-10 p-2 btn btn-outline-light border d-flex align-items-center justify-content-center"
                              aria-label={t("auth.signInWithGoogle")}
                            >
                              <span role="presentation"><ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/google-logo.svg"
                                alt=""
                              /></span>
                            </Link>
                          </div>
                          <div className="text-center flex-fill">
                            <Link
                              to="#"
                              className="bg-dark br-10 p-2 btn btn-dark d-flex align-items-center justify-content-center"
                              aria-label={t("auth.signInWithApple")}
                            >
                              <span role="presentation"><ImageWithBasePath
                                className="img-fluid m-1"
                                src="assets/img/icons/apple-logo.svg"
                                alt=""
                              /></span>
                            </Link>
                          </div>
                        </div>
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

export default RegisterPage;
