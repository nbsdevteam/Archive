import type { ReactNode } from "react";

export interface TablePageToolbarProps {
  /** Left side: page title (e.g. <h5 className="card-title mb-0">...</h5>). */
  title: ReactNode;
  /** Left side: count or loading label (e.g. "3 documents" or "Loading..."). */
  countSlot?: ReactNode;
  /** Right side: search, filter button, ListFilter, and page-specific actions. */
  children: ReactNode;
  /** Optional class for the right-side wrapper (e.g. documents__header-actions). */
  rightClassName?: string;
}

/**
 * Shared card-header layout for list/table pages: title + count on the left,
 * slot for search/filter/actions on the right. Use inside a card; compose
 * SearchInput, ListFilter, and buttons as children.
 */
export function TablePageToolbar({
  title,
  countSlot,
  children,
  rightClassName,
}: TablePageToolbarProps) {
  return (
    <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
      <div className="d-flex align-items-center gap-2">
        {title}
        {countSlot != null && <span className="text-muted fs-13">{countSlot}</span>}
      </div>
      <div className={`d-flex align-items-center gap-2 ${rightClassName ?? ""}`.trim()}>
        {children}
      </div>
    </div>
  );
}
