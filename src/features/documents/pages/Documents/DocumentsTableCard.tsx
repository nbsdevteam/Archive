import type { TFunction } from "i18next";
import type { Document } from "@/app/adapter/api/documents.api";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
import type { RowAction } from "@/shared/components/ui/DataTable/DataTable.types";
import type { SelectionConfig } from "@/shared/components/ui/DataTable/DataTable.types";
import { Alert, Button, DataTable } from "@/shared/components/ui";

/** Props for the documents table card (error alert + DataTable). */
export interface DocumentsTableCardProps {
  t: TFunction;
  documents: Document[];
  loading: boolean;
  error: string | null;
  columns: ColumnDef<Document>[];
  rowActions: RowAction<Document>[];
  selectionConfig: SelectionConfig<Document>;
  onRetry: () => void;
  onRowClick: (documentId: number) => void;
  rowClassName?: (row: Document) => string;
}

/** Card body with error alert and documents DataTable. */
export function DocumentsTableCard({
  t,
  documents,
  loading,
  error,
  columns,
  rowActions,
  selectionConfig,
  onRetry,
  onRowClick,
  rowClassName,
}: DocumentsTableCardProps) {
  return (
    <div className="card-body h-min-50vh">
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
          <Button variant="outline" size="sm" className="btn-outline-secondary ms-2" onClick={onRetry}>
            {t("common.retry", { defaultValue: "Retry" })}
          </Button>
        </Alert>
      )}
      <DataTable<Document>
        data={documents}
        getRowId={(row) => row.id}
        columns={columns}
        loading={loading}
        emptyMessage={t("documents.noDocumentsFound", { defaultValue: "No documents found" })}
        onRowClick={(row) => onRowClick(row.id)}
        rowActions={rowActions}
        selection={selectionConfig}
        actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
        rowClassName={rowClassName}
      />
    </div>
  );
}
