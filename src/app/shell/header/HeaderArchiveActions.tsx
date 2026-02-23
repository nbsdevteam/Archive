import { Link } from "react-router-dom";
import { Upload, Activity } from "lucide-react";

export interface HeaderArchiveActionsProps {
  routes: Record<string, string>;
}

/** Header quick-access buttons: Upload and Activity log shortcuts. */
export function HeaderArchiveActions({ routes }: HeaderArchiveActionsProps) {
  return (
    <>
      <div className="me-1">
        <Link to={routes.documentsUpload} className="btn btn-menubar" aria-label="Upload">
          <Upload size={18} aria-hidden />
        </Link>
      </div>
      <div className="me-1">
        <Link to={routes.activity} className="btn btn-menubar" aria-label="Activity">
          <Activity size={18} aria-hidden />
        </Link>
      </div>
    </>
  );
}
