import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import FocusLock from "react-focus-lock";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsContext";

const OVERLAY_TITLE_ID = "shortcuts-overlay-title";

/**
 * Accessible dialog that lists available keyboard shortcuts.
 * Shown when user presses Alt; focus-trapped and closed on Escape or Alt keyup.
 */
export function ShortcutsOverlay() {
  const { t } = useTranslation();
  const { overlayOpen, setOverlayOpen, availableShortcuts } = useShortcuts();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (overlayOpen) {
      closeButtonRef.current?.focus();
    }
  }, [overlayOpen]);

  if (!overlayOpen) return null;

  /** Closes the shortcuts overlay when backdrop or close button is activated. */
  const handleCloseOverlay = () => setOverlayOpen(false);

  /** Prevents clicks inside the dialog from closing the overlay. */
  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

  const overlayContent = (
    <div
      className="modal fade show"
      style={{ display: "block" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={OVERLAY_TITLE_ID}
      aria-describedby="shortcuts-overlay-description"
    >
      <div className="modal-backdrop fade show" onClick={handleCloseOverlay} aria-hidden />
      <FocusLock returnFocus>
        <div
          className="modal-dialog modal-dialog-centered"
          style={{ position: "relative", zIndex: 1051 }}
          onClick={stopPropagation}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5 mb-0" id={OVERLAY_TITLE_ID}>
                {t("app.keyboardShortcuts")}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                className="btn-close"
                aria-label={t("app.closeShortcuts")}
                onClick={handleCloseOverlay}
              />
            </div>
            <div className="modal-body">
              <p id="shortcuts-overlay-description" className="text-muted small mb-3">
                {t("app.shortcutsDescription")}
              </p>
              {availableShortcuts.length === 0 ? (
                <p className="text-muted mb-0">{t("app.noShortcutsAvailable")}</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {availableShortcuts.map(({ id, label, keys }) => (
                    <li key={id} className="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary border-opacity-25">
                      <span>{t(`shortcuts.${id}`, { defaultValue: label })}</span>
                      <kbd className="px-2 py-1 bg-light border rounded text-muted small">{keys}</kbd>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </FocusLock>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
