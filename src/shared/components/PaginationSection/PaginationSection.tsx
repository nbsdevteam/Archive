/**
 * PaginationSection - Wrapper component for consistent pagination UI across all list pages.
 * Right-aligned, compact, uniform button sizes, theme-friendly styling.
 */

import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Icon } from "@/shared/components/ui";
import {
  getPaginationPageTokens,
  computeTotalPages,
  ELLIPSIS,
  type PageToken,
} from "@/shared/utils/pagination";
import "./pagination-section.css";

export const DEFAULT_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

export interface PaginationSectionProps {
  page: number;
  perPage: number;
  total?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  disabled?: boolean;
  perPageOptions?: readonly number[];
  siblingCount?: number;
  boundaryCount?: number;
}

/**
 * Renders pagination controls: First/Prev/page numbers/Next/Last + optional per-page selector.
 * Right-aligned, compact, with uniform button sizes and clean styling.
 */
export function PaginationSection({
  page,
  perPage,
  total,
  totalPages: totalPagesProp,
  onPageChange,
  onPerPageChange,
  disabled = false,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationSectionProps) {
  const { t } = useTranslation();
  
  const totalPages = useMemo(
    () =>
      totalPagesProp ??
      (total != null && perPage > 0 ? computeTotalPages(total, perPage) : 0),
    [totalPagesProp, total, perPage]
  );

  const safePage = useMemo(
    () => Math.max(1, Math.min(page, totalPages || 1)),
    [page, totalPages]
  );

  const tokens = useMemo(
    () =>
      totalPages > 0
        ? getPaginationPageTokens(safePage, totalPages, siblingCount, boundaryCount)
        : [],
    [safePage, totalPages, siblingCount, boundaryCount]
  );

  const handleFirst = useCallback(() => onPageChange(1), [onPageChange]);
  const handlePrev = useCallback(
    () => onPageChange(Math.max(1, safePage - 1)),
    [onPageChange, safePage]
  );
  const handleNext = useCallback(
    () => onPageChange(Math.min(totalPages, safePage + 1)),
    [onPageChange, safePage, totalPages]
  );
  const handleLast = useCallback(
    () => onPageChange(totalPages),
    [onPageChange, totalPages]
  );

  const handlePerPageChangeInternal = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onPerPageChange) onPerPageChange(Number(e.target.value));
    },
    [onPerPageChange]
  );

  const showPerPage = typeof onPerPageChange === "function";

  return (
    <div className="pagination-section">
      <nav
        className="pagination-section__nav"
        aria-label={t("common.pagination", { defaultValue: "Pagination" })}
      >
        {/* Per-page selector */}
        {showPerPage && (
          <div className="pagination-section__per-page">
            <label
              htmlFor="pagination-per-page-select"
              className="pagination-section__per-page-label"
            >
              {t("common.perPage", { defaultValue: "Per page" })}
            </label>
            <select
              id="pagination-per-page-select"
              className="pagination-section__per-page-select"
              value={perPage}
              onChange={handlePerPageChangeInternal}
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

        {/* Pagination controls */}
        <div className="pagination-section__controls">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="btn-outline-secondary pagination-section__btn"
            onClick={handleFirst}
            disabled={disabled || safePage <= 1}
            aria-label={t("common.firstPage", { defaultValue: "First page" })}
          >
            <Icon name="chevrons-left" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="btn-outline-secondary pagination-section__btn"
            onClick={handlePrev}
            disabled={disabled || safePage <= 1}
            aria-label={t("common.previous", { defaultValue: "Previous page" })}
          >
            <Icon name="chevron-left" />
          </Button>

          {/* Page number buttons */}
          <div className="pagination-section__pages">
            {tokens.map((token, idx) =>
              token === ELLIPSIS ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="pagination-section__ellipsis"
                  aria-hidden="true"
                >
                  {ELLIPSIS}
                </span>
              ) : (
                <button
                  key={token}
                  type="button"
                  className={`pagination-section__page-btn ${
                    token === safePage ? "pagination-section__page-btn--active" : ""
                  }`}
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
              )
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="btn-outline-secondary pagination-section__btn"
            onClick={handleNext}
            disabled={disabled || safePage >= totalPages}
            aria-label={t("common.next", { defaultValue: "Next page" })}
          >
            <Icon name="chevron-right" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="btn-outline-secondary pagination-section__btn"
            onClick={handleLast}
            disabled={disabled || safePage >= totalPages}
            aria-label={t("common.lastPage", { defaultValue: "Last page" })}
          >
            <Icon name="chevrons-right" />
          </Button>
        </div>
      </nav>
    </div>
  );
}
