import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { Icon } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useArchiveFolders } from "../hooks";

const ArchiveFolders = () => {
  const routes = all_routes;
  const { folders } = useArchiveFolders({ useApi: false });

  return (
    <PageLayout
      title="Folders"
      breadcrumbItems={[{ label: "Archive" }]}
      homeTo={routes.adminDashboard}
      rightContent={
        <>
          <Link
            to={routes.archiveUpload}
            className="btn btn-secondary d-inline-flex align-items-center me-2 mb-2"
          >
            <Icon name="folder-plus" className="me-2" />
            New Folder
          </Link>
          <CollapseHeader />
        </>
      }
    >
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
    </PageLayout>
  );
};

export default ArchiveFolders;
