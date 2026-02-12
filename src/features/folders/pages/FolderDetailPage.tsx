import { useCallback } from "react";
import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { FilePreview } from "../../../shared/components/FilePreview";
import { UploadDocumentSidePanel } from "../../documents/components";
import { AuditActivityPanel } from "../../../shared/components/Activity";
import type { ActivityViewMode } from "../../activity/types";
import { EditFolderSidePanel, TransferToFolderModal } from "../components";
import { Alert, Button, Spinner, Modal, ModalFooter, Icon, ConfirmModal } from "../../../shared/components/ui";
import type { Document } from "../../../app/adapter/api/documents.api";
import type { Attachment } from "../../../app/adapter/api/documents.api";
import { useFolderDetailPageContainer } from "../containers/useFolderDetailPageContainer";
import { convertToArabianStandardTime } from "../../../shared/utils/format/date";
import { NotesList, NoteEditor, NoteImageViewerModal } from "../../notes/components";

const FolderDetailPage = () => {
  const {
    t,
    routes,
    folderId,
    folder,
    documents,
    mainDoc,
    subDocs,
    loading,
    error,
    attachmentsDocId,
    attachments,
    loadingAttachments,
    managers,
    signatureOpen,
    signatureSignerId,
    signatureMessage,
    editOpen,
    editReason,
    isEditFolderOpen,
    isDeleteConfirmOpen,
    isDeletingFolder,
    handleOpenEditFolder,
    handleCloseEditFolder,
    handleEditFolderSuccess,
    handleOpenDeleteFolder,
    handleCloseDeleteConfirm,
    handleConfirmDeleteFolder,
    isUploadOpen,
    uploadPanelInitialValues,
    uploadPanelLockFolderContext,
    previewDoc,
    previewFileName,
    formatDate,
    handleNavigateToDocument,
    handleUploadInFolder,
    handleAttachmentsDocIdChange,
    handleAddAttachment,
    handleDownloadMainDocument,
    handleDownloadDocument,
    handleDownloadAttachment,
    handleArchiveFolderDocument,
    handleUnarchiveFolderDocument,
    setSignatureOpen,
    setSignatureSignerId,
    setSignatureMessage,
    openSignature,
    submitSignature,
    setEditOpen,
    setEditReason,
    openEditRequest,
    submitEditRequest,
    loadFolderDocuments,
    handleCloseUploadPanel,
    refreshAttachmentsForCurrentDocument,
    subDocsSelectionConfig,
    subDocSelectedIds,
    clearSubDocsSelection,
    subDocTrashTargetId,
    isSubDocArchiving,
    isSubDocUnarchiving,
    isSubDocTrashing,
    isBatchSubDocTrashConfirmOpen,
    isBatchSubDocTrashing,
    handleOpenSubDocTrashConfirm,
    handleCloseSubDocTrashConfirm,
    handleConfirmSubDocTrash,
    handleOpenBatchSubDocTrashConfirm,
    handleCloseBatchSubDocTrashConfirm,
    handleConfirmBatchSubDocTrash,
    attachmentsSelectionConfig,
    attachmentSelectedIds,
    clearAttachmentsSelection,
    attachmentTrashTargetId,
    isAttachmentTrashing,
    isBatchAttachmentTrashConfirmOpen,
    handleOpenAttachmentTrashConfirm,
    handleCloseAttachmentTrashConfirm,
    handleConfirmAttachmentTrash,
    handleOpenBatchAttachmentTrashConfirm,
    handleCloseBatchAttachmentTrashConfirm,
    handleConfirmBatchAttachmentTrash,
    handleViewAttachment,
    transferModalOpen,
    transferMode,
    transferDocIds,
    transferAttachmentIds,
    transferDepartmentId,
    transferSubmitting,
    closeTransferModal,
    handleTransferConfirm,
    activityLogs,
    activityLoading,
    activityError,
    activityDocumentCount,
    refreshActivityLogs,
    activityViewMode,
    setActivityViewMode,
    notes,
    loadingNotes,
    notesError,
    isNotesEditorOpen,
    editingNote,
    isCreatingNote,
    isUpdatingNote,
    isDeletingNote,
    noteImageViewerId,
    noteImageViewerTitle,
    noteImageViewerFilename,
    handleLoadNotes,
    handleCreateNote,
    handleEditNote,
    handleCloseNoteEditor,
    handleSaveNote,
    handleDeleteNote,
    noteDeleteTarget,
    handleCloseNoteDeleteConfirm,
    handleConfirmDeleteNote,
    handleViewNoteImage,
    handleCloseNoteImageViewer,
  } = useFolderDetailPageContainer();
  const handleActivityRefresh = useCallback(() => {
    void refreshActivityLogs();
  }, [refreshActivityLogs]);
  const handleActivityViewModeChange = useCallback(
    (nextMode: ActivityViewMode) => {
      setActivityViewMode(nextMode);
    },
    [setActivityViewMode]
  );
  const handleTimelineDocumentClick = useCallback(
    (documentId: number, _log?: unknown) => {
      handleNavigateToDocument(documentId);
    },
    [handleNavigateToDocument]
  );

  if (!folderId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger">{t("errors.invalidId", { defaultValue: "Invalid folder id" })}</Alert>
        </div>
      </div>
    );
  }

  if (loading) {
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

  if (!folder) {
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

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">{t("folders.details", { defaultValue: "Folder details" })}</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={routes.folders}>{t("folders.title", { defaultValue: "Folders" })}</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {folder.name || `Folder #${folderId}`}
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
            <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleUploadInFolder}>
              <Icon name="upload" className="me-1" />
              {t("folders.uploadInFolder", { defaultValue: "Upload in folder" })}
            </Button>
            <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleOpenEditFolder}>
              <Icon name="edit" className="me-1" />
              {t("folders.editFolder", { defaultValue: "Edit folder" })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="btn-outline-danger"
              onClick={handleOpenDeleteFolder}
              aria-label={t("folders.deleteFolder", { defaultValue: "Delete folder" })}
            >
              <Icon name="trash" className="me-1" />
              {t("folders.deleteFolder", { defaultValue: "Delete folder" })}
            </Button>
            <Link to={routes.folders} className="btn btn-outline-secondary btn-sm">
              {t("common.back", { defaultValue: "Back" })}
            </Link>
            <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={loadFolderDocuments}>
              {t("common.refresh", { defaultValue: "Refresh" })}
            </Button>
            <CollapseHeader />
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
            <Button variant="outline" size="sm" className="ms-2 btn-outline-secondary" onClick={loadFolderDocuments}>
              {t("common.retry", { defaultValue: "Retry" })}
            </Button>
          </Alert>
        )}

        <div className="card mb-3">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">{folder.name || `Folder #${folderId}`}</h5>
            <span className="text-muted small">
              {documents.length} {documents.length === 1 ? t("documents.document", { defaultValue: "document" }) : t("documents.documents", { defaultValue: "documents" })}
            </span>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="text-muted small">{t("folders.code", { defaultValue: "Code" })}</div>
                <div className="fw-medium">{folder.code ?? "–"}</div>
              </div>
              <div className="col-md-4">
                <div className="text-muted small">{t("folders.departmentName", { defaultValue: "Department" })}</div>
                <div className="fw-medium">{folder.department_name ?? "–"}</div>
              </div>
              <div className="col-md-4">
                <div className="text-muted small">{t("folders.type", { defaultValue: "Type" })}</div>
                <div className="fw-medium">{folder.folder_type ?? "–"}</div>
              </div>
              <div className="col-md-4">
                <div className="text-muted small">{t("folders.status", { defaultValue: "Status" })}</div>
                <div className="fw-medium">{folder.state ?? "–"}</div>
              </div>
              <div className="col-md-4">
                <div className="text-muted small">{t("folders.updated", { defaultValue: "Updated" })}</div>
                <div className="fw-medium">
                  {convertToArabianStandardTime(
                    folder.last_modified ?? folder.updated_at ?? folder.write_date ?? folder.create_date ?? folder.updated
                  ) || "–"}
                </div>
              </div>
              <div className="col-12">
                <div className="text-muted small">{t("folders.description", { defaultValue: "Description" })}</div>
                <div className="fw-medium">{folder.description ?? "–"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main document */}
        <div className="card mb-3">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h6 className="mb-0">📌 {t("folders.mainDocument", { defaultValue: "Main document" })}</h6>
            {mainDoc && (
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleDownloadMainDocument}>
                <Icon name="download" className="me-1" />
                {t("documents.download", { defaultValue: "Download" })}
              </Button>
            )}
          </div>
          <div className="card-body">
            {!mainDoc ? (
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
                      onClick={() => handleNavigateToDocument(mainDoc.id)}
                    >
                      <td>{mainDoc.barcode ?? "–"}</td>
                      <td>{mainDoc.title ?? mainDoc.name ?? "–"}</td>
                      <td>{mainDoc.document_type_name ?? (mainDoc.document_type as { name?: string })?.name ?? "–"}</td>
                      <td>{formatDate(mainDoc.upload_date)}</td>
                      <td>{mainDoc.status ?? "–"}</td>
                      <td className="text-end">
                        <Button variant="outline" size="sm" className="btn-outline-secondary me-1" onClick={(e) => { e.stopPropagation(); handleDownloadMainDocument(); }}>
                          <Icon name="download" className="me-1" />
                          {t("documents.download", { defaultValue: "Download" })}
                        </Button>
                        {(mainDoc.status ?? "").toLowerCase() === "archived" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="btn-outline-secondary me-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnarchiveFolderDocument(mainDoc.id);
                            }}
                            disabled={isSubDocUnarchiving}
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
                              handleArchiveFolderDocument(mainDoc.id);
                            }}
                            disabled={isSubDocArchiving}
                          >
                            {t("documents.archive", { defaultValue: "Archive" })}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={(e) => { e.stopPropagation(); handleNavigateToDocument(mainDoc.id); }}>
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
            {subDocs.length > 0 && subDocSelectedIds.length > 0 && (
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-outline-danger"
                  onClick={handleOpenBatchSubDocTrashConfirm}
                  disabled={isBatchSubDocTrashing}
                >
                  <Icon name="trash-2" className="me-1" />
                  {t("documents.moveSelectedToTrash", {
                    defaultValue: "Move selected to trash",
                  })}
                </Button>
                <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={clearSubDocsSelection}>
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
                    {subDocsSelectionConfig && (
                      <th style={{ width: "2.5rem" }} className="text-center">
                        {subDocs.length > 0 && (
                          <div className="form-check d-inline-flex justify-content-center mb-0">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={subDocsSelectionConfig.isAllSelected}
                              onChange={subDocsSelectionConfig.onToggleAll}
                              aria-label={subDocsSelectionConfig.isIndeterminate ? "Uncheck all" : "Check all"}
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
                      const isSelected = subDocsSelectionConfig && subDocsSelectionConfig.selectedIds.includes(doc.id);
                      const isArchived = (doc.status ?? "").toLowerCase() === "archived";
                      return (
                        <tr
                          key={doc.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleNavigateToDocument(doc.id)}
                        >
                          {subDocsSelectionConfig && (
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="form-check mb-0">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected}
                                  onChange={() => subDocsSelectionConfig.onToggle(doc.id)}
                                  onClick={(e) => e.stopPropagation()}
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
                          <td className="text-end" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-outline-secondary me-1"
                              onClick={() => handleNavigateToDocument(doc.id)}
                            >
                              {t("common.view", { defaultValue: "View" })}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-outline-secondary me-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument(doc.id);
                              }}
                            >
                              {t("documents.download", { defaultValue: "Download" })}
                            </Button>
                            {isArchived ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-secondary me-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnarchiveFolderDocument(doc.id);
                                }}
                                disabled={isSubDocUnarchiving}
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
                                  handleArchiveFolderDocument(doc.id);
                                }}
                                disabled={isSubDocArchiving}
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
                                handleOpenSubDocTrashConfirm(doc.id);
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
              {documents.length > 0 && (
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto", minWidth: 200 }}
                  value={attachmentsDocId}
                  onChange={handleAttachmentsDocIdChange}
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title ?? d.name ?? "–"} — {d.barcode}
                    </option>
                  ))}
                </select>
              )}
              {attachments.length > 0 && attachmentSelectedIds.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-outline-danger"
                    onClick={handleOpenBatchAttachmentTrashConfirm}
                    disabled={isAttachmentTrashing}
                  >
                    <Icon name="trash" className="me-1" />
                    {t("documents.deleteSelectedAttachments", {
                      defaultValue: "Delete selected",
                    })}
                  </Button>
                  <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={clearAttachmentsSelection}>
                    {t("common.clearSelection", { defaultValue: "Clear selection" })}
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleAddAttachment}>
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
                      {attachmentsSelectionConfig && (
                        <th style={{ width: "2.5rem" }} className="text-center">
                          {attachments.length > 0 && (
                            <div className="form-check d-inline-flex justify-content-center mb-0">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={attachmentsSelectionConfig.isAllSelected}
                                onChange={attachmentsSelectionConfig.onToggleAll}
                                aria-label={attachmentsSelectionConfig.isIndeterminate ? "Uncheck all" : "Check all"}
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
                    {attachments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">
                          {t("common.noData", { defaultValue: "No data" })}
                        </td>
                      </tr>
                    ) : (
                      attachments.map((attachment) => {
                        const isSelected = attachmentsSelectionConfig && attachmentsSelectionConfig.selectedIds.includes(attachment.id);
                        return (
                          <tr key={attachment.id}>
                            {attachmentsSelectionConfig && (
                              <td onClick={(e) => e.stopPropagation()}>
                                <div className="form-check mb-0">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isSelected}
                                    onChange={() => attachmentsSelectionConfig.onToggle(attachment.id)}
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
                                  handleViewAttachment(attachment.id);
                                }}
                              >
                                <Icon name="eye" className="me-1" />
                                {t("documents.view", { defaultValue: "View" })}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-secondary me-1"
                                onClick={() => handleDownloadAttachment(attachment.id, attachment.file_name)}
                              >
                                {t("documents.download", { defaultValue: "Download" })}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="btn-outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAttachmentTrashConfirm(attachment.id);
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
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleLoadNotes}>
                <Icon name="refresh-cw" className="me-1" />
                {t("common.refresh", { defaultValue: "Refresh" })}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCreateNote}>
                <Icon name="upload" className="me-1" />
                {t("notes.createNote", { defaultValue: "Create note" })}
              </Button>
            </div>
          </div>
          <div className="card-body">
            <NotesList
              notes={notes}
              loading={loadingNotes}
              error={notesError}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              onViewImage={handleViewNoteImage}
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
            {mainDoc && previewDoc?.id && previewFileName && (
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleDownloadMainDocument}>
                <Icon name="download" className="me-1" />
                {t("documents.download", { defaultValue: "Download" })}
              </Button>
            )}
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-12 col-lg-6">
                {previewDoc?.id && previewFileName ? (
                  <FilePreview
                    documentId={previewDoc.id}
                    fileName={previewFileName}
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
          logs={activityLogs}
          loading={activityLoading}
          error={activityError}
          viewMode={activityViewMode}
          onViewModeChange={handleActivityViewModeChange}
          title={t("activity.folderTitle", { defaultValue: "Folder activity" })}
          subtitle={t("activity.folderCoverage", {
            defaultValue: "Showing events from {{count}} documents",
            count: activityDocumentCount,
          })}
          showRefresh
          onRefresh={handleActivityRefresh}
          showDocument
          onDocumentClick={handleNavigateToDocument}
          treeGroupBy="document"
        />

      </div>

      {/* Signature modal */}
      <Modal isOpen={signatureOpen} onClose={() => setSignatureOpen(false)} title={t("folders.signatureRequestOnMain", { defaultValue: "Request signature (main document)" })} size="md">
        {mainDoc && (
          <p className="small mb-2">
            {mainDoc.title ?? mainDoc.name} — {mainDoc.barcode}
          </p>
        )}
        <div className="mb-3">
          <label className="form-label">{t("folders.signerRequired", { defaultValue: "Signer" })} *</label>
          <select className="form-select" value={signatureSignerId} onChange={(e) => setSignatureSignerId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">{t("folders.selectSigner", { defaultValue: "Select signer…" })}</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name} {m.login ? `(${m.login})` : ""}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">{t("folders.messageOptional", { defaultValue: "Message (optional)" })}</label>
          <textarea className="form-control" rows={3} value={signatureMessage} onChange={(e) => setSignatureMessage(e.target.value)} />
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={() => setSignatureOpen(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button variant="secondary" disabled={!signatureSignerId} onClick={submitSignature}>
            {t("folders.create", { defaultValue: "Create" })}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit request modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={t("folders.editRequestOnMain", { defaultValue: "Edit request (main document)" })} size="md">
        {mainDoc && (
          <p className="small mb-2">
            {mainDoc.title ?? mainDoc.name} — {mainDoc.barcode}
          </p>
        )}
        <div className="mb-3">
          <label className="form-label">{t("folders.editReasonRequired", { defaultValue: "Reason" })} *</label>
          <textarea className="form-control" rows={4} value={editReason} onChange={(e) => setEditReason(e.target.value)} />
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={() => setEditOpen(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button variant="secondary" disabled={!mainDoc || !editReason.trim()} onClick={submitEditRequest}>
            {t("folders.create", { defaultValue: "Create" })}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDeleteFolder}
        title={t("folders.deleteFolder", { defaultValue: "Delete folder" })}
        message={t("folders.confirmDeleteFolder", { defaultValue: "Are you sure you want to delete this folder? Documents may be affected." })}
        confirmLabel={t("folders.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel")}
        confirmVariant="danger"
        isLoading={isDeletingFolder}
      />

      <ConfirmModal
        isOpen={subDocTrashTargetId != null}
        onClose={handleCloseSubDocTrashConfirm}
        onConfirm={handleConfirmSubDocTrash}
        title={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        message={t("documents.confirmMoveToTrash", {
          defaultValue: "Are you sure you want to move this document to trash?",
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
        isLoading={isSubDocTrashing}
      />

      <ConfirmModal
        isOpen={isBatchSubDocTrashConfirmOpen}
        onClose={handleCloseBatchSubDocTrashConfirm}
        onConfirm={handleConfirmBatchSubDocTrash}
        title={t("documents.moveSelectedToTrash", {
          defaultValue: "Move selected to trash",
        })}
        message={t("documents.confirmBatchMoveToTrash", {
          defaultValue: "Move {{count}} document(s) to trash?",
          count: subDocSelectedIds.length,
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
        isLoading={isBatchSubDocTrashing}
      />

      <ConfirmModal
        isOpen={attachmentTrashTargetId != null}
        onClose={handleCloseAttachmentTrashConfirm}
        onConfirm={handleConfirmAttachmentTrash}
        title={t("documents.deleteAttachment", { defaultValue: "Delete" })}
        message={t("documents.confirmDeleteAttachment", {
          defaultValue: "Are you sure you want to delete this attachment? This cannot be undone.",
        })}
        confirmLabel={t("documents.deleteAttachment", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
        isLoading={isAttachmentTrashing}
      />

      <ConfirmModal
        isOpen={isBatchAttachmentTrashConfirmOpen}
        onClose={handleCloseBatchAttachmentTrashConfirm}
        onConfirm={handleConfirmBatchAttachmentTrash}
        title={t("documents.deleteSelectedAttachments", {
          defaultValue: "Delete selected",
        })}
        message={t("documents.confirmBatchDeleteAttachments", {
          defaultValue: "Delete {{count}} attachment(s)? This cannot be undone.",
          count: attachmentSelectedIds.length,
        })}
        confirmLabel={t("documents.deleteAttachment", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
        isLoading={isAttachmentTrashing}
      />

      <TransferToFolderModal
        isOpen={transferModalOpen}
        onClose={closeTransferModal}
        departmentId={transferDepartmentId}
        title={t("folders.selectDestinationFolder", { defaultValue: "Select destination folder" })}
        subtitle={
          transferMode === "docs"
            ? t("folders.transferSubtitleDocs", { count: transferDocIds.length, defaultValue: "Transfer {{count}} document(s) to a folder in the same department." })
            : transferMode === "attachments"
              ? t("folders.transferSubtitleAttachments", { count: transferAttachmentIds.length, defaultValue: "Transfer {{count}} attachment(s) to a folder in the same department." })
              : undefined
        }
        excludeFolderId={folderId ?? undefined}
        onConfirm={handleTransferConfirm}
        isSubmitting={transferSubmitting}
      />

      <EditFolderSidePanel
        isOpen={isEditFolderOpen}
        onClose={handleCloseEditFolder}
        folder={folder}
        onSuccess={handleEditFolderSuccess}
      />

      <UploadDocumentSidePanel
        isOpen={isUploadOpen}
        onClose={handleCloseUploadPanel}
        onSuccess={() => {
          loadFolderDocuments();
          refreshAttachmentsForCurrentDocument();
          handleCloseUploadPanel();
        }}
        initialValues={uploadPanelInitialValues}
        lockFolderContext={uploadPanelLockFolderContext}
      />

      {/* Note editor modal */}
      <Modal
        isOpen={isNotesEditorOpen}
        onClose={handleCloseNoteEditor}
        title={
          editingNote
            ? t("notes.editNote", { defaultValue: "Edit note" })
            : t("notes.createNote", { defaultValue: "Create note" })
        }
        size="lg"
      >
        <NoteEditor
          note={editingNote}
          folderId={folderId ?? undefined}
          departmentId={folder?.department_id}
          onSave={handleSaveNote}
          onCancel={handleCloseNoteEditor}
          isSaving={isCreatingNote || isUpdatingNote}
        />
      </Modal>

      {/* Note image viewer modal */}
      <NoteImageViewerModal
        isOpen={noteImageViewerId != null}
        onClose={handleCloseNoteImageViewer}
        noteId={noteImageViewerId}
        noteTitle={noteImageViewerTitle}
        imageFilename={noteImageViewerFilename}
      />

      {/* Note delete confirmation modal */}
      <ConfirmModal
        isOpen={noteDeleteTarget != null}
        onClose={handleCloseNoteDeleteConfirm}
        onConfirm={handleConfirmDeleteNote}
        title={t("notes.deleteNote", { defaultValue: "Delete note" })}
        message={t("notes.confirmDelete", {
          defaultValue: "Are you sure you want to delete this note? This action cannot be undone.",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
        isLoading={isDeletingNote}
      />
    </div>
  );
};

export default FolderDetailPage;
