import { Link } from "react-router-dom";

export interface HeaderArchiveActionsProps {
  routes: Record<string, string>;
}

/** Header quick links: Upload (opens same upload sidebar via /documents/upload) and Activity. */
export function HeaderArchiveActions({ routes }: HeaderArchiveActionsProps) {
  return (
    <>
      <div className="me-1">
        <Link to={routes.documentsUpload} className="btn btn-menubar" aria-label="Upload">
          <i className="ti ti-upload" aria-hidden></i>
        </Link>
      </div>
      <div className="me-1">
        <Link to={routes.activity} className="btn btn-menubar" aria-label="Activity">
          <i className="ti ti-activity" aria-hidden></i>
        </Link>
      </div>
    </>
  );
}
