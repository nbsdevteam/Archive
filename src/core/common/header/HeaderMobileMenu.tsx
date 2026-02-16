import { Link } from "react-router-dom";
import { Button } from "../../../shared/components/ui";
import ImageWithBasePath from "../imageWithBasePath";

export interface HeaderMobileMenuProps {
  routes: Record<string, string>;
  onLogout: () => void;
}

/** Mobile user dropdown: avatar, quick links, logout. */
export function HeaderMobileMenu({ routes, onLogout }: HeaderMobileMenuProps) {
  return (
    <div className="dropdown mobile-user-menu">
      <Link to="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-label="User menu" aria-haspopup="true">
        <span className="user-img" aria-hidden role="presentation">
          <ImageWithBasePath src="assets/img/profiles/avatar-12.jpg" alt="" className="img-fluid rounded-circle" />
        </span>
      </Link>
      <div className="dropdown-menu dropdown-menu-end">
        <div className="dropdown-header">
          <div className="d-flex align-items-center">
            <span className="avatar avatar-sm me-2">
              <ImageWithBasePath src="assets/img/profiles/avatar-12.jpg" alt="Img" className="img-fluid rounded-circle" />
            </span>
            <div>
              <h6 className="mb-0">Archive User</h6>
              <p className="fs-12 fw-medium mb-0">archive@example.com</p>
            </div>
          </div>
        </div>
        <Link className="dropdown-item" to={routes.activity}>
          <i className="ti ti-activity me-1"></i>Activity
        </Link>
        <Button
          type="button"
          variant="light"
          className="dropdown-item border-0 bg-transparent w-100 text-start shadow-none"
          onClick={onLogout}
        >
          <i className="ti ti-login me-2"></i>Logout
        </Button>
      </div>
    </div>
  );
}
