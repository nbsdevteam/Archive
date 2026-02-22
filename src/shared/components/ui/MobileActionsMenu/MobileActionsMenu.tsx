import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../Icon";
import type { IconName } from "../Icon";
import "./mobile-actions-menu.css";

export interface MobileActionsMenuItem {
  id: string;
  icon: IconName;
  label: string;
  description?: string;
  badgeCount?: number;
  variant?: "default" | "danger";
  disabled?: boolean;
  onClick: () => void;
}

export interface MobileActionsMenuProps {
  /** Menu panel title (e.g. "Actions" or "Actions on selected"). */
  title?: string;
  /** Menu items: id, icon, label, optional description, optional badgeCount, variant, disabled, onClick. */
  items: MobileActionsMenuItem[];
  /** Aria-label for the kebab trigger button. */
  triggerAriaLabel?: string;
}

const VIEWPORT_PADDING = 8;

/**
 * Positions the panel so it stays inside the viewport (below/above and left/right aligned as needed).
 */
function usePanelPosition(open: boolean, containerRef: React.RefObject<HTMLDivElement | null>, panelRef: React.RefObject<HTMLDivElement | null>) {
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !containerRef.current || !panelRef.current) {
      setPanelStyle(null);
      return;
    }
    const triggerRect = containerRef.current.getBoundingClientRect();
    const panelEl = panelRef.current;
    const panelRect = panelEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = panelRect.width;
    const ph = panelRect.height;

    let left = triggerRect.right - pw;
    if (left < VIEWPORT_PADDING) left = VIEWPORT_PADDING;
    if (left + pw > vw - VIEWPORT_PADDING) left = vw - pw - VIEWPORT_PADDING;

    let top = triggerRect.bottom + 4;
    if (top + ph > vh - VIEWPORT_PADDING) {
      top = triggerRect.top - ph - 4;
    }
    if (top < VIEWPORT_PADDING) top = VIEWPORT_PADDING;

    setPanelStyle({ left, top });
  }, [open, containerRef, panelRef]);

  return panelStyle;
}

/**
 * Reusable mobile Actions popover: kebab trigger opens a card-style menu with header and list items.
 * Closes on outside click, Escape, and after selecting an item. Use only in mobile layout (<768px).
 * Trigger uses ms-auto so it aligns right in a flex row; panel is positioned to stay inside viewport.
 */
export function MobileActionsMenu({
  title = "Actions",
  items,
  triggerAriaLabel = "Actions",
}: MobileActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelStyle = usePanelPosition(open, containerRef, panelRef);

  const close = useCallback(() => setOpen(false), []);

  /** Close menu on outside click or Escape when open; uses AbortController for single cleanup. */
  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", handleOutsideClick, { signal: ac.signal });
    document.addEventListener("keydown", handleEscape, { signal: ac.signal });
    return () => ac.abort();
  }, [open, close]);

  const handleItemClick = useCallback(
    (item: MobileActionsMenuItem) => {
      if (item.disabled) return;
      item.onClick();
      close();
    },
    [close]
  );

  const panelContent = open && (
    <div
      ref={panelRef}
      className="mobile-actions-menu__panel mobile-actions-menu__panel--positioned"
      role="menu"
      style={
        panelStyle
          ? { position: "fixed", left: panelStyle.left, top: panelStyle.top, visibility: "visible" }
          : { position: "fixed", left: 0, top: 0, visibility: "hidden" }
      }
    >
      <div className="mobile-actions-menu__header">{title}</div>
      <ul className="mobile-actions-menu__list">
        {items.map((item) => (
          <li key={item.id} role="none">
            <button
              type="button"
              role="menuitem"
              className={`mobile-actions-menu__item ${item.variant === "danger" ? "mobile-actions-menu__item--danger" : ""}`.trim()}
              disabled={item.disabled}
              onClick={() => handleItemClick(item)}
            >
              <span className="mobile-actions-menu__item-icon" aria-hidden>
                <Icon name={item.icon} style={{ width: "1rem", height: "1rem" }} />
              </span>
              <span className="mobile-actions-menu__item-label">
                <span>{item.label}</span>
                {item.description != null && item.description !== "" && (
                  <span className="mobile-actions-menu__item-desc">{item.description}</span>
                )}
              </span>
              {item.badgeCount != null && item.badgeCount > 0 && (
                <span className="mobile-actions-menu__item-badge">{item.badgeCount}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="mobile-actions-menu position-relative d-inline-flex ms-auto" ref={containerRef}>
      <button
        type="button"
        className="mobile-actions-menu__trigger"
        aria-label={triggerAriaLabel}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Icon name="more-vertical" style={{ width: "1.25rem", height: "1.25rem" }} />
      </button>
      {typeof document !== "undefined" && document.body ? createPortal(panelContent, document.body) : panelContent}
    </div>
  );
}
