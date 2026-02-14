import type { ChangeEvent } from "react";
import type { TFunction } from "i18next";
import type { Document } from "@/app/adapter/api/documents.api";
import type { Attachment } from "@/app/adapter/api/documents.api";
import { Button, Icon, Spinner } from "@/shared/components/ui";

export interface AttachmentsSelectionConfig {
  selectedIds: (string | number)[];
  onToggle: (id: string | number) => void;
  onToggleAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

export interface FolderDetailAttachmentsSectionProps {
  t: TFunction;
  documents: Document[];
  attachmentsDocId: number | "";
  attachments: Attachment[];
  loadingAttachments: boolean;
  selectionConfig: AttachmentsSelectionConfig | null;
  onAttachmentsDocIdChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onAddAttachment: () => void;
  onViewAttachment: (attachmentId: number) => void;
  onDownloadAttachment: (attachmentId: number, fileName: string) => void;
  onEditAttachment?: (attachmentId: number) => void;
  onTrashAttachment: (attachmentId: number) => void;
  onClearSelection: () => void;
  onBatchTrash: () => void;
  isAttachmentTrashing: boolean;
}

/** Attachments card: document selector, attachments table with selection and row actions. */
export function FolderDetailAttachmentsSection(props: FolderDetailAttachmentsSectionProps) {
  const {
    t,
    documents,
    attachmentsDocId,
    attachments,
    loadingAttachments,
    selectionConfig,
    onAttachmentsDocIdChange,
    onAddAttachment,
    onViewAttachment,
    onDownloadAttachment,
    onEditAttachment,
    onTrashAttachment,
    onClearSelection,
    onBatchTrash,
    isAttachmentTrashing,
  } = props;
  const hasSelection = (selectionConfig?.selectedIds.length ?? 0) > 0;

  return (
    <div className="card mb-3">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <h6 className="mb-0">📎 {t("folders.attachments", { defaultValue: "Attachments" })}</h6>
        <div className="d-flex align-items-center gap-2">
          {documents.length > 0 && (
            <select
              className="form-select form-select-sm"
              style={{ width: "auto", minWidth: 200 }}
              value={attachmentsDocId}
              onChange={onAttachmentsDocIdChange}
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title ?? d.name ?? "–"} — {d.barcode}
                </option>
              ))}
            </select>
          )}
          {attachments.length > 0 && hasSelection && (
            <>
              <Button variant="outline" size="sm" className="btn-outline-danger" onClick={onBatchTrash} disabled={isAttachmentTrashing}>
                <Icon name="trash" className="me-1" />
                {t("documents.deleteSelectedAttachments", { defaultValue: "Delete selected" })}
              </Button>
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={onClearSelection}>
                {t("common.clearSelection", { defaultValue: "Clear selection" })}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={onAddAttachment}>
            {t("folders.addAttachment", { defaultValue: "Add attachment" })}
          </Button>
        </div>
      </div>
      <div className="card-body">
        {loadingAttachments ? (
          <div className="text-center py-4">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  {selectionConfig && (
                    <th style={{ width: "2.5rem" }} className="text-center">
                      {attachments.length > 0 && (
                        <div className="form-check d-inline-flex justify-content-center mb-0">
                          <input type="checkbox" className="form-check-input" checked={selectionConfig.isAllSelected} onChange={selectionConfig.onToggleAll} aria-label={selectionConfig.isIndeterminate ? "Uncheck all" : "Check all"} />
                        </div>
                      )}
                    </th>
                  )}
                  <th>{t("folders.name", { defaultValue: "Name" })}</th>
                  <th>{t("documents.fileName", { defaultValue: "File name" })}</th>
                  <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody>
                {attachments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">{t("common.noData", { defaultValue: "No data" })}</td>
                  </tr>
                ) : (
                  attachments.map((attachment) => {
                    const isSelected = selectionConfig && selectionConfig.selectedIds.includes(attachment.id);
                    return (
                      <tr key={attachment.id}>
                        {selectionConfig && (
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="form-check mb-0">
                              <input type="checkbox" className="form-check-input" checked={Boolean(isSelected)} onChange={() => selectionConfig.onToggle(attachment.id)} onClick={(e) => e.stopPropagation()} aria-label={`Select attachment ${attachment.name}`} />
                            </div>
                          </td>
                        )}
                        <td>{attachment.name}</td>
                        <td>{attachment.file_name}</td>
                        <td className="text-end">
                          <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={(e) => { e?.stopPropagation(); onViewAttachment(attachment.id); }}>
                            <Icon name="eye" className="me-1" />{t("documents.view", { defaultValue: "View" })}
                          </Button>
                          <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={() => onDownloadAttachment(attachment.id, attachment.file_name)}>
                            {t("documents.download", { defaultValue: "Download" })}
                          </Button>
                          {onEditAttachment && (
                            <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={(e) => { e.stopPropagation(); onEditAttachment(attachment.id); }}>
                              <Icon name="pencil" className="me-1" />
                              {t("common.edit", { defaultValue: "Edit" })}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="btn-outline-danger" onClick={(e) => { e.stopPropagation(); onTrashAttachment(attachment.id); }}>
                            <Icon name="trash" className="me-1" />{t("documents.deleteAttachment", { defaultValue: "Delete" })}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
