import { useMemo } from "react";
import type { TFunction } from "i18next";
import type { Document } from "@/app/adapter/api/documents.api";
import { Button, DataTable, Icon } from "@/shared/components/ui";
import type { ColumnDef, RowAction } from "@/shared/components/ui/DataTable/DataTable.types";

export interface FolderDetailMainDocSectionProps {
  t: TFunction;
  mainDoc: Document | null;
  formatDate: (date?: string | null) => string;
  onDownload: () => void;
  onNavigate: (documentId: number) => void;
  onEdit?: (documentId: number) => void;
  onArchive: (documentId: number) => void;
  onUnarchive: (documentId: number) => void;
  isArchiving: boolean;
  isUnarchiving: boolean;
}

/**
 * Main document card: single-row table on desktop with inline action buttons.
 * Switches to stack card view on mobile (< lg) via DataTable cardsBelow="lg".
 */
export function FolderDetailMainDocSection({
  t,
  mainDoc,
  formatDate,
  onDownload,
  onNavigate,
  onEdit,
  onArchive,
  onUnarchive,
  isArchiving,
  isUnarchiving,
}: FolderDetailMainDocSectionProps) {
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
      { id: "download", label: t("documents.download", { defaultValue: "Download" }), icon: "download", onClick: (_row: Document, e: React.MouseEvent) => { e.stopPropagation(); onDownload(); } },
      ...(onEdit ? [{ id: "edit" as const, label: t("common.edit", { defaultValue: "Edit" }), icon: "pencil" as const, onClick: (_row: Document, e: React.MouseEvent) => { e.stopPropagation(); if (mainDoc && onEdit) onEdit(mainDoc.id); } }] : []),
      { id: "unarchive", label: t("documents.unarchive", { defaultValue: "Unarchive" }), icon: "refresh-cw", visible: (row: Document) => (row.status ?? "").toLowerCase() === "archived", onClick: (row: Document, e: React.MouseEvent) => { e.stopPropagation(); onUnarchive(row.id); }, disabled: () => isUnarchiving },
      { id: "archive", label: t("documents.archive", { defaultValue: "Archive" }), icon: "archive", visible: (row: Document) => (row.status ?? "").toLowerCase() !== "archived", onClick: (row: Document, e: React.MouseEvent) => { e.stopPropagation(); onArchive(row.id); }, disabled: () => isArchiving },
      { id: "view", label: t("common.view", { defaultValue: "View" }), icon: "eye", onClick: (row: Document, e: React.MouseEvent) => { e.stopPropagation(); onNavigate(row.id); } },
    ].filter(Boolean) as RowAction<Document>[],
    [t, onDownload, onEdit, onArchive, onUnarchive, onNavigate, mainDoc, isArchiving, isUnarchiving]
  );

  return (
    <div className="card mb-3">
      <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h6 className="mb-0">📌 {t("folders.mainDocument", { defaultValue: "Main document" })}</h6>
        {mainDoc && (
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={onDownload}>
            <Icon name="download" className="me-1" />
            {t("documents.download", { defaultValue: "Download" })}
          </Button>
        )}
      </div>
      <div className="card-body">
        <DataTable<Document>
          data={mainDoc ? [mainDoc] : []}
          getRowId={(row) => row.id}
          columns={columns}
          loading={false}
          emptyMessage={t("common.noData", { defaultValue: "No data" })}
          onRowClick={(row) => onNavigate(row.id)}
          rowActions={rowActions}
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
