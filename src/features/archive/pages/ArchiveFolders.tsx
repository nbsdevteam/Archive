import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { useArchiveFolders } from "../hooks";
import { Icon } from "../../../shared/components/ui";

const ArchiveFolders = () => {
  const routes = all_routes;
  // Use container with static data by default (useApi=false)
  const { folders } = useArchiveFolders({ useApi: false });

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Folders</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Archive</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Folders
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="me-2 mb-2">
              <Link
                to={routes.archiveUpload}
                className="btn btn-secondary d-inline-flex align-items-center"
              >
                <Icon name="folder-plus" className="me-2" />
                New Folder
              </Link>
            </div>
            <div className="ms-2 head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="fs-12 fw-medium mb-0 text-gray-5 mb-1">
                  Total Folders
                </p>
                <h4>1,248</h4>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="fs-12 fw-medium mb-0 text-gray-5 mb-1">
                  Shared Folders
                </p>
                <h4>214</h4>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="fs-12 fw-medium mb-0 text-gray-5 mb-1">
                  Updated This Week
                </p>
                <h4>68</h4>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <p className="fs-12 fw-medium mb-0 text-gray-5 mb-1">
                  Storage Used
                </p>
                <h4>3.7 TB</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {folders.map((folder) => (
            <div className="col-xl-3 col-md-6 d-flex" key={folder.name}>
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="p-2 br-10 bg-primary-transparent border border-primary d-flex align-items-center justify-content-center">
                      <Icon name="folder" className="text-primary fs-18" />
                    </span>
                    <span className="badge bg-light text-dark">Updated {folder.updated}</span>
                  </div>
                  <h5 className="mb-1">{folder.name}</h5>
                  <p className="text-muted mb-3">{folder.docs} documents</p>
                  <Link to={routes.archiveDocuments} className="link-primary fs-13">
                    View documents
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArchiveFolders;
