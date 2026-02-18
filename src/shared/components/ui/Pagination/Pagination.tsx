/**
 * Reusable pagination UI: First / Prev / page numbers with ellipses / Next / Last,
 * optional per-page selector and "Showing X–Y of Total". Accessible and URL-sync friendly.
 */

import { useTranslation } from "react-i18next";
import { Button, Icon } from "@/shared/components/ui";
import {
  getPaginationPageTokens,
  computeTotalPages,
  ELLIPSIS,
  type PageToken,
} from "@/shared/utils/pagination";

export const DEFAULT_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

export interface PaginationProps {
  /** Current 1-based page */
  page: number;
  /** Items per page */
  perPage: number;
  /** Total item count (optional; used for "Showing X–Y of Total" and to compute totalPages if missing) */
  total?: number;
  /** Total pages (optional; computed from total and perPage when not provided, e.g. audit logs) */
  totalPages?: number;
  /** Called when user selects a different page */
  onPageChange: (page: number) => void;
  /** Called when user changes per-page size; omit to hide per-page selector */
  onPerPageChange?: (perPage: number) => void;
  /** Number of page numbers to show on each side of current (default 1) */
  siblingCount?: number;
  /** Number of pages to always show at start/end (default 1: first and last persist) */
  boundaryCount?: number;
  /** Disable all controls (e.g. while loading) */
  disabled?: boolean;
  /** Optional per-page options; when undefined and onPerPageChange provided, uses DEFAULT_PER_PAGE_OPTIONS */
  perPageOptions?: readonly number[];
  /** Optional className for the nav wrapper */
  className?: string;
}

/**
 * Renders pagination bar: First, Previous, page tokens (1 … 6 7 8 … 15), Next, Last,
 * optional "Showing X–Y of Total" and per-page dropdown. Uses nav and aria-* for a11y.
 */
export function Pagination({
  page,
  perPage,
  total,
  totalPages: totalPagesProp,
  onPageChange,
  onPerPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  disabled = false,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  className = "",
}: PaginationProps) {
  const { t } = useTranslation();
  const totalPages =
    totalPagesProp ??
    (total != null && perPage > 0 ? computeTotalPages(total, perPage) : 0);
  const safePage = Math.max(1, Math.min(page, totalPages || 1));
  const tokens: PageToken[] =
    totalPages > 0
      ? getPaginationPageTokens(safePage, totalPages, siblingCount, boundaryCount)
      : [];

  const handleFirst = () => onPageChange(1);
  const handlePrev = () => onPageChange(Math.max(1, safePage - 1));
  const handleNext = () => onPageChange(Math.min(totalPages, safePage + 1));
  const handleLast = () => onPageChange(totalPages);

  const showPerPage = typeof onPerPageChange === "function";
  const startItem = total != null && total > 0 ? (safePage - 1) * perPage + 1 : 0;
  const endItem =
    total != null && total > 0
      ? Math.min(safePage * perPage, total)
      : 0;

  return (
    <nav
      className={`d-flex flex-wrap align-items-center gap-2 ${className}`.trim()}
      aria-label={t("common.pagination", { defaultValue: "Pagination" })}
    >
      {/* Showing X–Y of Total */}
      {total != null && total > 0 && (
        <span className="text-muted small me-2">
          {t("common.showingXYOfTotal", {
            defaultValue: "Showing {{start}}–{{end}} of {{total}}",
            start: startItem,
            end: endItem,
            total,
          })}
        </span>
      )}

      {/* Per-page selector */}
      {showPerPage && (
        <div className="d-flex align-items-center gap-1 me-2">
          <label
            htmlFor="pagination-per-page"
            className="form-label mb-0 small text-muted"
          >
            {t("common.perPage", { defaultValue: "Per page" })}
          </label>
          <select
            id="pagination-per-page"
            className="form-select form-select-sm"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            disabled={disabled}
            aria-label={t("common.perPage", { defaultValue: "Items per page" })}
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Page X of Y */}
      {totalPages > 0 && (
        <span className="text-muted small me-2">
          {t("common.pageXOfY", {
            defaultValue: "Page {{page}} of {{total}}",
            page: safePage,
            total: totalPages,
          })}
        </span>
      )}

      {/* First / Prev / numbers / Next / Last */}
      <div className="d-flex align-items-center gap-1 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="btn-outline-secondary pagination-btn"
          onClick={handleFirst}
          disabled={disabled || safePage <= 1}
          aria-label={t("common.firstPage", { defaultValue: "First page" })}
        >
          <Icon name="chevrons-left" className="pagination-icon" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="btn-outline-secondary pagination-btn"
          onClick={handlePrev}
          disabled={disabled || safePage <= 1}
          aria-label={t("common.previous", { defaultValue: "Previous page" })}
        >
          <Icon name="chevron-left" className="pagination-icon" aria-hidden />
        </Button>

        <ul className="pagination mb-0 d-flex align-items-center gap-1 list-unstyled">
          {tokens.map((token, idx) =>
            token === ELLIPSIS ? (
              <li key={`ellipsis-${idx}`} className="page-item disabled px-1">
                <span className="page-link" aria-hidden="true">
                  {ELLIPSIS}
                </span>
              </li>
            ) : (
              <li
                key={token}
                className={`page-item ${token === safePage ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="page-link"
                  onClick={() => onPageChange(token as number)}
                  disabled={disabled}
                  aria-current={token === safePage ? "page" : undefined}
                  aria-label={t("common.pageNumber", {
                    defaultValue: "Page {{num}}",
                    num: token,
                  })}
                >
                  {token}
                </button>
              </li>
            )
          )}
        </ul>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="btn-outline-secondary pagination-btn"
          onClick={handleNext}
          disabled={disabled || safePage >= totalPages}
          aria-label={t("common.next", { defaultValue: "Next page" })}
        >
          <Icon name="chevron-right" className="pagination-icon" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="btn-outline-secondary pagination-btn"
          onClick={handleLast}
          disabled={disabled || safePage >= totalPages}
          aria-label={t("common.lastPage", { defaultValue: "Last page" })}
        >
          <Icon name="chevrons-right" className="pagination-icon" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
