import type { TFunction } from "i18next";
import type { Document } from "@/app/adapter/api/documents.api";
import type { DocumentBatchActionsResult } from "@/shared/services/documentBatchActionsService";
import { Button, Icon } from "@/shared/components/ui";

export interface SubDocsSelectionConfig {
  selectedIds: (string | number)[];
  onToggle: (id: string | number) => void;
  onToggleAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

export interface FolderDetailSubDocsSectionProps {
  t: TFunction;
  subDocs: Document[];
  selectionConfig: SubDocsSelectionConfig | null;
  /** Batch action visibility from shared service (common-only). */
  subDocsBatchActions: DocumentBatchActionsResult;
  formatDate: (date?: string | null) => string;
  onNavigate: (documentId: number) => void;
  onDownload: (documentId: number) => void;
  onEdit?: (documentId: number) => void;
  onTransfer: (documentIds: number[]) => void;
  onArchive: (documentId: number) => void;
  onUnarchive: (documentId: number) => void;
  onTrash: (documentId: number) => void;
  onClearSelection: () => void;
  onBatchTrash: () => void;
  transferSubmitting: boolean;
  isSubDocTrashing: boolean;
  isSubDocArchiving: boolean;
  isSubDocUnarchiving: boolean;
}

/** Secondary documents table with selection, transfer, trash, per-row actions. */
export function FolderDetailSubDocsSection({
  t,
  subDocs,
  selectionConfig,
  subDocsBatchActions,
  formatDate,
  onNavigate,
  onDownload,
  onEdit,
  onTransfer,
  onArchive,
  onUnarchive,
  onTrash,
  onClearSelection,
  onBatchTrash,
  transferSubmitting,
  isSubDocTrashing,
  isSubDocArchiving,
  isSubDocUnarchiving,
}: FolderDetailSubDocsSectionProps) {
  const selectedIds = selectionConfig?.selectedIds ?? [];
  const hasSelection = selectedIds.length > 0;

  const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();
  const handleTransferSelectedClick = () => onTransfer(selectedIds.map((id) => Number(id)));
  const handleSubDocRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const id = e.currentTarget.dataset.docId;
    if (id != null) onNavigate(Number(id));
  };
  const handleSubDocSelectionToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.currentTarget.dataset.docId;
    if (id != null && selectionConfig) selectionConfig.onToggle(id);
  };
  const handleViewDocClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.docId;
    if (id != null) onNavigate(Number(id));
  };
  const handleEditDocClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.docId;
    if (id != null && onEdit) onEdit(Number(id));
  };
  const handleDownloadDocClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.docId;
    if (id != null) onDownload(Number(id));
  };
  const handleTransferOneClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.docId;
    if (id != null) onTransfer([Number(id)]);
  };
  const handleUnarchiveDocClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.docId;
    if (id != null) onUnarchive(Number(id));
  };
  const handleArchiveDocClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.docId;
    if (id != null) onArchive(Number(id));
  };
  const handleTrashDocClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.docId;
    if (id != null) onTrash(Number(id));
  };

  return (
    <div className="card mb-3">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <h4 className="mb-0">🧩 {t("folders.secondaryDocuments", { defaultValue: "Secondary documents" })}</h4>
        {subDocs.length > 0 && hasSelection && (
          <div className="d-flex align-items-center gap-2">
            {subDocsBatchActions.canBatchTransfer && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline-secondary"
                onClick={handleTransferSelectedClick}
                disabled={transferSubmitting}
              >
                <Icon name="arrow-right-left" className="me-1" />
                {t("documents.transferSelected", { defaultValue: "Transfer selected" })}
              </Button>
            )}
            {subDocsBatchActions.canBatchTrash && (
              <Button
                variant="outline"
                size="sm"
                className="btn-outline-danger"
                onClick={onBatchTrash}
                disabled={isSubDocTrashing}
              >
                <Icon name="trash-2" className="me-1" />
                {t("documents.moveSelectedToTrash", { defaultValue: "Move selected to trash" })}
              </Button>
            )}
            <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={onClearSelection}>
              {t("common.clearSelection", { defaultValue: "Clear selection" })}
            </Button>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                {selectionConfig && (
                  <th style={{ width: "2.5rem" }} className="text-center">
                    {subDocs.length > 0 && (
                      <div className="form-check d-inline-flex justify-content-center mb-0">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectionConfig.isAllSelected}
                          onChange={selectionConfig.onToggleAll}
                          aria-label={selectionConfig.isIndeterminate ? t("common.uncheckAll") : t("common.checkAll")}
                        />
                      </div>
                    )}
                  </th>
                )}
                <th>{t("documents.barcode", { defaultValue: "Barcode" })}</th>
                <th>{t("documents.name", { defaultValue: "Name" })}</th>
                <th>{t("documents.type", { defaultValue: "Type" })}</th>
                <th>{t("documents.uploadDate", { defaultValue: "Upload date" })}</th>
                <th>{t("documents.status", { defaultValue: "Status" })}</th>
                <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {subDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    {t("folders.noSecondaryDocuments", { defaultValue: "No secondary documents." })}
                  </td>
                </tr>
              ) : (
                subDocs.map((doc) => {
                  const isSelected = selectionConfig?.selectedIds.includes(doc.id);
                  const isArchived = (doc.status ?? "").toLowerCase() === "archived";
                  return (
                    <tr
                      key={doc.id}
                      style={{ cursor: "pointer" }}
                      data-doc-id={doc.id}
                      onClick={handleSubDocRowClick}
                    >
                      {selectionConfig && (
                        <td onClick={stopPropagation}>
                          <div className="form-check mb-0">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isSelected}
                              data-doc-id={doc.id}
                              onChange={handleSubDocSelectionToggle}
                              onClick={stopPropagation}
                              aria-label={`Select document ${doc.barcode || doc.id}`}
                            />
                          </div>
                        </td>
                      )}
                      <td>{doc.barcode ?? "–"}</td>
                      <td>{doc.title ?? doc.name ?? "–"}</td>
                      <td>{doc.document_type_name ?? (doc.document_type as { name?: string })?.name ?? "–"}</td>
                      <td>{formatDate(doc.upload_date)}</td>
                      <td>{doc.status ?? "–"}</td>
                      <td className="text-end" onClick={stopPropagation}>
                        <Button variant="outline" size="sm" className="btn-outline-secondary me-1" data-doc-id={doc.id} onClick={handleViewDocClick}>
                          {t("common.view", { defaultValue: "View" })}
                        </Button>
                        {onEdit && (
                          <Button variant="outline" size="sm" className="btn-outline-secondary me-1" data-doc-id={doc.id} onClick={handleEditDocClick}>
                            <Icon name="pencil" className="me-1" />
                            {t("common.edit", { defaultValue: "Edit" })}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="btn-outline-secondary me-1" data-doc-id={doc.id} onClick={handleDownloadDocClick}>
                          {t("documents.download", { defaultValue: "Download" })}
                        </Button>
                        <Button variant="outline" size="sm" className="btn-outline-secondary me-1" data-doc-id={doc.id} onClick={handleTransferOneClick} disabled={transferSubmitting}>
                          <Icon name="arrow-right-left" className="me-1" />
                          {t("documents.transfer", { defaultValue: "Transfer" })}
                        </Button>
                        {isArchived ? (
                          <Button variant="outline" size="sm" className="btn-outline-secondary me-1" data-doc-id={doc.id} onClick={handleUnarchiveDocClick} disabled={isSubDocUnarchiving}>
                            <Icon name="archive" className="me-1" />
                            {t("documents.unarchive", { defaultValue: "Unarchive" })}
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="btn-outline-secondary me-1" data-doc-id={doc.id} onClick={handleArchiveDocClick} disabled={isSubDocArchiving}>
                            <Icon name="archive" className="me-1" />
                            {t("documents.archive", { defaultValue: "Archive" })}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="btn-outline-danger" data-doc-id={doc.id} onClick={handleTrashDocClick}>
                          <Icon name="trash-2" className="me-1" />
                          {t("documents.moveToTrash", { defaultValue: "Move to trash" })}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
