import { useCallback, useState } from "react";

/**
 * Options for useConfirmDialog when a payload (e.g. document id) is used.
 * onConfirm is called with the payload when user confirms.
 */
export interface UseConfirmDialogOptionsWithPayload<T> {
  onConfirm: (value: T) => void | Promise<void>;
}

/**
 * Options for useConfirmDialog when no payload is needed.
 */
export interface UseConfirmDialogOptionsEmpty {
  onConfirm: () => void | Promise<void>;
}

export type UseConfirmDialogOptions<T = void> = T extends void
  ? UseConfirmDialogOptionsEmpty
  : UseConfirmDialogOptionsWithPayload<T>;

/**
 * Return type for useConfirmDialog with a payload.
 * open(payload) sets the value and shows the modal; confirm() runs onConfirm(currentPayload).
 */
export interface UseConfirmDialogReturnWithPayload<T> {
  isOpen: boolean;
  /** Current payload (e.g. document id) when modal is open. */
  value: T | null;
  open: (value: T) => void;
  close: () => void;
  /** Call from ConfirmModal onConfirm; runs onConfirm(value) and closes on success. */
  confirm: () => Promise<void>;
  isLoading: boolean;
  /** Spread onto ConfirmModal: isOpen, onClose, onConfirm, isLoading. */
  modalProps: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
  };
}

/**
 * Return type for useConfirmDialog with no payload.
 */
export interface UseConfirmDialogReturnEmpty {
  isOpen: boolean;
  value: null;
  open: () => void;
  close: () => void;
  confirm: () => Promise<void>;
  isLoading: boolean;
  modalProps: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
  };
}

export type UseConfirmDialogReturn<T = void> = T extends void
  ? UseConfirmDialogReturnEmpty
  : UseConfirmDialogReturnWithPayload<T>;

/**
 * Reusable confirm-dialog state and handlers. Reduces repeated isOpen/onClose/onConfirm/isLoading
 * boilerplate. Use with ConfirmModal: pass modalProps (isOpen, onClose, onConfirm, isLoading)
 * and provide title, message, confirmLabel, etc. from the page.
 *
 * For single-item confirm (e.g. "Trash document 5"): use open(id) and onConfirm(id).
 * For no payload (e.g. "Empty trash?"): use open() and onConfirm().
 */
export function useConfirmDialog<T = void>(
  options: UseConfirmDialogOptions<T>
): UseConfirmDialogReturn<T> {
  const [value, setValue] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback((payload?: T) => {
    setValue((payload ?? undefined) as T | null);
  }, []);

  const close = useCallback(() => {
    if (!isLoading) setValue(null);
  }, [isLoading]);

  const confirm = useCallback(async () => {
    const current = value;
    if (current == null) return;
    setIsLoading(true);
    try {
      await (options.onConfirm as (v: T) => void | Promise<void>)(current);
      setValue(null);
    } finally {
      setIsLoading(false);
    }
  }, [value, options]);

  const isOpen = value != null;

  const modalProps = {
    isOpen,
    onClose: close,
    onConfirm: () => void confirm(),
    isLoading,
  };

  return {
    isOpen,
    value: value ?? null,
    open: open as (payload?: T) => void,
    close,
    confirm,
    isLoading,
    modalProps,
  } as UseConfirmDialogReturn<T>;
}

/**
 * Specialized hook for confirm dialogs that don't take a payload (e.g. "Empty trash?").
 * open() shows the modal; confirm() calls onConfirm() and closes on success.
 */
export function useConfirmDialogEmpty(
  options: UseConfirmDialogOptionsEmpty
): UseConfirmDialogReturnEmpty {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    if (!isLoading) setIsOpen(false);
  }, [isLoading]);

  const confirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await options.onConfirm();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    isOpen,
    value: null,
    open,
    close,
    confirm,
    isLoading,
    modalProps: {
      isOpen,
      onClose: close,
      onConfirm: () => void confirm(),
      isLoading,
    },
  };
}
