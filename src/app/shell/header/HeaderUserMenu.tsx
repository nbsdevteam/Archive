import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Upload, Activity, LogOut } from "lucide-react";
import { Button } from "../../../shared/components/ui";
import ImageWithBasePath from "../imageWithBasePath";

export interface HeaderUserMenuProps {
  routes: Record<string, string>;
  onLogout: () => void;
}

/** Desktop profile dropdown: avatar, quick links, logout (RTL-aware alignment via dropdown-menu-end). */
export function HeaderUserMenu({ routes, onLogout }: HeaderUserMenuProps) {
  const { t } = useTranslation();
  return (
    <div className="dropdown profile-dropdown">
      <Link
        to="#"
        className="dropdown-toggle d-flex align-items-center"
        data-bs-toggle="dropdown"
        aria-label={t("app.userMenu")}
        aria-haspopup="true"
      >
        <span className="avatar avatar-sm online" aria-hidden role="presentation">
          <ImageWithBasePath src="assets/img/profiles/avatar-12.jpg" alt="" className="img-fluid rounded-circle" />
        </span>
      </Link>
      <div className="dropdown-menu dropdown-menu-end shadow-none">
        <div className="card mb-0">
          <div className="card-header">
            <div className="d-flex align-items-center">
              <span className="avatar avatar-lg me-2 avatar-rounded">
                <ImageWithBasePath src="assets/img/profiles/avatar-12.jpg" alt="" />
              </span>
              <div>
                <h5 className="mb-0">{t("app.archiveUser")}</h5>
                <p className="fs-12 fw-medium mb-0">{t("app.archiveEmailExample")}</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <Link className="dropdown-item d-inline-flex align-items-center p-0 py-2" to={routes.documentsUpload}>
              <Upload size={16} className="me-1" aria-hidden />
              {t("app.upload")}
            </Link>
            <Link className="dropdown-item d-inline-flex align-items-center p-0 py-2" to={routes.activity}>
              <Activity size={16} className="me-1" aria-hidden />
              {t("app.activity")}
            </Link>
          </div>
          <div className="card-footer">
            <Button
              type="button"
              variant="light"
              className="dropdown-item d-inline-flex align-items-center p-0 py-2 border-0 bg-transparent w-100 text-start shadow-none"
              onClick={onLogout}
            >
              <LogOut size={16} className="me-2" aria-hidden />
              {t("app.logout")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
