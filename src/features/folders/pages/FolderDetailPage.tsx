import { useCallback } from "react";
import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { FilePreview } from "../../../shared/components/FilePreview";
import { UploadDocumentSidePanel } from "../../documents/components";
import { AuditActivityPanel } from "../../../shared/components/Activity";
import type { ActivityViewMode } from "../../activity/types";
import { EditFolderSidePanel, TransferToFolderModal } from "../components";
import { FolderDetailInfoCard } from "../components/detail";
import { Alert, Button, Spinner, Modal, ModalFooter, Icon, ConfirmModal } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useConfirmDialog, useConfirmDialogEmpty } from "../../../shared/hooks";
import type { Document } from "../../../app/adapter/api/documents.api";
import type { Attachment } from "../../../app/adapter/api/documents.api";
import { useFolderDetailPageContainer } from "../containers/useFolderDetailPageContainer";
import { convertToArabianStandardTime } from "../../../shared/utils/format/date";
import { NotesList, NoteEditor, NoteImageViewerModal } from "../../notes/components";

const FolderDetailPage = () => {
  const { t, routes, data, loadingState, errors, activity, selection, actions, modals } = useFolderDetailPageContainer();

  const deleteFolderDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmDeleteFolder });
  const subDocTrashDialog = useConfirmDialog<number>({ onConfirm: actions.confirmSubDocTrash });
  const batchSubDocTrashDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchSubDocTrash });
  const attachmentTrashDialog = useConfirmDialog<number>({ onConfirm: actions.confirmAttachmentTrash });
  const batchAttachmentTrashDialog = useConfirmDialogEmpty({ onConfirm: actions.confirmBatchAttachmentTrash });
  const noteDeleteDialog = useConfirmDialog<number>({ onConfirm: actions.confirmDeleteNote });

  const handleActivityRefresh = useCallback(() => {
    void activity.refreshActivityLogs();
  }, [activity.refreshActivityLogs]);
  const handleActivityViewModeChange = useCallback(
    (nextMode: ActivityViewMode) => {
      activity.setActivityViewMode(nextMode);
    },
    [activity.setActivityViewMode]
  );
  const handleTimelineDocumentClick = useCallback(
    (documentId: number, _log?: unknown) => {
      actions.handleNavigateToDocument(documentId);
    },
    [actions.handleNavigateToDocument]
  );

  if (!data.folderId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger">{t("errors.invalidId", { defaultValue: "Invalid folder id" })}</Alert>
        </div>
      </div>
    );
  }

  if (loadingState.loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-center min-vh-50">
            <Spinner size="md" />
          </div>
        </div>
      </div>
    );
  }

  if (!data.folder) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="warning">{t("errors.notFound", { defaultValue: "Not found." })}</Alert>
          <Link to={routes.folders} className="btn btn-secondary mt-2">
            {t("common.back", { defaultValue: "Back" })}
          </Link>
        </div>
      </div>
    );
  }

  const pageTitle = data.folder.name || `Folder #${data.folderId}`;

  return (
    <PageLayout
      title={pageTitle}
      breadcrumbItems={[{ label: t("folders.title", { defaultValue: "Folders" }), to: routes.folders }]}
      homeTo={routes.adminDashboard}
      rightContent={
        <>
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleUploadInFolder}>
            <Icon name="upload" className="me-1" />
            {t("folders.uploadInFolder", { defaultValue: "Upload in folder" })}
          </Button>
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleOpenEditFolder}>
            <Icon name="edit" className="me-1" />
            {t("folders.editFolder", { defaultValue: "Edit folder" })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="btn-outline-danger"
            onClick={deleteFolderDialog.open}
            aria-label={t("folders.deleteFolder", { defaultValue: "Delete folder" })}
          >
            <Icon name="trash" className="me-1" />
            {t("folders.deleteFolder", { defaultValue: "Delete folder" })}
          </Button>
          <Link to={routes.folders} className="btn btn-outline-secondary btn-sm">
            {t("common.back", { defaultValue: "Back" })}
          </Link>
          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.loadFolderDocuments}>
            {t("common.refresh", { defaultValue: "Refresh" })}
          </Button>
          <CollapseHeader />
        </>
      }
    >
        {errors.main && (
          <Alert variant="danger" className="mb-3">
            {errors.main}
            <Button variant="outline" size="sm" className="ms-2 btn-outline-secondary" onClick={actions.loadFolderDocuments}>
              {t("common.retry", { defaultValue: "Retry" })}
            </Button>
          </Alert>
        )}

        <FolderDetailInfoCard
          t={t}
          folder={data.folder}
          folderId={data.folderId}
          documentCount={data.documents.length}
          formatUpdated={(date) => convertToArabianStandardTime(date) ?? ""}
        />

        {/* Main document */}
        <div className="card mb-3">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h6 className="mb-0">📌 {t("folders.mainDocument", { defaultValue: "Main document" })}</h6>
            {data.mainDoc && (
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleDownloadMainDocument}>
                <Icon name="download" className="me-1" />
                {t("documents.download", { defaultValue: "Download" })}
              </Button>
            )}
          </div>
          <div className="card-body">
            {!data.mainDoc ? (
              <p className="text-muted mb-0">{t("common.noData", { defaultValue: "No data" })}</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>{t("documents.barcode", { defaultValue: "Barcode" })}</th>
                      <th>{t("documents.name", { defaultValue: "Name" })}</th>
                      <th>{t("documents.type", { defaultValue: "Type" })}</th>
                      <th>{t("documents.uploadDate", { defaultValue: "Upload date" })}</th>
                      <th>{t("documents.status", { defaultValue: "Status" })}</th>
                      <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style={{ cursor: "pointer" }}
                      onClick={() => actions.handleNavigateToDocument(data.mainDoc!.id)}
                    >
                      <td>{data.mainDoc!.barcode ?? "–"}</td>
                      <td>{data.mainDoc!.title ?? data.mainDoc!.name ?? "–"}</td>
                      <td>{data.mainDoc!.document_type_name ?? (data.mainDoc!.document_type as { name?: string })?.name ?? "–"}</td>
                      <td>{actions.formatDate(data.mainDoc!.upload_date)}</td>
                      <td>{data.mainDoc!.status ?? "–"}</td>
                      <td className="text-end">
                        <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={(e) => { e.stopPropagation(); actions.handleDownloadMainDocument(); }}>
                          <Icon name="download" className="me-1" />
                          {t("documents.download", { defaultValue: "Download" })}
                        </Button>
                        {(data.mainDoc!.status ?? "").toLowerCase() === "archived" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-outline-secondary me-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.handleUnarchiveFolderDocument(data.mainDoc!.id);
                            }}
                            disabled={loadingState.isSubDocUnarchiving}
                          >
                            {t("documents.unarchive", { defaultValue: "Unarchive" })}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-outline-secondary me-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.handleArchiveFolderDocument(data.mainDoc!.id);
                            }}
                            disabled={loadingState.isSubDocArchiving}
                          >
                            {t("documents.archive", { defaultValue: "Archive" })}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={(e) => { e.stopPropagation(); actions.handleNavigateToDocument(data.mainDoc!.id); }}>
                          {t("common.view", { defaultValue: "View" })}
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Secondary documents */}
        <div className="card mb-3">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h6 className="mb-0">🧩 {t("folders.secondaryDocuments", { defaultValue: "Secondary documents" })}</h6>
            {data.subDocs.length > 0 && selection.subDocSelectedIds.length > 0 && (
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-outline-secondary"
                  onClick={() => actions.openTransferDocs(selection.subDocSelectedIds.map((id) => Number(id)))}
                  disabled={loadingState.transferSubmitting}
                >
                  <Icon name="arrow-right-left" className="me-1" />
                  {t("documents.transferSelected", {
                    defaultValue: "Transfer selected",
                  })}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-outline-danger"
                  onClick={batchSubDocTrashDialog.open}
                  disabled={loadingState.isSubDocTrashing}
                >
                  <Icon name="trash-2" className="me-1" />
                  {t("documents.moveSelectedToTrash", {
                    defaultValue: "Move selected to trash",
                  })}
                </Button>
                <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.clearSubDocsSelection}>
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
                    {selection.subDocsSelectionConfig && (
                      <th style={{ width: "2.5rem" }} className="text-center">
                        {data.subDocs.length > 0 && (
                          <div className="form-check d-inline-flex justify-content-center mb-0">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selection.subDocsSelectionConfig.isAllSelected}
                              onChange={selection.subDocsSelectionConfig.onToggleAll}
                              aria-label={selection.subDocsSelectionConfig.isIndeterminate ? "Uncheck all" : "Check all"}
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
                  {data.subDocs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        {t("folders.noSecondaryDocuments", { defaultValue: "No secondary documents." })}
                      </td>
                    </tr>
                  ) : (
                    data.subDocs.map((doc: Document) => {
                      const isSelected = selection.subDocsSelectionConfig && selection.subDocsSelectionConfig.selectedIds.includes(doc.id);
                      const isArchived = (doc.status ?? "").toLowerCase() === "archived";
                      return (
                        <tr
                          key={doc.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => actions.handleNavigateToDocument(doc.id)}
                        >
                          {selection.subDocsSelectionConfig && (
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="form-check mb-0">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected}
                                  onChange={() => selection.subDocsSelectionConfig.onToggle(doc.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label={`Select document ${doc.barcode || doc.id}`}
                                />
                              </div>
                            </td>
                          )}
                          <td>{doc.barcode ?? "–"}</td>
                          <td>{doc.title ?? doc.name ?? "–"}</td>
                          <td>{doc.document_type_name ?? (doc.document_type as { name?: string })?.name ?? "–"}</td>
                          <td>{actions.formatDate(doc.upload_date)}</td>
                          <td>{doc.status ?? "–"}</td>
                          <td className="text-end" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-outline-secondary me-1"
                              onClick={() => actions.handleNavigateToDocument(doc.id)}
                            >
                              {t("common.view", { defaultValue: "View" })}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-outline-secondary me-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                actions.handleDownloadDocument(doc.id);
                              }}
                            >
                              {t("documents.download", { defaultValue: "Download" })}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-outline-secondary me-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                actions.openTransferDocs([doc.id]);
                              }}
                              disabled={loadingState.transferSubmitting}
                            >
                              <Icon name="arrow-right-left" className="me-1" />
                              {t("documents.transfer", { defaultValue: "Transfer" })}
                            </Button>
                            {isArchived ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-secondary me-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  actions.handleUnarchiveFolderDocument(doc.id);
                                }}
                                disabled={loadingState.isSubDocUnarchiving}
                              >
                                <Icon name="archive" className="me-1" />
                                {t("documents.unarchive", { defaultValue: "Unarchive" })}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-secondary me-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  actions.handleArchiveFolderDocument(doc.id);
                                }}
                                disabled={loadingState.isSubDocArchiving}
                              >
                                <Icon name="archive" className="me-1" />
                                {t("documents.archive", { defaultValue: "Archive" })}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                subDocTrashDialog.open(doc.id);
                              }}
                            >
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

        {/* Attachments */}
        <div className="card mb-3">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h6 className="mb-0">📎 {t("folders.attachments", { defaultValue: "Attachments" })}</h6>
            <div className="d-flex align-items-center gap-2">
              {data.documents.length > 0 && (
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto", minWidth: 200 }}
                  value={data.attachmentsDocId}
                  onChange={actions.handleAttachmentsDocIdChange}
                >
                  {data.documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title ?? d.name ?? "–"} — {d.barcode}
                    </option>
                  ))}
                </select>
              )}
              {data.attachments.length > 0 && selection.attachmentSelectedIds.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-outline-danger"
                    onClick={batchAttachmentTrashDialog.open}
                    disabled={loadingState.isAttachmentTrashing}
                  >
                    <Icon name="trash" className="me-1" />
                    {t("documents.deleteSelectedAttachments", {
                      defaultValue: "Delete selected",
                    })}
                  </Button>
                  <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.clearAttachmentsSelection}>
                    {t("common.clearSelection", { defaultValue: "Clear selection" })}
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleAddAttachment}>
                {t("folders.addAttachment", { defaultValue: "Add attachment" })}
              </Button>
            </div>
          </div>
          <div className="card-body">
            {loadingState.loadingAttachments ? (
              <div className="text-center py-4">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      {selection.attachmentsSelectionConfig && (
                        <th style={{ width: "2.5rem" }} className="text-center">
                          {data.attachments.length > 0 && (
                            <div className="form-check d-inline-flex justify-content-center mb-0">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selection.attachmentsSelectionConfig.isAllSelected}
                                onChange={selection.attachmentsSelectionConfig.onToggleAll}
                                aria-label={selection.attachmentsSelectionConfig.isIndeterminate ? "Uncheck all" : "Check all"}
                              />
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
                    {data.attachments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">
                          {t("common.noData", { defaultValue: "No data" })}
                        </td>
                      </tr>
                    ) : (
                      data.attachments.map((attachment) => {
                        const isSelected = selection.attachmentsSelectionConfig && selection.attachmentsSelectionConfig.selectedIds.includes(attachment.id);
                        return (
                          <tr key={attachment.id}>
                            {selection.attachmentsSelectionConfig && (
                                <td onClick={(e) => e.stopPropagation()}>
                                <div className="form-check mb-0">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isSelected}
                                    onChange={() => selection.attachmentsSelectionConfig.onToggle(attachment.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label={`Select attachment ${attachment.name}`}
                                  />
                                </div>
                              </td>
                            )}
                            <td>{attachment.name}</td>
                            <td>{attachment.file_name}</td>
                            <td className="text-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-secondary me-1"
                                onClick={(e) => {
                                  e?.stopPropagation();
                                  actions.handleViewAttachment(attachment.id);
                                }}
                              >
                                <Icon name="eye" className="me-1" />
                                {t("documents.view", { defaultValue: "View" })}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-secondary me-1"
                                onClick={() => actions.handleDownloadAttachment(attachment.id, attachment.file_name)}
                              >
                                {t("documents.download", { defaultValue: "Download" })}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  attachmentTrashDialog.open(attachment.id);
                                }}
                              >
                                <Icon name="trash" className="me-1" />
                                {t("documents.deleteAttachment", { defaultValue: "Delete" })}
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

        {/* Folder Notes (structured notes with optional images) */}
        <div className="card mb-3" style={{ borderTop: 0 }}>
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h6 className="mb-0">
              <Icon name="file-text" className="me-2" />
              {t("notes.folderNotes", { defaultValue: "Folder Notes" })}
            </h6>
            <div className="d-flex gap-2">
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleLoadNotes}>
                <Icon name="refresh-cw" className="me-1" />
                {t("common.refresh", { defaultValue: "Refresh" })}
              </Button>
              <Button variant="secondary" size="sm" onClick={actions.handleCreateNote}>
                <Icon name="upload" className="me-1" />
                {t("notes.createNote", { defaultValue: "Create note" })}
              </Button>
            </div>
          </div>
          <div className="card-body">
            <NotesList
              notes={data.notes}
              loading={loadingState.loadingNotes}
              error={errors.notesError}
              onEdit={actions.handleEditNote}
              onDelete={(note) => noteDeleteDialog.open(note.id)}
              onViewImage={actions.handleViewNoteImage}
              showDocument={true}
              showFolder={false}
              emptyMessage={t("notes.noNotesForFolder", {
                defaultValue: "No notes found for this folder.",
              })}
            />
          </div>
        </div>
        
        {/* Preview */}
        <div className="card mb-3">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h6 className="mb-0">📄 {t("documents.preview", { defaultValue: "Preview" })}</h6>
            {data.mainDoc && data.previewDoc?.id && data.previewFileName && (
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={actions.handleDownloadMainDocument}>
                <Icon name="download" className="me-1" />
                {t("documents.download", { defaultValue: "Download" })}
              </Button>
            )}
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-12 col-lg-6">
                {data.previewDoc?.id && data.previewFileName ? (
                  <FilePreview
                    documentId={data.previewDoc.id}
                    fileName={data.previewFileName}
                    maxHeight="500px"
                    notPreviewableMessage={t("documents.previewNotAvailable", { defaultValue: "Preview not available for this file type" })}
                  />
                ) : (
                  <p className="text-muted mb-0">{t("common.noData", { defaultValue: "No data" })}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Folder activity */}
        <AuditActivityPanel
          t={t}
          logs={activity.activityLogs}
          loading={activity.activityLoading}
          error={activity.activityError}
          viewMode={activity.activityViewMode}
          onViewModeChange={handleActivityViewModeChange}
          title={t("activity.folderTitle", { defaultValue: "Folder activity" })}
          subtitle={t("activity.folderCoverage", {
            defaultValue: "Showing events from {{count}} documents",
            count: activity.activityDocumentCount,
          })}
          showRefresh
          onRefresh={handleActivityRefresh}
          showDocument
          onDocumentClick={actions.handleNavigateToDocument}
          treeGroupBy="document"
        />

      {/* Signature modal */}
      <Modal isOpen={modals.signatureOpen} onClose={() => actions.setSignatureOpen(false)} title={t("folders.signatureRequestOnMain", { defaultValue: "Request signature (main document)" })} size="md">
        {data.mainDoc && (
          <p className="small mb-2">
            {data.mainDoc.title ?? data.mainDoc.name} — {data.mainDoc.barcode}
          </p>
        )}
        <div className="mb-3">
          <label className="form-label">{t("folders.signerRequired", { defaultValue: "Signer" })} *</label>
          <select className="form-select" value={modals.signatureSignerId} onChange={(e) => actions.setSignatureSignerId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">{t("folders.selectSigner", { defaultValue: "Select signer…" })}</option>
            {data.managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name} {m.login ? `(${m.login})` : ""}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">{t("folders.messageOptional", { defaultValue: "Message (optional)" })}</label>
          <textarea className="form-control" rows={3} value={modals.signatureMessage} onChange={(e) => actions.setSignatureMessage(e.target.value)} />
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={() => actions.setSignatureOpen(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button variant="secondary" disabled={!modals.signatureSignerId} onClick={actions.submitSignature}>
            {t("folders.create", { defaultValue: "Create" })}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit request modal */}
      <Modal isOpen={modals.editOpen} onClose={() => actions.setEditOpen(false)} title={t("folders.editRequestOnMain", { defaultValue: "Edit request (main document)" })} size="md">
        {data.mainDoc && (
          <p className="small mb-2">
            {data.mainDoc.title ?? data.mainDoc.name} — {data.mainDoc.barcode}
          </p>
        )}
        <div className="mb-3">
          <label className="form-label">{t("folders.editReasonRequired", { defaultValue: "Reason" })} *</label>
          <textarea className="form-control" rows={4} value={modals.editReason} onChange={(e) => actions.setEditReason(e.target.value)} />
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={() => actions.setEditOpen(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button variant="secondary" disabled={!data.mainDoc || !modals.editReason.trim()} onClick={actions.submitEditRequest}>
            {t("folders.create", { defaultValue: "Create" })}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal
        {...deleteFolderDialog.modalProps}
        title={t("folders.deleteFolder", { defaultValue: "Delete folder" })}
        message={t("folders.confirmDeleteFolder", { defaultValue: "Are you sure you want to delete this folder? Documents may be affected." })}
        confirmLabel={t("folders.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel")}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...subDocTrashDialog.modalProps}
        title={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        message={t("documents.confirmMoveToTrash", {
          defaultValue: "Are you sure you want to move this document to trash?",
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...batchSubDocTrashDialog.modalProps}
        title={t("documents.moveSelectedToTrash", {
          defaultValue: "Move selected to trash",
        })}
        message={t("documents.confirmBatchMoveToTrash", {
          defaultValue: "Move {{count}} document(s) to trash?",
          count: selection.subDocSelectedIds.length,
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...attachmentTrashDialog.modalProps}
        title={t("documents.deleteAttachment", { defaultValue: "Delete" })}
        message={t("documents.confirmDeleteAttachment", {
          defaultValue: "Are you sure you want to delete this attachment? This cannot be undone.",
        })}
        confirmLabel={t("documents.deleteAttachment", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <ConfirmModal
        {...batchAttachmentTrashDialog.modalProps}
        title={t("documents.deleteSelectedAttachments", {
          defaultValue: "Delete selected",
        })}
        message={t("documents.confirmBatchDeleteAttachments", {
          defaultValue: "Delete {{count}} attachment(s)? This cannot be undone.",
          count: selection.attachmentSelectedIds.length,
        })}
        confirmLabel={t("documents.deleteAttachment", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />

      <TransferToFolderModal
        isOpen={modals.transferModalOpen}
        onClose={actions.closeTransferModal}
        departmentId={modals.transferDepartmentId}
        title={t("folders.selectDestinationFolder", { defaultValue: "Select destination folder" })}
        subtitle={
          modals.transferMode === "docs"
            ? t("folders.transferSubtitleDocs", { count: modals.transferDocIds.length, defaultValue: "Transfer {{count}} document(s) to a folder in the same department." })
            : modals.transferMode === "attachments"
              ? t("folders.transferSubtitleAttachments", { count: modals.transferAttachmentIds.length, defaultValue: "Transfer {{count}} attachment(s) to a folder in the same department." })
              : undefined
        }
        excludeFolderId={data.folderId ?? undefined}
        onConfirm={actions.handleTransferConfirm}
        isSubmitting={loadingState.transferSubmitting}
      />

      <EditFolderSidePanel
        isOpen={modals.isEditFolderOpen}
        onClose={actions.handleCloseEditFolder}
        folder={data.folder}
        onSuccess={actions.handleEditFolderSuccess}
      />

      <UploadDocumentSidePanel
        isOpen={modals.isUploadOpen}
        onClose={actions.handleCloseUploadPanel}
        onSuccess={() => {
          actions.loadFolderDocuments();
          actions.refreshAttachmentsForCurrentDocument();
          actions.handleCloseUploadPanel();
        }}
        initialValues={modals.uploadPanelInitialValues}
        lockFolderContext={modals.uploadPanelLockFolderContext}
      />

      {/* Note editor modal */}
      <Modal
        isOpen={modals.isNotesEditorOpen}
        onClose={actions.handleCloseNoteEditor}
        title={
          modals.editingNote
            ? t("notes.editNote", { defaultValue: "Edit note" })
            : t("notes.createNote", { defaultValue: "Create note" })
        }
        size="lg"
      >
        <NoteEditor
          note={modals.editingNote}
          folderId={data.folderId ?? undefined}
          departmentId={data.folder?.department_id}
          onSave={actions.handleSaveNote}
          onCancel={actions.handleCloseNoteEditor}
          isSaving={loadingState.isCreatingNote || loadingState.isUpdatingNote}
        />
      </Modal>

      {/* Note image viewer modal */}
      <NoteImageViewerModal
        isOpen={modals.noteImageViewerId != null}
        onClose={actions.handleCloseNoteImageViewer}
        noteId={modals.noteImageViewerId}
        noteTitle={modals.noteImageViewerTitle}
        imageFilename={modals.noteImageViewerFilename}
      />

      {/* Note delete confirmation modal */}
      <ConfirmModal
        {...noteDeleteDialog.modalProps}
        title={t("notes.deleteNote", { defaultValue: "Delete note" })}
        message={t("notes.confirmDelete", {
          defaultValue: "Are you sure you want to delete this note? This action cannot be undone.",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
      />
    </PageLayout>
  );
};

export default FolderDetailPage;
