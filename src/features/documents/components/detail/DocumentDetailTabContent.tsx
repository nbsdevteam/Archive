import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FilePreview } from "../../../../shared/components/FilePreview";
import { Button, Spinner, Icon, DataTable } from "../../../../shared/components/ui";
import { AuditActivityPanel } from "../../../../shared/components/Activity";
import { NotesList } from "../../../notes/components";
import { buildRowActions } from "../../../../shared/utils/buildRowActions";
import type { TFunction } from "i18next";
import type { ColumnDef } from "../../../../shared/components/ui/DataTable/DataTable.types";

/** Props for document detail tab content: data/loading/error/tabs/selection/actions from container + confirm dialogs for attachment/note. */
export interface DocumentDetailTabContentProps {
  t: TFunction;
  tabs: { activeTab: string; activityViewMode: string; setActivityViewMode: (mode: unknown) => void; auditRefresh: () => void };
  data: {
    doc: { id: number; department_id?: number } | null;
    fileName: string | null | undefined;
    latestVersionId: number | null | undefined;
    versions: Array<{ id: number; version_number: number; file_name: string; upload_date?: string; uploaded_by?: string }>;
    attachments: Array<{ id: number; name: string; file_name: string; description?: string | null }>;
    notes: unknown[];
    ocr: unknown;
    ocrStatus: string;
    isOcrSupported: boolean;
    signatureRows: Array<{ id: number; state?: string; signer_name?: string; request_date?: string }>;
    approvedRequests: Array<{ id: number; signer_name?: string }>;
    canRequestSignature: boolean;
    relations: { parent?: { id: number; title: string; barcode?: string } | null; related?: Array<{ id: number; title: string; barcode?: string; notes?: string }> };
    auditLogs: unknown[] | Array<{ id?: string; [key: string]: unknown }>;
  };
  loading: {
    loadingAttachments: boolean;
    loadingRelations: boolean;
    loadingNotes: boolean;
    runOcrLoading: boolean;
    loadingAudit: boolean;
    isDeletingAttachment?: boolean;
  };
  error: { auditError: string | null; notesError: string | null | undefined };
  selection: {
    attachmentSelectedIds: (string | number)[];
    attachmentSelectionConfig: {
      isAllSelected: boolean;
      isIndeterminate: boolean;
      selectedIds: (string | number)[];
      onToggle: (id: string | number) => void;
      onToggleAll: () => void;
    } | null;
  };
  actions: {
    formatDate: (date?: string) => string;
    setModalUploadVersion: (v: boolean) => void;
    handleDownloadVersion: (id: number, fileName: string) => void;
    handleDownloadCurrent: () => void;
    setIsAddAttachmentPanelOpen: (v: boolean) => void;
    handleViewAttachment: (id: number) => void;
    handleDownloadAttachment: (id: number, fileName: string) => void;
    handleOpenEditAttachment: (id: number) => void;
    handleCreateNote: () => void;
    handleEditNote: (note: unknown) => void;
    handleViewNoteImage: (note: unknown) => void;
    handleRunOcr: () => void;
    setModalRequestSign: (v: boolean) => void;
    setModalUploadSigned: (v: boolean) => void;
    setModalAddRelation: (v: boolean) => void;
    handleSetParent: (parentId: number | null) => void;
  };
  attachmentTrashDialog: { open: (id: number) => void };
  batchAttachmentTrashDialog: { open: () => void };
  noteDeleteDialog: { open: (id: number) => void };
}

/** Attachment row type for document detail attachments table. */
type AttachmentRow = { id: number; name: string; file_name: string; description?: string | null };

