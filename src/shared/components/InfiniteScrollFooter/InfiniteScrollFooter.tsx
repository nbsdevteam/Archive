import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button, Spinner } from "@/shared/components/ui";
import type { InfiniteListPaging } from "@/shared/hooks/useInfiniteList";
import "./infinite-scroll-footer.css";

/** Start loading before the user reaches the end so scrolling rarely has to pause. */
const LOAD_AHEAD_MARGIN = "600px 0px";

export interface InfiniteScrollFooterProps {
  paging: InfiniteListPaging;
  /**
   * Load automatically when scrolled near. Turn off while a client-side filter hides rows: the
   * footer would stay in view and pull the entire dataset, one request after another.
   */
  auto?: boolean;
}

/** End-of-list control: triggers the next page, shows progress, and always offers a manual fallback. */
export function InfiniteScrollFooter({ paging, auto = true }: InfiniteScrollFooterProps) {
  const { t } = useTranslation();
  const { hasNextPage, isFetchingNextPage, loadMoreFailed, fetchNextPage, loadedCount, total } = paging;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const shouldObserve = auto && hasNextPage && !isFetchingNextPage && !loadMoreFailed;

  /**
   * loadedCount is a dependency on purpose: a new observer reports the current intersection, and an
   * existing one would not fire again if the footer is still in view after a short page loads.
   */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!shouldObserve || !el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) fetchNextPage();
      },
      { rootMargin: LOAD_AHEAD_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldObserve, fetchNextPage, loadedCount]);

  if (loadedCount === 0 && !hasNextPage) return null;

  return (
    <div ref={sentinelRef} className="infinite-scroll-footer">
      {isFetchingNextPage ? (
        <span className="infinite-scroll-footer__status">
          <Spinner size="sm" />
          {t("common.loadingMore", { defaultValue: "Loading more…" })}
        </span>
      ) : (
        hasNextPage && (
          <div className="infinite-scroll-footer__action">
            {loadMoreFailed && (
              <span className="text-danger" role="alert">
                {t("common.loadMoreFailed", { defaultValue: "Could not load more items." })}
              </span>
            )}
            <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={fetchNextPage}>
              {loadMoreFailed
                ? t("common.retry", { defaultValue: "Retry" })
                : t("common.loadMore", { defaultValue: "Load more" })}
            </Button>
          </div>
        )
      )}
      {loadedCount > 0 && (
        <span className="infinite-scroll-footer__count">
          {t("common.showingLoaded", {
            defaultValue: "Showing {{loaded}} of {{total}}",
            loaded: loadedCount,
            total: Math.max(total, loadedCount),
          })}
        </span>
      )}
    </div>
  );
}
