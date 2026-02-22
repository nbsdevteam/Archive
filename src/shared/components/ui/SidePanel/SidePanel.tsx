import { type ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import "./side-panel.css";

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Footer content (e.g. Cancel + Submit buttons). Rendered in offcanvas-footer. */
  footer?: ReactNode;
  /** When true, body scroll is disabled and footer can show a loading state. */
  loading?: boolean;
  className?: string;
  /** Panel width (default: 50vw for at least half screen). */
  width?: string | number;
  /** When false, clicking the backdrop does not close the panel (default: true). */
  closeOnBackdropClick?: boolean;
}

/**
 * SidePanel - Reusable right-side panel (Bootstrap offcanvas style).
 * Supports title, close button, scrollable body, footer actions, loading state.
 * Uses focus trap and restores focus on close; title id is unique per instance.
 * When closeOnBackdropClick is false, backdrop clicks do not close the panel (e.g. upload/edit sidebars).
 */
export const SidePanel = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  loading = false,
  className = "",
  width: widthProp,
  closeOnBackdropClick = true,
}: SidePanelProps) => {
  const titleId = useId();
  const width =
    widthProp != null
      ? typeof widthProp === "number"
        ? `${widthProp}px`
        : widthProp
      : "50vw";
  const isFullscreen = width === "100vw" || width === "100%";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /** Close panel on Escape when open (single listener: no AbortController). */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const panelContent = (
    <>
      <div
        className={`offcanvas-backdrop fade show ${className}`}
        style={{ position: "fixed", inset: 0, zIndex: 1040 }}
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />
      <FocusLock returnFocus>
        <div
          className={`side-panel-fixed offcanvas offcanvas-end show ${isFullscreen ? "side-panel-fullscreen" : ""} ${className}`}
          tabIndex={-1}
          style={{
            ["--side-panel-width" as string]: width,
            visibility: "visible",
            position: "fixed",
            top: 0,
            right: 0,
            zIndex: 1045,
            width,
            maxWidth: "100%",
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--bs-body-bg, #fff)",
            boxShadow: isFullscreen ? "none" : "-0.125rem 0 0.5rem rgba(0, 0, 0, 0.075)",
          }}
          aria-labelledby={titleId}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="offcanvas-header border-bottom"
            style={{ flexShrink: 0 }}
          >
            <h5 className="offcanvas-title" id={titleId}>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={loading}
            />
          </div>
          <div
            className="offcanvas-body"
            style={{
              flex: "1 1 0%",
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "1rem 1.25rem",
            }}
          >
            {children}
          </div>
          {footer != null && (
            <div
              className="offcanvas-footer border-top p-3 bg-body"
              style={{ flexShrink: 0 }}
            >
              {footer}
            </div>
          )}
        </div>
      </FocusLock>
    </>
  );

  return createPortal(panelContent, document.body);
};
