import { useMemo } from "react";
import type { TFunction } from "i18next";
import type { Document } from "@/app/adapter/api/documents.api";
import type { DocumentBatchActionsResult } from "@/shared/services/documentBatchActionsService";
import { Button, DataTable, Icon } from "@/shared/components/ui";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
import type { RowAction } from "@/shared/components/ui/DataTable/DataTable.types";
import type { SelectionConfig } from "@/shared/components/ui/DataTable/DataTable.types";

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

/** Secondary documents table with selection, transfer, trash, per-row actions. Uses DataTable for responsive card view. */
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

  const handleTransferSelectedClick = () => onTransfer(selectedIds.map((id) => Number(id)));

  const columns: ColumnDef<Document>[] = useMemo(
    () => [
      { id: "barcode", header: t("documents.barcode", { defaultValue: "Barcode" }), render: (row) => row.barcode ?? "–" },
      { id: "name", header: t("documents.name", { defaultValue: "Name" }), render: (row) => row.title ?? row.name ?? "–" },
      { id: "type", header: t("documents.type", { defaultValue: "Type" }), render: (row) => row.document_type_name ?? (row.document_type as { name?: string })?.name ?? "–" },
      { id: "upload_date", header: t("documents.uploadDate", { defaultValue: "Upload date" }), render: (row) => formatDate(row.upload_date) },
      { id: "status", header: t("documents.status", { defaultValue: "Status" }), render: (row) => row.status ?? "–" },
    ],
    [t, formatDate]
  );

  const rowActions: RowAction<Document>[] = useMemo(
    () => [
      { id: "view", label: t("common.view", { defaultValue: "View" }), icon: "eye", onClick: (row: Document, e: React.MouseEvent) => { e.stopPropagation(); onNavigate(row.id); } },
      ...(onEdit ? [{ id: "edit" as const, label: t("common.edit", { defaultValue: "Edit" }), icon: "pencil" as const, onClick: (row: Document, e: React.MouseEvent) => { e.stopPropagation(); onEdit(row.id); } }] : []),
      { id: "download", label: t("documents.download", { defaultValue: "Download" }), icon: "download", onClick: (row: Document, e: React.MouseEvent) => { e.stopPropagation(); onDownload(row.id); } },
      { id: "transfer", label: t("documents.transfer", { defaultValue: "Transfer" }), icon: "arrow-right-left", onClick: (row: Document, e: React.MouseEvent) => { e.stopPropagation(); onTransfer([row.id]); }, disabled: () => transferSubmitting },
      { id: "unarchive", label: t("documents.unarchive", { defaultValue: "Unarchive" }), icon: "refresh-cw", visible: (row: Document) => (row.status ?? "").toLowerCase() === "archived", onClick: (row: Document, e: React.MouseEvent) => { e.stopPropagation(); onUnarchive(row.id); }, disabled: () => isSubDocUnarchiving },
      { id: "archive", label: t("documents.archive", { defaultValue: "Archive" }), icon: "archive", visible: (row: Document) => (row.status ?? "").toLowerCase() !== "archived", onClick: (row: Document, e: React.MouseEvent) => { e.stopPropagation(); onArchive(row.id); }, disabled: () => isSubDocArchiving },
      { id: "trash", label: t("documents.moveToTrash", { defaultValue: "Move to trash" }), icon: "trash-2", variant: "danger", onClick: (row: Document, e: React.MouseEvent) => { e.stopPropagation(); onTrash(row.id); } },
    ].filter(Boolean) as RowAction<Document>[],
    [t, onNavigate, onEdit, onDownload, onTransfer, onUnarchive, onArchive, onTrash, transferSubmitting, isSubDocUnarchiving, isSubDocArchiving]
  );

  const selection: SelectionConfig<Document> | undefined = selectionConfig
    ? {
        selectedIds: selectionConfig.selectedIds,
        onToggle: selectionConfig.onToggle,
        onToggleAll: selectionConfig.onToggleAll,
        isAllSelected: selectionConfig.isAllSelected,
        isIndeterminate: selectionConfig.isIndeterminate,
        getRowAriaLabel: (row) => `Select document ${row.barcode || row.id}`,
      }
    : undefined;

  return (
    <div className="card mb-3">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <h6 className="mb-0">🧩 {t("folders.secondaryDocuments", { defaultValue: "Secondary documents" })}</h6>
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
        <DataTable<Document>
          data={subDocs}
          getRowId={(row) => row.id}
          columns={columns}
          loading={false}
          emptyMessage={t("folders.noSecondaryDocuments", { defaultValue: "No secondary documents." })}
          onRowClick={(row) => onNavigate(row.id)}
          rowActions={rowActions}
          selection={selection}
          actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
          tableClassName="table table-sm mb-0"
          responsive="auto"
          cardsBelow="lg"
          actionsStyle="inline"
        />
      </div>
    </div>
  );
}
