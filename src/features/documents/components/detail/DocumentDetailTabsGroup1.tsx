import { useMemo } from "react";
import { FilePreview } from "@/shared/components/FilePreview";
import { Button, Icon, DataTable } from "@/shared/components/ui";
import { buildRowActions } from "@/shared/utils/buildRowActions";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
import type { DocumentDetailTabContentProps } from "./DocumentDetailTabContent";

type AttachmentRow = { id: number; name: string; file_name: string; description?: string | null };

/** Renders preview, download, versions, and attachments tabs for document detail. */
export function DocumentDetailTabsGroup1(props: DocumentDetailTabContentProps) {
  const { t, tabState, data, loading, selection, actions, attachmentTrashDialog, batchAttachmentTrashDialog } = props;

  /** Downloads version using data-version-id and data-file-name on the button. */
  const handleDownloadVersionClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.versionId;
    const fileName = e.currentTarget.dataset.fileName ?? "";
    if (id != null) actions.handleDownloadVersion(Number(id), fileName);
  };

  const handleOpenUploadVersionModal = () => actions.setModalUploadVersion(true);

  const attachmentColumns: ColumnDef<AttachmentRow>[] = useMemo(
    () => [
      { id: "name", header: t("documents.name", { defaultValue: "Name" }), render: (row) => row.name },
      { id: "file_name", header: t("documents.fileName", { defaultValue: "File name" }), render: (row) => row.file_name },
      { id: "description", header: t("documents.description", { defaultValue: "Description" }), render: (row) => row.description ?? "–" },
    ],
    [t]
  );

  const attachmentRowActions = useMemo(
    () =>
      buildRowActions<AttachmentRow>(t, [
        { id: "view", labelKey: "documents.view", defaultValue: "View", icon: "eye", variant: "outline", className: "btn-outline-secondary me-1", onClick: (row) => actions.handleViewAttachment(row.id) },
        { id: "download", labelKey: "documents.download", defaultValue: "Download", icon: "download", variant: "outline", className: "btn-outline-secondary me-1", onClick: (row) => actions.handleDownloadAttachment(row.id, row.file_name) },
        { id: "edit", labelKey: "common.edit", defaultValue: "Edit", icon: "pencil", variant: "outline", className: "btn-outline-secondary me-1", onClick: (row) => actions.handleOpenEditAttachment(row.id) },
        { id: "delete", labelKey: "documents.deleteAttachment", defaultValue: "Delete", icon: "trash", variant: "outline", className: "btn-outline-danger", onClick: (row) => attachmentTrashDialog.open(row.id) },
      ]),
    [t, actions.handleViewAttachment, actions.handleDownloadAttachment, actions.handleOpenEditAttachment, attachmentTrashDialog]
  );

  if (!["preview", "download", "versions", "attachments"].includes(tabState.activeTab)) return null;

  return (
    <>
      {tabState.activeTab === "preview" && (
        <div className="row">
          <div className="col-12 col-lg-6" style={{ minHeight: 200 }}>
            <FilePreview
              documentId={data.doc!.id}
              versionId={data.latestVersionId ?? undefined}
              fileName={data.fileName ?? ""}
              maxHeight="600px"
              disableCache
              notPreviewableMessage={t("documents.previewNotAvailable", { defaultValue: "Preview not available for this file type" })}
            />
          </div>
        </div>
      )}

      {tabState.activeTab === "download" && (
        <>
          <p className="text-muted mb-2">{t("documents.downloadCurrentVersion", { defaultValue: "Download current version" })}</p>
          <Button variant="secondary" onClick={actions.handleDownloadCurrent} aria-label={t("documents.downloadCurrentVersion", { defaultValue: "Download current version" })}>
            <Icon name="download" className="me-1" />
            {data.fileName || t("documents.download", { defaultValue: "Download" })}
          </Button>
          {data.versions.length > 0 && (
            <>
              <hr />
              <p className="text-muted mb-2">{t("documents.downloadByVersion", { defaultValue: "By version" })}</p>
              <div className="d-flex flex-wrap gap-2">
                {data.versions.map((v) => (
                  <Button key={v.id} variant="outline" size="sm" className="btn-outline-secondary" data-version-id={String(v.id)} data-file-name={v.file_name} onClick={handleDownloadVersionClick}>
                    v{v.version_number} – {v.file_name}
                  </Button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tabState.activeTab === "versions" && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>{t("documents.versionHistory", { defaultValue: "Version history" })}</span>
            <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleOpenUploadVersionModal} aria-label={t("documents.uploadNewVersion", { defaultValue: "Upload new version" })}>
              <Icon name="file-up" className="me-1" />
              {t("documents.uploadNewVersion", { defaultValue: "Upload new version" })}
            </Button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>{t("documents.version", { defaultValue: "Version" })}</th>
                  <th>{t("documents.fileName", { defaultValue: "File name" })}</th>
                  <th>{t("documents.uploader", { defaultValue: "Uploader" })}</th>
                  <th>{t("documents.uploadDate", { defaultValue: "Upload date" })}</th>
                  <th>{t("common.actions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody>
                {data.versions.map((v) => (
                  <tr key={v.id}>
                    <td>v{v.version_number}</td>
                    <td>{v.file_name}</td>
                    <td>{v.uploaded_by ?? "–"}</td>
                    <td>{actions.formatDate(v.upload_date)}</td>
                    <td>
                      <Button variant="outline" size="sm" className="btn-outline-secondary" data-version-id={String(v.id)} data-file-name={v.file_name} onClick={handleDownloadVersionClick}>
                        {t("documents.download", { defaultValue: "Download" })}
                      </Button>
                    </td>
                  </tr>
                ))}
                {data.versions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      {t("common.noData", { defaultValue: "No data" })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tabState.activeTab === "attachments" && (
        <div className="attachments-tab-content h-min-25vh" data-testid="document-detail-attachments-tab">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>{t("documents.attachments", { defaultValue: "Attachments" })}</span>
            <div className="d-flex align-items-center gap-2">
              {selection.attachmentSelectedIds.length > 0 && (
                <Button variant="outline" size="sm" className="btn-outline-danger" onClick={batchAttachmentTrashDialog.open} disabled={loading.isDeletingAttachment} aria-label={t("documents.deleteSelectedAttachments", { defaultValue: "Delete selected" })}>
                  <Icon name="trash" className="me-1" />
                  {t("documents.deleteSelectedAttachments", { defaultValue: "Delete selected" })}
                </Button>
              )}
              <Button variant="secondary" size="sm" className="btn-secondary btn-sm" onClick={actions.openAddAttachmentPanel} data-testid="document-detail-add-attachment-btn" aria-label={t("documents.addAttachment", { defaultValue: "Add attachment" })}>
                {t("documents.addAttachment", { defaultValue: "Add attachment" })}
              </Button>
            </div>
          </div>
          <DataTable<AttachmentRow>
            data={data.attachments as AttachmentRow[]}
            getRowId={(row) => row.id}
            columns={attachmentColumns}
            loading={loading.loadingAttachments}
            emptyMessage={t("common.noData", { defaultValue: "No data" })}
            rowActions={attachmentRowActions}
            selection={selection.attachmentSelectionConfig ?? undefined}
            actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
            tableClassName="table table-sm mb-0"
          />
        </div>
      )}
    </>
  );
}
