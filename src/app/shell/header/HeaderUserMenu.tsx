import { Link } from "react-router-dom";
import { Button } from "../../../shared/components/ui";
import ImageWithBasePath from "../imageWithBasePath";

export interface HeaderUserMenuProps {
  routes: Record<string, string>;
  onLogout: () => void;
}

/** Desktop profile dropdown: avatar, quick links, logout. */
export function HeaderUserMenu({ routes, onLogout }: HeaderUserMenuProps) {
  return (
    <div className="dropdown profile-dropdown">
      <Link to="#" className="dropdown-toggle d-flex align-items-center" data-bs-toggle="dropdown" aria-label="User menu" aria-haspopup="true">
        <span className="avatar avatar-sm online" aria-hidden role="presentation">
          <ImageWithBasePath src="assets/img/profiles/avatar-12.jpg" alt="" className="img-fluid rounded-circle" />
        </span>
      </Link>
      <div className="dropdown-menu shadow-none">
        <div className="card mb-0">
          <div className="card-header">
            <div className="d-flex align-items-center">
              <span className="avatar avatar-lg me-2 avatar-rounded">
                <ImageWithBasePath src="assets/img/profiles/avatar-12.jpg" alt="img" />
              </span>
              <div>
                <h5 className="mb-0">Archive User</h5>
                <p className="fs-12 fw-medium mb-0">archive@example.com</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <Link className="dropdown-item d-inline-flex align-items-center p-0 py-2" to={routes.documentsUpload}>
              <i className="ti ti-upload me-1"></i>Upload
            </Link>
            <Link className="dropdown-item d-inline-flex align-items-center p-0 py-2" to={routes.activity}>
              <i className="ti ti-activity me-1"></i>Activity
            </Link>
          </div>
          <div className="card-footer">
            <Button
              type="button"
              variant="light"
              className="dropdown-item d-inline-flex align-items-center p-0 py-2 border-0 bg-transparent w-100 text-start shadow-none"
              onClick={onLogout}
            >
              <i className="ti ti-login me-2"></i>Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
