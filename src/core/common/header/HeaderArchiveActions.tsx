import { Link } from "react-router-dom";

export interface HeaderArchiveActionsProps {
  routes: Record<string, string>;
}

/** Archive quick links and dropdown: Folders, Documents, Upload, Trash, Activity. */
export function HeaderArchiveActions({ routes }: HeaderArchiveActionsProps) {
  return (
    <>
      <div className="dropdown me-1">
        <Link to="#" className="btn btn-menubar" data-bs-toggle="dropdown">
          <i className="ti ti-layout-grid-remove"></i>
        </Link>
        <div className="dropdown-menu dropdown-menu-end">
          <div className="card mb-0 border-0 shadow-none">
            <div className="card-header">
              <h4>Archive Actions</h4>
            </div>
            <div className="card-body">
              <Link to={routes.archiveFolders} className="d-block pb-2">
                <span className="avatar avatar-md bg-transparent-dark me-2">
                  <i className="ti ti-folder text-gray-9"></i>
                </span>
                Folders
              </Link>
              <Link to={routes.archiveDocuments} className="d-block py-2">
                <span className="avatar avatar-md bg-transparent-dark me-2">
                  <i className="ti ti-file text-gray-9"></i>
                </span>
                Documents
              </Link>
              <Link to={routes.archiveUpload} className="d-block py-2">
                <span className="avatar avatar-md bg-transparent-dark me-2">
                  <i className="ti ti-upload text-gray-9"></i>
                </span>
                Upload
              </Link>
              <Link to={routes.archiveTrash} className="d-block py-2">
                <span className="avatar avatar-md bg-transparent-dark me-2">
                  <i className="ti ti-trash text-gray-9"></i>
                </span>
                Trash
              </Link>
              <Link to={routes.archiveActivity} className="d-block py-2 pb-0">
                <span className="avatar avatar-md bg-transparent-dark me-2">
                  <i className="ti ti-activity text-gray-9"></i>
                </span>
                Activity
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="me-1">
        <Link to={routes.archiveUpload} className="btn btn-menubar">
          <i className="ti ti-upload"></i>
        </Link>
      </div>
      <div className="me-1">
        <Link to={routes.archiveFolders} className="btn btn-menubar">
          <i className="ti ti-folder"></i>
        </Link>
      </div>
      <div className="me-1">
        <Link to={routes.archiveActivity} className="btn btn-menubar">
          <i className="ti ti-activity"></i>
        </Link>
      </div>
    </>
  );
}
