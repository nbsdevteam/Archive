import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  title?: string;
  className?: string;
}

/**
 * Modal - Reusable modal component
 * Uses Bootstrap modal styling
 */
export const Modal = ({
  isOpen,
  onClose,
  children,
  size = "md",
  title,
  className = "",
}: ModalProps) => {
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

  const sizeClass = size !== "md" ? `modal-${size}` : "";

  const modalContent = (
    <div
      className={`modal fade show ${className}`}
      style={{ display: "block" }}
      tabIndex={-1}
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop first so it sits behind the dialog; dialog has higher z-index so it receives clicks */}
      <div className="modal-backdrop fade show" onClick={onClose} aria-hidden />
      <div
        className={`modal-dialog ${sizeClass}`}
        role="document"
        style={{ position: "relative", zIndex: 1051 }}
      >
        <div className="modal-content">
          {title && (
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
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
    </div>
  );

  return createPortal(modalContent, document.body);
};