/** Renders the active tab content for document detail (preview, versions, attachments, notes, ocr, signatures, relations, audit). */
export const DocumentDetailTabContent = ({
  t,
  tabs,
  data,
  loading,
  error,
  selection,
  actions,
  attachmentTrashDialog,
  batchAttachmentTrashDialog,
  noteDeleteDialog,
}: DocumentDetailTabContentProps) => {
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

  return (
    <>
      {tabs.activeTab === "preview" && (
        <div className="row">
          <div className="col-12 col-lg-6" style={{ minHeight: 200 }}>
            <FilePreview
              documentId={data.doc!.id}
              versionId={data.latestVersionId ?? undefined}
              fileName={data.fileName ?? ""}
              maxHeight="600px"
              notPreviewableMessage={t("documents.previewNotAvailable", { defaultValue: "Preview not available for this file type" })}
            />
          </div>
        </div>
      )}

      {tabs.activeTab === "download" && (
        <div>
          <p className="text-muted mb-2">
            {t("documents.downloadCurrentVersion", { defaultValue: "Download current version" })}
          </p>
          <Button variant="secondary" onClick={actions.handleDownloadCurrent}>
            <Icon name="download" className="me-1" />
            {data.fileName || t("documents.download", { defaultValue: "Download" })}
          </Button>
          {data.versions.length > 0 && (
            <>
              <hr />
              <p className="text-muted mb-2">{t("documents.downloadByVersion", { defaultValue: "By version" })}</p>
              <div className="d-flex flex-wrap gap-2">
                {data.versions.map((v) => (
                  <Button
                    key={v.id}
                    variant="outline"
                    size="sm"
                    className="btn-outline-secondary"
                    onClick={() => actions.handleDownloadVersion(v.id, v.file_name)}
                  >
                    v{v.version_number} – {v.file_name}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tabs.activeTab === "versions" && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>{t("documents.versionHistory", { defaultValue: "Version history" })}</span>
            <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={() => actions.setModalUploadVersion(true)}>
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="btn-outline-secondary"
                        onClick={() => actions.handleDownloadVersion(v.id, v.file_name)}
                      >
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
        </div>
      )}

      {tabs.activeTab === "attachments" && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>{t("documents.attachments", { defaultValue: "Attachments" })}</span>
            <div className="d-flex align-items-center gap-2">
              {selection.attachmentSelectedIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-outline-danger"
                  onClick={batchAttachmentTrashDialog.open}
                  disabled={loading.isDeletingAttachment}
                >
                  <Icon name="trash" className="me-1" />
                  {t("documents.deleteSelectedAttachments", { defaultValue: "Delete selected" })}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="btn-secondary btn-sm"
                onClick={() => actions.setIsAddAttachmentPanelOpen(true)}
              >
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

      {tabs.activeTab === "notes" && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>{t("documents.notes", { defaultValue: "Notes" })}</span>
            <Button variant="secondary" size="sm" onClick={actions.handleCreateNote}>
              <Icon name="folder-plus" className="me-1" />
              {t("notes.createNote", { defaultValue: "Create note" })}
            </Button>
          </div>
          <NotesList
            notes={data.notes as Parameters<typeof NotesList>[0]["notes"]}
            loading={loading.loadingNotes}
            error={error.notesError ?? undefined}
            onEdit={actions.handleEditNote}
            onDelete={(note: { id: number }) => noteDeleteDialog.open(note.id)}
            onViewImage={actions.handleViewNoteImage}
            showDocument={false}
            showFolder={true as boolean}
            emptyMessage={t("notes.noNotesForDocument", { defaultValue: "No notes found for this document." })}
          />
        </div>
      )}

      {tabs.activeTab === "ocr" && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span>
              {t("documents.ocrStatus", { defaultValue: "OCR status" })}: {data.ocrStatus}
            </span>
            {data.isOcrSupported && (
              <Button
                variant="secondary"
                size="sm"
                disabled={loading.runOcrLoading || data.ocrStatus === "processing"}
                onClick={actions.handleRunOcr}
              >
                {loading.runOcrLoading ? <Spinner /> : t("documents.runOcr", { defaultValue: "Run OCR" })}
              </Button>
            )}
          </div>
          {data.isOcrSupported ? (
            <div className="border rounded p-3 bg-light">
              <pre className="mb-0 small text-break" style={{ whiteSpace: "pre-wrap" }}>
                {(data.ocr as { extracted_text_preview?: string }).extracted_text_preview ||
                  (data.ocrStatus === "processing"
                    ? t("documents.ocrProcessing", { defaultValue: "Processing…" })
                    : t("documents.ocrNoText", { defaultValue: "No extracted text yet." }))}
              </pre>
            </div>
          ) : (
            <p className="text-muted">
              {t("documents.ocrNotSupported", {
                defaultValue: "OCR not supported for this file type ({{fileName}}).",
                fileName: data.fileName || "–",
              })}
            </p>
          )}
        </div>
      )}

      {tabs.activeTab === "signatures" && (
        <div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {data.canRequestSignature && (
              <Button variant="secondary" size="sm" onClick={() => actions.setModalRequestSign(true)}>
                {t("documents.requestSignature", { defaultValue: "Request signature" })}
              </Button>
            )}
            {data.canRequestSignature && data.approvedRequests.length > 0 && (
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={() => actions.setModalUploadSigned(true)}>
                <Icon name="file-up" className="me-1" />
                {t("documents.uploadSignedVersion", { defaultValue: "Upload signed version" })}
              </Button>
            )}
          </div>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>{t("documents.status", { defaultValue: "Status" })}</th>
                  <th>{t("documents.signer", { defaultValue: "Signer" })}</th>
                  <th>{t("documents.requestDate", { defaultValue: "Request date" })}</th>
                </tr>
              </thead>
              <tbody>
                {data.signatureRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.state ?? "–"}</td>
                    <td>{r.signer_name ?? "–"}</td>
                    <td>{actions.formatDate(r.request_date ?? undefined)}</td>
                  </tr>
                ))}
                {data.signatureRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-muted">
                      {t("common.noData", { defaultValue: "No data" })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tabs.activeTab === "relations" && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>{t("documents.relations", { defaultValue: "Relations" })}</span>
            <Button variant="secondary" size="sm" onClick={() => actions.setModalAddRelation(true)}>
              {t("documents.addRelation", { defaultValue: "Add relation" })}
            </Button>
          </div>
          {loading.loadingRelations ? (
            <Spinner />
          ) : (
            <>
              <div className="mb-3">
                <strong>{t("documents.parentDocument", { defaultValue: "Parent document" })}</strong>
                {data.relations.parent ? (
                  <p className="mb-1">
                    <Link to={`/documents/${data.relations.parent.id}`}>
                      {data.relations.parent.title} ({data.relations.parent.barcode ?? data.relations.parent.id})
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ms-2 btn-outline-danger"
                      onClick={() => actions.handleSetParent(null)}
                    >
                      {t("documents.clearParent", { defaultValue: "Clear" })}
                    </Button>
                  </p>
                ) : (
                  <p className="text-muted mb-0">{t("common.none", { defaultValue: "None" })}</p>
                )}
              </div>
              <div>
                <strong>{t("documents.relatedDocuments", { defaultValue: "Related documents" })}</strong>
                <ul className="list-unstyled mb-0">
                  {(data.relations.related ?? []).map((rel) => (
                    <li key={rel.id}>
                      <Link to={`/documents/${rel.id}`}>
                        {rel.title} ({rel.barcode ?? rel.id})
                      </Link>
                      {rel.notes && <span className="text-muted ms-1">– {rel.notes}</span>}
                    </li>
                  ))}
                  {(data.relations.related ?? []).length === 0 && (
                    <li className="text-muted">{t("common.noData", { defaultValue: "No data" })}</li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {tabs.activeTab === "audit" && (
        <AuditActivityPanel
          t={t}
          logs={data.auditLogs as Parameters<typeof AuditActivityPanel>[0]["logs"]}
          loading={loading.loadingAudit}
          error={error.auditError ?? undefined}
          viewMode={tabs.activityViewMode as "timeline" | "tree"}
          onViewModeChange={(mode: string) => tabs.setActivityViewMode(mode)}
          title={t("activity.auditTitle", { defaultValue: "Audit log" })}
          showRefresh
          onRefresh={tabs.auditRefresh}
          showDocument={false}
          showMetadata={false}
          treeGroupBy="document"
        />
      )}
    </>
  );
};
