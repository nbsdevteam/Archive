import type { ChangeEvent } from "react";
import { useMemo } from "react";
import type { TFunction } from "i18next";
import type { Document } from "@/app/adapter/api/documents.api";
import type { Attachment } from "@/app/adapter/api/documents.api";
import { Button, DataTable, Icon, Spinner } from "@/shared/components/ui";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
import type { RowAction } from "@/shared/components/ui/DataTable/DataTable.types";
import type { SelectionConfig } from "@/shared/components/ui/DataTable/DataTable.types";

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

/** Attachments card: document selector, attachments DataTable with selection and row actions. Responsive card view on mobile. */
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

  const columns: ColumnDef<Attachment>[] = useMemo(
    () => [
      { id: "name", header: t("folders.name", { defaultValue: "Name" }), render: (row) => <span className="folders-detail-attachments-cell-ellipsis" title={row.name}>{row.name}</span> },
      { id: "file_name", header: t("documents.fileName", { defaultValue: "File name" }), render: (row) => <span className="folders-detail-attachments-cell-ellipsis" title={row.file_name}>{row.file_name}</span> },
      { id: "description", header: t("documents.description", { defaultValue: "Description" }), render: (row) => <span className="folders-detail-attachments-cell-ellipsis" title={row.description != null ? String(row.description) : undefined}>{String(row.description ?? "").trim() || "–"}</span> },
    ],
    [t]
  );

  const rowActions: RowAction<Attachment>[] = useMemo(
    () => [
      { id: "view", label: t("documents.view", { defaultValue: "View" }), icon: "eye", onClick: (row: Attachment, e: React.MouseEvent) => { e.stopPropagation(); onViewAttachment(row.id); } },
      { id: "download", label: t("documents.download", { defaultValue: "Download" }), icon: "download", onClick: (row: Attachment, e: React.MouseEvent) => { e.stopPropagation(); onDownloadAttachment(row.id, row.file_name); } },
      ...(onEditAttachment ? [{ id: "edit" as const, label: t("common.edit", { defaultValue: "Edit" }), icon: "pencil" as const, onClick: (row: Attachment, e: React.MouseEvent) => { e.stopPropagation(); onEditAttachment!(row.id); } }] : []),
      { id: "delete", label: t("documents.deleteAttachment", { defaultValue: "Delete" }), icon: "trash", variant: "danger", onClick: (row: Attachment, e: React.MouseEvent) => { e.stopPropagation(); onTrashAttachment(row.id); } },
    ].filter(Boolean) as RowAction<Attachment>[],
    [t, onViewAttachment, onDownloadAttachment, onEditAttachment, onTrashAttachment]
  );

  const selection: SelectionConfig<Attachment> | undefined = selectionConfig
    ? {
        selectedIds: selectionConfig.selectedIds,
        onToggle: selectionConfig.onToggle,
        onToggleAll: selectionConfig.onToggleAll,
        isAllSelected: selectionConfig.isAllSelected,
        isIndeterminate: selectionConfig.isIndeterminate,
        getRowAriaLabel: (row) => `Select attachment ${row.name}`,
      }
    : undefined;

  return (
    <div className="card mb-3" data-testid="folder-detail-attachments-section">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <h6 className="mb-0">📎 {t("folders.attachments", { defaultValue: "Attachments" })}</h6>
        <div className="d-flex align-items-center gap-2">
          {documents.length > 0 && (
            <select
              className="form-select form-select-sm"
              style={{ width: "auto", minWidth: 200 }}
              value={attachmentsDocId}
              onChange={onAttachmentsDocIdChange}
              data-testid="folder-detail-attachments-doc-select"
              aria-label={t("folders.selectDocument", { defaultValue: "Select document for attachments" })}
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
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={onAddAttachment} data-testid="folder-detail-add-attachment-btn">
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
          <DataTable<Attachment>
            data={attachments}
            getRowId={(row) => row.id}
            columns={columns}
            loading={false}
            emptyMessage={t("common.noData", { defaultValue: "No data" })}
            rowActions={rowActions}
            selection={selection}
            actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
          tableClassName="table table-sm mb-0 folders-detail-attachments-table"
          responsive="auto"
          cardsBelow="lg"
          actionsStyle="inline"
        />
        )}
      </div>
    </div>
  );
}
