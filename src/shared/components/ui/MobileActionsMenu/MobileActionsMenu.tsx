import { useCallback, useEffect, useRef, useState } from "react";
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

/**
 * Reusable mobile Actions popover: kebab trigger opens a card-style menu with header and list items.
 * Closes on outside click, Escape, and after selecting an item. Use only in mobile layout (<768px).
 */
export function MobileActionsMenu({
  title = "Actions",
  items,
  triggerAriaLabel = "Actions",
}: MobileActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  const handleItemClick = useCallback(
    (item: MobileActionsMenuItem) => {
      if (item.disabled) return;
      item.onClick();
      close();
    },
    [close]
  );

  return (
    <div className="mobile-actions-menu position-relative d-inline-flex" ref={containerRef}>
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
      {open && (
        <div className="mobile-actions-menu__panel" role="menu">
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
      )}
    </div>
  );
}
