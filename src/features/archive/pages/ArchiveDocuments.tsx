import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { useArchiveDocuments } from "../hooks";
import { Icon } from "../../../shared/components/ui";
import "../styles/archive.css";

const ArchiveDocuments = () => {
  const routes = all_routes;
  // Use container with static data by default (useApi=false)
  const { documents } = useArchiveDocuments({ useApi: false });

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Documents</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Archive</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Documents
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
                <Icon name="upload" className="me-2" />
                Upload Files
              </Link>
            </div>
            <div className="ms-2 head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">Latest Documents</h5>
            <Link to={routes.dataTables} className="link-primary fs-13">
              View table tools
            </Link>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Last Updated</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.name}>
                      <td>{doc.name}</td>
                      <td>{doc.type}</td>
                      <td>{doc.updated}</td>
                      <td className="text-end">
                        <Link to="#" className="btn btn-sm btn-light me-1">
                          View
                        </Link>
                        <Link to="#" className="btn btn-sm btn-secondary">
                          Download
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveDocuments;
