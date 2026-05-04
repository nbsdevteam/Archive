import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Upload, Activity, LogOut } from "lucide-react";
import { Button } from "../../../shared/components/ui";
import ImageWithBasePath from "../imageWithBasePath";

export interface HeaderMobileMenuProps {
  routes: Record<string, string>;
  onLogout: () => void;
}

/** Mobile user dropdown: avatar, quick links, logout (dropdown-menu-end for RTL). */
export function HeaderMobileMenu({ routes, onLogout }: HeaderMobileMenuProps) {
  const { t } = useTranslation();
  return (
    <div className="dropdown mobile-user-menu">
      <Link
        to="#"
        className="nav-link dropdown-toggle"
        data-bs-toggle="dropdown"
        aria-label={t("app.userMenu")}
        aria-haspopup="true"
      >
        <span className="user-img" aria-hidden role="presentation">
          <ImageWithBasePath src="assets/img/profiles/avatar-12.jpg" alt="" className="img-fluid rounded-circle" />
        </span>
      </Link>
      <div className="dropdown-menu dropdown-menu-end">
        <div className="dropdown-header">
          <div className="d-flex align-items-center">
            <span className="avatar avatar-sm me-2">
              <ImageWithBasePath src="assets/img/profiles/avatar-12.jpg" alt="" className="img-fluid rounded-circle" />
            </span>
            <div>
              <h6 className="mb-0">{t("app.archiveUser")}</h6>
              <p className="fs-12 fw-medium mb-0">{t("app.archiveEmailExample")}</p>
            </div>
          </div>
        </div>
        <Link className="dropdown-item" to={routes.documentsUpload}>
          <Upload size={16} className="me-1" aria-hidden />
          {t("app.upload")}
        </Link>
        <Link className="dropdown-item" to={routes.activity}>
          <Activity size={16} className="me-1" aria-hidden />
          {t("app.activity")}
        </Link>
        <Button
          type="button"
          variant="light"
          className="dropdown-item border-0 bg-transparent w-100 text-start shadow-none"
          onClick={onLogout}
        >
          <LogOut size={16} className="me-2" aria-hidden />
          {t("app.logout")}
        </Button>
      </div>
    </div>
  );
}
