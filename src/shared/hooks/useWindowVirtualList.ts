import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { measureElement as defaultMeasureElement, useWindowVirtualizer } from "@tanstack/react-virtual";

export interface UseWindowVirtualListOptions {
  count: number;
  /** Starting guess in px; real heights are measured as rows mount. */
  estimateSize: number;
  getItemKey?: (index: number) => string | number;
  overscan?: number;
  enabled?: boolean;
}

/**
 * DOM windowing against the page scroll (the app scrolls the window, not an inner container).
 *
 * Callers render `virtualItems` between spacers of `paddingTop` / `paddingBottom` and pass
 * `measureElement` plus `data-index` to each row. Spacers rather than absolute positioning keep
 * rows in normal flow, which table column widths and existing row styles rely on.
 */
export function useWindowVirtualList<TContainer extends HTMLElement = HTMLElement>({
  count,
  estimateSize,
  getItemKey,
  overscan = 6,
  enabled = true,
}: UseWindowVirtualListOptions) {
  const containerRef = useRef<TContainer | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  /** Distance from the document top to the list; moves when content above it changes height. */
  const updateScrollMargin = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const next = el.getBoundingClientRect().top + window.scrollY;
    setScrollMargin((prev) => (Math.abs(prev - next) > 1 ? next : prev));
  }, []);

  useLayoutEffect(updateScrollMargin);

  useEffect(() => {
    if (!enabled || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateScrollMargin);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [enabled, updateScrollMargin]);

  const virtualizer = useWindowVirtualizer({
    count,
    enabled,
    overscan,
    scrollMargin,
    getItemKey,
    estimateSize: () => estimateSize,
    // A hidden row measures 0; caching that would make the virtualizer mount every row at once.
    measureElement: (element, entry, instance) =>
      defaultMeasureElement(element, entry, instance) || estimateSize,
    // Avoids React 19's "flushSync was called from inside a lifecycle method" warning while scrolling.
    useFlushSync: false,
  });

  const virtualItems = enabled ? virtualizer.getVirtualItems() : [];
  const first = virtualItems[0];
  const last = virtualItems[virtualItems.length - 1];

  return {
    containerRef,
    virtualItems,
    paddingTop: first ? Math.max(0, first.start - scrollMargin) : 0,
    paddingBottom: last ? Math.max(0, virtualizer.getTotalSize() - (last.end - scrollMargin)) : 0,
    measureElement: virtualizer.measureElement,
  };
}
