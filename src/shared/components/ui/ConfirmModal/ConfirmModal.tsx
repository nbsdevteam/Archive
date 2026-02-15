import { memo, type ReactNode } from "react";
import { Modal } from "../Modal";
import { ModalFooter } from "../Modal/ModalFooter";
import { Button } from "../Button";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "secondary" | "danger" | "light" | "outline";
  isLoading?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Generic confirmation modal with title, message, and Cancel/Confirm buttons.
 * Use for delete, discard, or other confirmations. Pass stable callbacks (e.g. useCallback) from parent.
 */
export const ConfirmModal = memo(function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
  size = "md",
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <div className="mb-0">{message}</div>
      <ModalFooter className="d-flex gap-3 justify-content-end flex-wrap pt-3">
        <Button
          variant="outline"
          className="btn-outline-secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={isLoading}
          isLoading={isLoading}
          data-testid="confirm-modal-confirm"
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
});
