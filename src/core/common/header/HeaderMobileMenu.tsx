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
        <span className="user-img" aria-hidden>
          <ImageWithBasePath src="assets/img/profiles/avatar-12.jpg" alt="" className="img-fluid rounded-circle" role="presentation" />
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
        <Link className="dropdown-item" to={routes.archiveFolders}>
          <i className="ti ti-folder me-1"></i>My Folders
        </Link>
        <Link className="dropdown-item" to={routes.archiveDocuments}>
          <i className="ti ti-file me-1"></i>My Documents
        </Link>
        <Link className="dropdown-item" to={routes.archiveUpload}>
          <i className="ti ti-upload me-1"></i>Upload
        </Link>
        <Link className="dropdown-item" to={routes.archiveActivity}>
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
