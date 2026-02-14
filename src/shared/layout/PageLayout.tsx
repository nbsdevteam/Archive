import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/ui";

export interface BreadcrumbItem {
  /** Label for the breadcrumb segment */
  label: ReactNode;
  /** Optional path; if set, segment is a link */
  to?: string;
}

export interface PageLayoutProps {
  /** Current page title (heading and last breadcrumb segment) */
  title: ReactNode;
  /** Breadcrumb segments before the current page (e.g. [{ label: "Documents", to: "/documents" }]) */
  breadcrumbItems?: BreadcrumbItem[];
  /** Path for the home link (default: first item’s `to` or "#"); pass e.g. routes.adminDashboard */
  homeTo?: string;
  /** Optional right-side content (e.g. CollapseHeader, action buttons) */
  rightContent?: ReactNode;
  /** Main page content (card, table, etc.) */
  children: ReactNode;
}

/**
 * Reusable page layout: wrapper, breadcrumb (home + optional links + current title), optional right slot.
 * Use for document list, archive, trash, folders, etc. to avoid repeating the same markup.
 */
export function PageLayout({
  title,
  breadcrumbItems = [],
  homeTo = "#",
  rightContent,
  children,
}: PageLayoutProps) {
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">{title}</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={homeTo} aria-label="Home">
                    <Icon name="smart-home" />
                  </Link>
                </li>
                {breadcrumbItems.map((item, index) => (
                  <li key={index} className="breadcrumb-item">
                    {item.to != null ? (
                      <Link to={item.to}>{item.label}</Link>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </li>
                ))}
                <li className="breadcrumb-item active" aria-current="page">
                  {title}
                </li>
              </ol>
            </nav>
          </div>
          {rightContent != null && (
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="ms-2 head-icons">{rightContent}</div>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
