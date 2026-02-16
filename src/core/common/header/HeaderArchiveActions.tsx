import { Link } from "react-router-dom";

export interface HeaderArchiveActionsProps {
  routes: Record<string, string>;
}

/** Header quick link to Activity (audit/activity log) at /activity. */
export function HeaderArchiveActions({ routes }: HeaderArchiveActionsProps) {
  return (
    <div className="me-1">
      <Link to={routes.activity} className="btn btn-menubar" aria-label="Activity">
        <i className="ti ti-activity" aria-hidden></i>
      </Link>
    </div>
  );
}
