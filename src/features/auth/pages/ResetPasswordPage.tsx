import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";

type PasswordField = "password" | "confirmPassword";

type PasswordVisibility = {
  password: boolean;
  confirmPassword: boolean;
};

type PasswordResponse = {
  passwordResponceText: string;
  passwordResponceKey: string;
};

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const navigation = useNavigate();

  const [passwordVisibility, setPasswordVisibility] =
    useState<PasswordVisibility>({
      password: false,
      confirmPassword: false,
    });
  const [password, setPassword] = useState<string>("");
  const [passwordResponce, setPasswordResponce] = useState<PasswordResponse>({
    passwordResponceText:
      "Use 8 or more characters with a mix of letters, numbers, and symbols.",
    passwordResponceKey: "",
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleTogglePasswordVisibility = () => togglePasswordVisibility("password");
  const handleToggleConfirmPasswordVisibility = () => togglePasswordVisibility("confirmPassword");
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => onChangePassword(e.target.value);

  const onChangePassword = (nextPassword: string) => {
    setPassword(nextPassword);
    if (nextPassword.match(/^$|\\s+/)) {
      setPasswordResponce({
        passwordResponceText:
          "Use 8 or more characters with a mix of letters, numbers & symbols",
        passwordResponceKey: "",
      });
    } else if (nextPassword.length === 0) {
      setPasswordResponce({
        passwordResponceText: "",
        passwordResponceKey: "",
      });
    } else if (nextPassword.length < 8) {
      setPasswordResponce({
        passwordResponceText: "Weak. Must contain at least 8 characters",
        passwordResponceKey: "0",
      });
    } else if (
      nextPassword.search(/[a-z]/) < 0 ||
      nextPassword.search(/[A-Z]/) < 0 ||
      nextPassword.search(/[0-9]/) < 0
    ) {
      setPasswordResponce({
        passwordResponceText:
          "Average. Must contain at least 1 upper case and number",
        passwordResponceKey: "1",
      });
    } else if (nextPassword.search(/(?=.*?[#?!@$%^&*-])/) < 0) {
      setPasswordResponce({
        passwordResponceText: "Almost. Must contain a special symbol",
        passwordResponceKey: "2",
      });
    } else {
      setPasswordResponce({
        passwordResponceText: "Awesome! You have a secure password.",
        passwordResponceKey: "3",
      });
    }
  };

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
                  <h1 className="text-white display-1">
                    Empowering people <br /> through seamless HR <br /> management.
                  </h1>
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
                        <h2 className="mb-2">{t("auth.resetPassword")}</h2>
                        <p className="mb-0">
                          {t("auth.resetPasswordSubtitle")}
                        </p>
                      </div>
                      <div>
                        <div className="input-block mb-3">
                          <div className="mb-3">
                            <label className="form-label">{t("auth.password")}</label>
                            <div className="pass-group" id="passwordInput">
                              <input
                                type={passwordVisibility.password ? "text" : "password"}
                                value={password}
                                onChange={handlePasswordInputChange}
                                className="form-control pass-input"
                                placeholder={t("auth.enterPassword")}
                                required
                                autoComplete="new-password"
                              />
                              <span
                                className={`ti toggle-passwords ${passwordVisibility.password ? "ti-eye" : "ti-eye-off"}`}
                                onClick={handleTogglePasswordVisibility}
                                style={{ cursor: "pointer" }}
                                role="button"
                                tabIndex={0}
                                aria-label={t("auth.togglePasswordVisibility")}
                              ></span>
                            </div>
                          </div>
                          <div
                            className={`password-strength d-flex ${
                              passwordResponce.passwordResponceKey === "0"
                                ? "poor-active"
                                : passwordResponce.passwordResponceKey === "1"
                                  ? "avg-active"
                                  : passwordResponce.passwordResponceKey === "2"
                                    ? "strong-active"
                                    : passwordResponce.passwordResponceKey === "3"
                                      ? "heavy-active"
                                      : ""
                            }`}
                            id="passwordStrength"
                          >
                            <span id="poor" className="active" />
                            <span id="weak" className="active" />
                            <span id="strong" className="active" />
                            <span id="heavy" className="active" />
                          </div>
                        </div>
                        <p className="fs-12">{passwordResponce.passwordResponceText}</p>
                        <div className="mb-3">
                          <label className="form-label">{t("auth.confirmPassword")}</label>
                          <div className="pass-group">
                            <input
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
                        <div className="mb-3">
                          <button type="submit" className="btn btn-primary w-100">
                            {t("auth.submit")}
                          </button>
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

export default ResetPasswordPage;
