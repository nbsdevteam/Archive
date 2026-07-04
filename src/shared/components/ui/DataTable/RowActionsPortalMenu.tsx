import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface RowActionsPortalMenuProps {
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Renders row kebab actions in a portal so the menu is not clipped by table/card overflow
 * and stacks above later page sections (e.g. sibling cards on folder detail).
 */
export function RowActionsPortalMenu({ open, anchor, onClose, children }: RowActionsPortalMenuProps) {
  const menuRef = useRef<HTMLUListElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    if (!anchor) return;
    const anchorRect = anchor.getBoundingClientRect();
    const menuEl = menuRef.current;
    const measuredW = menuEl?.offsetWidth ?? 0;
    const measuredH = menuEl?.offsetHeight ?? 0;
    const menuWidth = Math.max(measuredW || 220, anchorRect.width, 160);
    const menuHeight = measuredH || 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;

    let top = anchorRect.bottom + 4;
    const spaceBelow = vh - anchorRect.bottom - margin;
    const spaceAbove = anchorRect.top - margin;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      top = anchorRect.top - menuHeight - 4;
    }
    if (top + menuHeight > vh - margin) {
      top = Math.max(margin, vh - margin - menuHeight);
    }
    if (top < margin) top = margin;

    let left = anchorRect.right - menuWidth;
    if (left < margin) left = margin;
    if (left + menuWidth > vw - margin) {
      left = Math.max(margin, vw - menuWidth - margin);
    }

    const maxH = vh - top - margin;
    const needsScroll = measuredH > 0 && measuredH > maxH;

    setStyle({
      position: "fixed",
      top,
      left,
      minWidth: Math.max(anchorRect.width, 10 * 16),
      width: measuredW > 0 ? measuredW : undefined,
      maxHeight: needsScroll ? maxH : undefined,
      overflowY: needsScroll ? "auto" : undefined,
      zIndex: 20000,
      display: "block",
    });
  }, [anchor]);

  useLayoutEffect(() => {
    if (!open || !anchor) return undefined;
    updatePosition();
    const raf = requestAnimationFrame(() => updatePosition());
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, anchor, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || anchor?.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, anchor, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !anchor) return null;

  return createPortal(
    <ul
      ref={menuRef}
      className="dropdown-menu dropdown-menu-end show shadow datatable-row-actions-portal-menu"
      style={style}
    >
      {children}
    </ul>,
    document.body
  );
}
