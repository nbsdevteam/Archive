import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { ColumnDef } from "./DataTable.types";
import type { IconName } from "../Icon";
import { InfoWrapper } from "../InfoWrapper";

/** Prevents click from bubbling to parent (e.g. row click). */
export function stopPropagation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

/** Returns a string label for a column in card view: mobileLabel > string header > id. */
export function getColumnCardLabel<T>(col: ColumnDef<T>): string {
  if (col.mobileLabel) return col.mobileLabel;
  if (typeof col.header === "string") return col.header;
  return col.id;
}

/**
 * Truncates cell text with ellipsis; InfoWrapper shows full text on hover only when clipped.
 */
export function TruncatedCell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [tooltipText, setTooltipText] = useState("");

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(el.scrollWidth > el.clientWidth);
    setTooltipText(el.textContent ?? "");
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, measure]);

  return (
    <InfoWrapper
      content={tooltipText}
      position="top"
      disabled={!isTruncated}
      className="datatable-cell-truncate-wrap"
      trigger={
        <span ref={ref} className="datatable-cell-truncate">
          {children}
        </span>
      }
    />
  );
}

/**
 * Resolves icon for a row action: use configured icon or infer from action id so menu items always show an icon.
 */
export function resolveActionIcon(actionId: string, configuredIcon?: IconName): IconName {
  if (configuredIcon) return configuredIcon;
  const id = String(actionId ?? "").toLowerCase();
  if (id.includes("view")) return "eye";
  if (id.includes("download")) return "download";
  if (id.includes("transfer")) return "arrow-right-left";
  if (id.includes("archive") && !id.includes("unarchive")) return "archive";
  if (id.includes("unarchive") || id.includes("restore")) return "refresh-cw";
  if (id.includes("trash") || id.includes("delete")) return "trash-2";
  if (id.includes("edit")) return "pencil";
  return "info";
}
