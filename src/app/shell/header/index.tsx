import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useSidebarUiStore } from "../../../shared/stores/sidebarUiStore";
import { all_routes } from "../../../router/all_routes";
import { useAuth } from "../../../shared/auth";
import React from "react";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderArchiveActions } from "./HeaderArchiveActions";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { HeaderMobileMenu } from "./HeaderMobileMenu";

/** True when current language is Arabic (handles ar, ar-SA, etc.). */
function isArabic(i18n: {
  language: string;
  resolvedLanguage?: string;
}): boolean {
  const lng = i18n.resolvedLanguage ?? i18n.language;
  return typeof lng === "string" && lng.startsWith("ar");
}

const Header = React.memo(() => {
  const { t, i18n } = useTranslation();
  const routes = all_routes;
  const isAr = isArabic(i18n);
  const setLanguage = useCallback(
    (lng: "en" | "ar") => () => {
      i18n.changeLanguage(lng);
    },
    [i18n],
  );
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { setMobileSidebar, mobileSidebar, toggleMiniSidebar } =
    useSidebarUiStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleLogout = useCallback(() => {
    logout().then(() => navigate(routes.login, { replace: true }));
  }, [logout, navigate, routes.login]);

  const toggleMobileSidebar = useCallback(
    () => setMobileSidebar(!mobileSidebar),
    [setMobileSidebar, mobileSidebar],
  );
  const handleToggleMiniSidebar = useCallback(
    () => toggleMiniSidebar(),
    [toggleMiniSidebar],
  );

  /** Toggles browser fullscreen mode and tracks state for icon swap. */
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement)
        document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  return (
    <>
      <div className="header">
        <div className="main-header">
          <div className="header-left">
            <Link
              to={routes.dashboard}
              className="logo"
              aria-label={t("app.homeNbsArchive")}
            >
              <span className="logo-text">
                {t("app.nbsArchiveSystem", {
                  defaultValue: "NBS Archive System",
                })}
              </span>
            </Link>
          </div>

          <Link
            id="mobile_btn"
            onClick={toggleMobileSidebar}
            className="mobile_btn"
            to="#sidebar"
            aria-label={t("app.openMenu")}
          >
            <span className="bar-icon" aria-hidden>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </Link>

          <div className="header-user">
            <div className="nav user-menu nav-list">
              <div
                className="me-auto d-flex align-items-center"
                id="header-search"
                style={{ flex: 1, minWidth: 0, gap: "1.25rem" }}
              >
                <Link
                  id="toggle_btn"
                  to="#"
                  onClick={handleToggleMiniSidebar}
                  className="btn btn-menubar flex-shrink-0"
                  aria-label={t("app.toggleSidebar")}
                >
                  <i className="ti ti-arrow-bar-to-left" aria-hidden></i>
                </Link>
                <HeaderSearch routes={routes} t={t} />
                <span className="d-inline-flex flex-shrink-0 px-4"></span>
              </div>

              <div className="d-flex align-items-center">
                <div className="dropdown me-1">
                  <button
                    type="button"
                    className="btn btn-menubar"
                    data-bs-toggle="dropdown"
                    aria-label={t("app.switchLanguage")}
                    aria-haspopup="true"
                    title={t("app.switchLanguage")}
                  >
                    <i className="ti ti-world" aria-hidden></i>
                  </button>
                  <div className="dropdown-menu dropdown-menu-end">
                    <button
                      type="button"
                      className={`dropdown-item d-flex align-items-center ${!isAr ? "active" : ""}`}
                      onClick={setLanguage("en")}
                    >
                      <span
                        className="me-2"
                        style={{ width: "1.25rem", textAlign: "start" }}
                      >
                        {!isAr && <i className="ti ti-check" aria-hidden></i>}
                      </span>
                      {t("app.english")}
                    </button>
                    <button
                      type="button"
                      className={`dropdown-item d-flex align-items-center ${isAr ? "active" : ""}`}
                      onClick={setLanguage("ar")}
                    >
                      <span
                        className="me-2"
                        style={{ width: "1.25rem", textAlign: "start" }}
                      >
                        {isAr && <i className="ti ti-check" aria-hidden></i>}
                      </span>
                      العربية
                    </button>
                  </div>
                </div>
                <div className="me-1">
                  <Link
                    to="#"
                    onClick={toggleFullscreen}
                    className="btn btn-menubar btnFullscreen"
                    aria-label={t("app.toggleFullscreen")}
                  >
                    <i className="ti ti-maximize" aria-hidden></i>
                  </Link>
                </div>
                <HeaderArchiveActions routes={routes} />
                <HeaderUserMenu routes={routes} onLogout={handleLogout} />
              </div>
            </div>
          </div>

          <HeaderMobileMenu routes={routes} onLogout={handleLogout} />
        </div>
      </div>
    </>
  );
});

Header.displayName = "Header";

export default Header;
