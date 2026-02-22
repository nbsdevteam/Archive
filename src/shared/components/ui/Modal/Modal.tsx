import { type ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  title?: string;
  className?: string;
}

/**
 * Modal - Reusable modal component with focus trap and focus restore.
 * Uses Bootstrap modal styling. Traps Tab within the dialog and restores
 * focus to the previously focused element on close.
 */
export const Modal = ({
  isOpen,
  onClose,
  children,
  size = "md",
  title,
  className = "",
}: ModalProps) => {
  const titleId = useId();

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

  /** Close modal on Escape when open; uses AbortController for single cleanup. */
  useEffect(() => {
    const abortController = new AbortController();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape, { signal: abortController.signal });
    return () => abortController.abort();
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = size !== "md" ? `modal-${size}` : "";

  /** Closes modal when user clicks the overlay (dialog backdrop), not when clicking inside the dialog. */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className={`modal fade show ${className}`}
      style={{ display: "block" }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onClick={handleOverlayClick}
    >
      {/* Backdrop first so it sits behind the dialog; dialog has higher z-index so it receives clicks */}
      <div className="modal-backdrop fade show" onClick={onClose} aria-hidden />
      <FocusLock returnFocus>
        <div
          className={`modal-dialog ${sizeClass}`}
          role="document"
          style={{ position: "relative", zIndex: 1051 }}
        >
          <div className="modal-content">
            {title && (
              <div className="modal-header">
                <h5 className="modal-title" id={titleId}>
                  {title}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onClose}
                />
              </div>
            )}
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </FocusLock>
    </div>
  );

  return createPortal(modalContent, document.body);
};
