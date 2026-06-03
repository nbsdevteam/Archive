import { useCallback, useEffect, useRef, useState } from "react";
import type { Document } from "@/app/adapter/api/documents.api";
import { Icon, InfoWrapper } from "@/shared/components/ui";

export interface AttachmentDocumentDropdownProps {
  documents: Document[];
  selectedDocId: number | "";
  onSelectDocument: (docId: number) => void;
  ariaLabel?: string;
}

/** Shows an ellipsized title with tooltip only when it overflows. */
function AttachmentDocTitle({ title, className }: { title: string; className?: string }) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = spanRef.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [title]);

  return (
    <InfoWrapper
      content={title}
      position="top"
      portal
      disabled={!isTruncated}
      trigger={
        <span ref={spanRef} className={className}>
          {title}
        </span>
      }
    />
  );
}

/**
 * Custom dropdown for selecting which document to view attachments for.
 * Shows a "Main" badge with theme colors next to the main document.
 */
export function AttachmentDocumentDropdown({
  documents,
  selectedDocId,
  onSelectDocument,
  ariaLabel = "Select document for attachments",
}: AttachmentDocumentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);
  const isMainDoc = (doc: Document) => doc.folder_role?.toLowerCase() === "main";

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (docId: number) => {
      onSelectDocument(docId);
      setIsOpen(false);
      buttonRef.current?.focus();
    },
    [onSelectDocument]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (documents.length === 0) return null;

  return (
    <div ref={dropdownRef} className="attachment-document-dropdown position-relative">
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
        style={{ minWidth: 200 }}
        onClick={handleToggle}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon name="file-text" style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
        <span className="flex-grow-1 text-start text-truncate">
          {selectedDoc ? (
            <>
              <AttachmentDocTitle
                title={selectedDoc.title ?? selectedDoc.name ?? "–"}
                className="attachment-doc-selected-title"
              />
              {isMainDoc(selectedDoc) && (
                <span className="attachment-doc-main-badge ms-2">Main</span>
              )}
            </>
          ) : (
            "Select document"
          )}
        </span>
        <Icon
          name={isOpen ? "chevron-up" : "chevron-down"}
          style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
        />
      </button>

      {isOpen && (
        <div
          className="attachment-document-dropdown-menu shadow-lg"
          role="listbox"
          aria-label={ariaLabel}
        >
          {documents.map((doc) => {
            const isSelected = doc.id === selectedDocId;
            const isMain = isMainDoc(doc);
            return (
              <button
                key={doc.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`attachment-document-dropdown-item ${isSelected ? "active" : ""}`}
                onClick={() => handleSelect(doc.id)}
              >
                <div className="d-flex align-items-center gap-2 flex-grow-1">
                  <Icon
                    name={isMain ? "file-check" : "file-text"}
                    style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
                  />
                  <div className="flex-grow-1 text-truncate">
                    <div className="d-flex align-items-center gap-2">
                      <AttachmentDocTitle
                        title={doc.title ?? doc.name ?? "–"}
                        className="attachment-doc-title attachment-doc-title-ellipsis"
                      />
                    </div>
                    <div className="attachment-doc-barcode text-muted small d-flex align-items-center gap-2">
                      <span>{doc.barcode}</span>
                      {isMain && (
                        <span className="attachment-doc-main-badge">Main</span>
                      )}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <Icon
                    name="eye"
                    style={{ width: "1rem", height: "1rem", flexShrink: 0 }}
                    className="text-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
