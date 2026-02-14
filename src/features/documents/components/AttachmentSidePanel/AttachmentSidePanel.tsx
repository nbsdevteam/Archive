import { useCallback, useEffect, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { Button, SidePanel, Spinner } from "@/shared/components/ui";
import { UploadDocumentSidePanel } from "../UploadDocument";

export interface AttachmentSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, panel shows edit form; when null, panel shows add (upload) form. */
  editAttachmentId: number | null;
  editAttachmentName: string;
  editAttachmentDescription: string;
  setEditAttachmentName: (v: string) => void;
  setEditAttachmentDescription: (v: string) => void;
  /** Pass optional replace file when user chose a new file in edit mode. */
  onSaveEdit: (replaceFile?: File | null) => void | Promise<void>;
  isSavingEdit: boolean;
  /** Document id for add-attachment mode (upload target). */
  documentId: number;
  onAddSuccess: () => void;
  t: TFunction;
}

/**
 * Single sidebar for both adding and editing attachments.
 * When editAttachmentId is set, shows edit form (name/description + optional replace file); otherwise shows upload form.
 */
export function AttachmentSidePanel({
  isOpen,
  onClose,
  editAttachmentId,
  editAttachmentName,
  editAttachmentDescription,
  setEditAttachmentName,
  setEditAttachmentDescription,
  onSaveEdit,
  isSavingEdit,
  documentId,
  onAddSuccess,
  t,
}: AttachmentSidePanelProps) {
  const isEditMode = editAttachmentId != null;
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen || !isEditMode) {
      setReplaceFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen, isEditMode]);

  const handleSaveEdit = useCallback(() => {
    onSaveEdit(replaceFile ?? undefined);
  }, [onSaveEdit, replaceFile]);

  const handleClearReplaceFile = useCallback(() => {
    setReplaceFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  if (isEditMode) {
    return (
      <SidePanel
        isOpen={isOpen}
        onClose={onClose}
        title={t("common.edit", { defaultValue: "Edit" })}
        width="50vw"
        loading={isSavingEdit}
        footer={
          <div className="d-flex gap-2 justify-content-end">
            <Button variant="outline" className="btn-outline-secondary" onClick={onClose} disabled={isSavingEdit}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="secondary"
              onClick={handleSaveEdit}
              disabled={!editAttachmentName.trim() || isSavingEdit}
            >
              {isSavingEdit ? <Spinner /> : t("common.save", { defaultValue: "Save" })}
            </Button>
          </div>
        }
      >
        <div className="mb-3">
          <label className="form-label">{t("documents.name", { defaultValue: "Name" })}</label>
          <input
            type="text"
            className="form-control"
            value={editAttachmentName}
            onChange={(e) => setEditAttachmentName(e.target.value)}
            maxLength={255}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.description", { defaultValue: "Description" })}</label>
          <textarea
            className="form-control"
            rows={3}
            value={editAttachmentDescription}
            onChange={(e) => setEditAttachmentDescription(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.replaceFileOptional", { defaultValue: "Replace file (optional)" })}</label>
          <input
            ref={fileInputRef}
            type="file"
            className="form-control"
            onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
            aria-label={t("documents.replaceFileOptional", { defaultValue: "Replace file (optional)" })}
          />
          {replaceFile && (
            <div className="mt-2 d-flex align-items-center gap-2">
              <span className="small text-muted">{replaceFile.name}</span>
              <Button variant="outline" size="sm" className="p-0 border-0" onClick={handleClearReplaceFile}>
                {t("common.clear", { defaultValue: "Clear" })}
              </Button>
            </div>
          )}
        </div>
      </SidePanel>
    );
  }

  return (
    <UploadDocumentSidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onAddSuccess}
      initialValues={{
        upload_kind: "attachment",
        target_document_id: documentId,
      }}
    />
  );
}
