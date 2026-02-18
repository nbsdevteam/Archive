/**
 * Pagination utilities: page token list for "1 ... 6 7 8 ... 15" style UI.
 * Kept pure for easy unit testing.
 */

export const ELLIPSIS = "…" as const;
export type PageToken = number | typeof ELLIPSIS;

/**
 * Generates a list of page tokens (numbers and ellipsis) for pagination UI.
 * First and last page are always shown; a window around current page with ellipses when gaps exist.
 *
 * @param page - Current 1-based page
 * @param totalPages - Total number of pages (>= 1)
 * @param siblingCount - How many page numbers to show on each side of current (default 1)
 * @param boundaryCount - How many pages to show at start/end boundary (default 1, so 1 and last persist)
 * @returns Array of number | "…", e.g. [1, "…", 6, 7, 8, "…", 15]
 */
export function getPaginationPageTokens(
  page: number,
  totalPages: number,
  siblingCount: number = 1,
  boundaryCount: number = 1
): PageToken[] {
  if (totalPages <= 0) return [];
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.max(1, Math.min(page, total));

  // All pages fit without ellipses (boundaryCount*2 + 1 + siblingCount*2)
  const totalVisible = boundaryCount * 2 + siblingCount * 2 + 1;
  if (total <= totalVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(1, current - siblingCount);
  const rightSibling = Math.min(total, current + siblingCount);

  const showLeftEllipsis = leftSibling > boundaryCount + 1;
  const showRightEllipsis = rightSibling < total - boundaryCount;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = boundaryCount + 1 + siblingCount * 2;
    const tokens: PageToken[] = Array.from({ length: leftCount }, (_, i) => i + 1);
    tokens.push(ELLIPSIS);
    tokens.push(total);
    return tokens;
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = boundaryCount + 1 + siblingCount * 2;
    const tokens: PageToken[] = [1, ELLIPSIS];
    for (let i = total - rightCount + 1; i <= total; i++) tokens.push(i);
    return tokens;
  }

  if (showLeftEllipsis && showRightEllipsis) {
    const tokens: PageToken[] = [1, ELLIPSIS];
    for (let i = leftSibling; i <= rightSibling; i++) tokens.push(i);
    tokens.push(ELLIPSIS);
    tokens.push(total);
    return tokens;
  }

  return Array.from({ length: total }, (_, i) => i + 1);
}

/**
 * Derives totalPages from total and perPage when API returns total but not total_pages (e.g. audit logs).
 */
export function computeTotalPages(total: number, perPage: number): number {
  if (perPage <= 0 || total <= 0) return 0;
  return Math.ceil(total / perPage);
}
