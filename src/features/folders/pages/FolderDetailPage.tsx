import { Link } from "react-router-dom";
import { ArrowRightLeft } from "lucide-react";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { FilePreview } from "../../../shared/components/FilePreview";
import { UploadDocumentSidePanel } from "../../documents/components";
import { EditFolderSidePanel, TransferToFolderModal } from "../components";
import { Alert, Button, Spinner, Modal, ModalFooter, Icon, ConfirmModal, DataTable } from "../../../shared/components/ui";
import type { ColumnDef, RowAction } from "../../../shared/components/ui/DataTable/DataTable.types";
import type { Document } from "../../../app/adapter/api/documents.api";
import type { Attachment } from "../../../app/adapter/api/documents.api";
import { useFolderDetailPageContainer } from "../containers/useFolderDetailPageContainer";

function secondaryDocsColumns(
  t: (key: string, opts?: { defaultValue?: string }) => string,
  formatDate: (dateStr?: string | null) => string
): ColumnDef<Document>[] {
  return [
    { id: "barcode", header: t("documents.barcode", { defaultValue: "Barcode" }), render: (d) => d.barcode ?? "–" },
    { id: "name", header: t("documents.name", { defaultValue: "Name" }), render: (d) => d.title ?? d.name ?? "–" },
    { id: "type", header: t("documents.type", { defaultValue: "Type" }), render: (d) => d.document_type_name ?? (d.document_type as { name?: string })?.name ?? "–" },
    { id: "upload_date", header: t("documents.uploadDate", { defaultValue: "Upload date" }), render: (d) => formatDate(d.upload_date) },
    { id: "status", header: t("documents.status", { defaultValue: "Status" }), render: (d) => d.status ?? "–" },
  ];
}

function secondaryDocsRowActions(
  t: (key: string, opts?: { defaultValue?: string }) => string,
  handleNavigateToDocument: (id: number) => void,
  openTransferDocs: (ids: number[]) => void,
  handleOpenSubDocTrashConfirm: (documentId: number) => void,
  handleDownloadDocument: (documentId: number) => void,
  handleArchiveFolderDocument: (documentId: number) => void,
  handleUnarchiveFolderDocument: (documentId: number) => void
): RowAction<Document>[] {
  return [
    {
      id: "view",
      label: t("common.view", { defaultValue: "View" }),
      variant: "outline",
      className: "btn-outline-secondary me-1",
      onClick: (d) => handleNavigateToDocument(d.id),
    },
    {
      id: "download",
      label: t("documents.download", { defaultValue: "Download" }),
      variant: "outline",
      className: "btn-outline-secondary me-1",
      onClick: (d, e) => {
        e.stopPropagation();
        handleDownloadDocument(d.id);
      },
    },
    {
      id: "transfer",
      label: t("folders.transfer", { defaultValue: "Transfer" }),
      variant: "outline",
      className: "btn-outline-secondary",
      renderLabel: () => (
        <>
          <ArrowRightLeft className="me-1" style={{ width: 14, height: 14, verticalAlign: "text-bottom" }} />
          {t("folders.transfer", { defaultValue: "Transfer" })}
        </>
      ),
      onClick: (d, e) => {
        e.stopPropagation();
        openTransferDocs([d.id]);
      },
    },
    {
      id: "archive",
      label: t("documents.archive", { defaultValue: "Archive" }),
      icon: "archive",
      variant: "outline",
      className: "btn-outline-secondary me-1",
      visible: (d) => (d.status ?? "").toLowerCase() !== "archived",
      onClick: (d, e) => {
        e.stopPropagation();
        handleArchiveFolderDocument(d.id);
      },
    },
    {
      id: "unarchive",
      label: t("documents.unarchive", { defaultValue: "Unarchive" }),
      icon: "archive",
      variant: "outline",
      className: "btn-outline-secondary me-1",
      visible: (d) => (d.status ?? "").toLowerCase() === "archived",
      onClick: (d, e) => {
        e.stopPropagation();
        handleUnarchiveFolderDocument(d.id);
      },
    },
    {
      id: "trash",
      label: t("documents.moveToTrash", { defaultValue: "Move to trash" }),
      icon: "trash",
      variant: "outline",
      className: "btn-outline-danger",
      onClick: (d, e) => {
        e.stopPropagation();
        handleOpenSubDocTrashConfirm(d.id);
      },
    },
  ];
}

function attachmentsColumns(t: (key: string, opts?: { defaultValue?: string }) => string): ColumnDef<Attachment>[] {
  return [
    { id: "name", header: t("folders.name", { defaultValue: "Name" }), render: (a) => a.name },
    { id: "file_name", header: t("documents.fileName", { defaultValue: "File name" }), render: (a) => a.file_name },
  ];
}

function attachmentsRowActions(
  t: (key: string, opts?: { defaultValue?: string }) => string,
  handleDownloadAttachment: (attachmentId: number, fileName: string) => void,
  openTransferAttachments: (ids: number[]) => void,
  handleOpenAttachmentTrashConfirm: (attachmentId: number) => void
): RowAction<Attachment>[] {
  return [
    {
      id: "download",
      label: t("documents.download", { defaultValue: "Download" }),
      variant: "outline",
      className: "btn-outline-secondary me-1",
      onClick: (a) => handleDownloadAttachment(a.id, a.file_name),
    },
    {
      id: "transfer",
      label: t("folders.transfer", { defaultValue: "Transfer" }),
      variant: "outline",
      className: "btn-outline-secondary",
      renderLabel: () => (
        <>
          <ArrowRightLeft className="me-1" style={{ width: 14, height: 14, verticalAlign: "text-bottom" }} />
          {t("folders.transfer", { defaultValue: "Transfer" })}
        </>
      ),
      onClick: (a, e) => {
        e.stopPropagation();
        openTransferAttachments([a.id]);
      },
    },
    {
      id: "trash",
      label: t("documents.moveToTrash", { defaultValue: "Move to trash" }),
      icon: "trash",
      variant: "outline",
      className: "btn-outline-danger",
      onClick: (a, e) => {
        e.stopPropagation();
        handleOpenAttachmentTrashConfirm(a.id);
      },
    },
  ];
}

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
    workflowInfo,
    workflowError,
    transitionOpen,
    transitionTarget,
    transitionMessage,
    applyingTransition,
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
    transitions,
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
    setTransitionOpen,
    openTransition,
    setTransitionMessage,
    submitTransition,
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
    openTransferDocs,
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
    openTransferAttachments,
    transferModalOpen,
    transferMode,
    transferDocIds,
    transferAttachmentIds,
    transferDepartmentId,
    transferSubmitting,
    closeTransferModal,
    handleTransferConfirm,
  } = useFolderDetailPageContainer();

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
                <div className="fw-medium">{formatDate(folder.updated_at ?? folder.write_date ?? folder.create_date ?? folder.updated) || "–"}</div>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="btn-outline-danger me-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSubDocTrashConfirm(mainDoc.id);
                          }}
                          disabled={isSubDocTrashing}
                        >
                          <Icon name="trash" className="me-1" />
                          {t("documents.moveToTrash", { defaultValue: "Move to trash" })}
                        </Button>
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
                  <Icon name="trash" className="me-1" />
                  {t("documents.moveSelectedToTrash", {
                    defaultValue: "Move selected to trash",
                  })}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-outline-secondary"
                  onClick={() => openTransferDocs(subDocSelectedIds as number[])}
                >
                  <ArrowRightLeft className="me-1" style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} />
                  {t("folders.transferSelected", { defaultValue: "Transfer selected" })}
                  {subDocSelectedIds.length > 0 && (
                    <span className="badge bg-secondary ms-1">{subDocSelectedIds.length}</span>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={clearSubDocsSelection}>
                  {t("common.clearSelection", { defaultValue: "Clear selection" })}
                </Button>
              </div>
            )}
          </div>
          <div className="card-body">
            <DataTable<Document>
              data={subDocs}
              getRowId={(d) => d.id}
              columns={secondaryDocsColumns(t, formatDate)}
              emptyMessage={t("folders.noSecondaryDocuments", { defaultValue: "No secondary documents." })}
              onRowClick={(d) => handleNavigateToDocument(d.id)}
              rowActions={secondaryDocsRowActions(
                t,
                handleNavigateToDocument,
                openTransferDocs,
                handleOpenSubDocTrashConfirm,
                handleDownloadDocument,
                handleArchiveFolderDocument,
                handleUnarchiveFolderDocument
              )}
              selection={subDocsSelectionConfig}
              actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
              tableClassName="table table-sm mb-0"
            />
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
                    {t("documents.moveSelectedToTrash", {
                      defaultValue: "Move selected to trash",
                    })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-outline-secondary"
                    onClick={() => openTransferAttachments(attachmentSelectedIds as number[])}
                  >
                    <ArrowRightLeft className="me-1" style={{ width: 16, height: 16, verticalAlign: "text-bottom" }} />
                    {t("folders.transferSelected", { defaultValue: "Transfer selected" })}
                    {attachmentSelectedIds.length > 0 && (
                      <span className="badge bg-secondary ms-1">{attachmentSelectedIds.length}</span>
                    )}
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
            <DataTable<Attachment>
              data={attachments}
              getRowId={(a) => a.id}
              columns={attachmentsColumns(t)}
              loading={loadingAttachments}
              emptyMessage={t("common.noData", { defaultValue: "No data" })}
              rowActions={attachmentsRowActions(
                t,
                handleDownloadAttachment,
                openTransferAttachments,
                handleOpenAttachmentTrashConfirm
              )}
              selection={attachmentsSelectionConfig}
              actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
              tableClassName="table table-sm mb-0"
            />
          </div>
        </div>

        {/* Workflow */}
        <div className="card mb-3">
          <div className="card-header">
            <h6 className="mb-0">⚙️ {t("folders.availableActions", { defaultValue: "Available actions" })}</h6>
          </div>
          <div className="card-body">
            {workflowInfo?.workflow_name && (
              <p className="text-muted small mb-2">
                {t("folders.workflowName", { defaultValue: "Workflow: {{name}}", name: workflowInfo.workflow_name })}
                {workflowInfo.state && ` • ${t("folders.currentState", { defaultValue: "State: {{name}}", name: workflowInfo.state })}`}
              </p>
            )}
            {workflowError && <Alert variant="danger" className="mb-2">{workflowError}</Alert>}
            {!workflowInfo?.workflow_id ? (
              <p className="text-muted mb-0">{t("folders.noWorkflowLinked", { defaultValue: "No workflow linked." })}</p>
            ) : transitions.length === 0 ? (
              <p className="text-muted mb-0">{t("folders.noAllowedTransitions", { defaultValue: "No allowed transitions." })}</p>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {transitions.map((tr) => (
                  <Button
                    key={tr.id}
                    variant="secondary"
                    size="sm"
                    onClick={() => openTransition(tr.id, `${tr.name}${tr.target_state ? ` → ${tr.target_state}` : ""}`)}
                  >
                    {tr.name}{tr.target_state ? ` → ${tr.target_state}` : ""}
                  </Button>
                ))}
                {mainDoc && (
                  <>
                    <Button variant="secondary" size="sm" onClick={openSignature}>
                      {t("documents.requestSignature", { defaultValue: "Request signature" })}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={openEditRequest}>
                      {t("editRequests.create", { defaultValue: "Create edit request" })}
                    </Button>
                  </>
                )}
              </div>
            )}
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
      </div>

      {/* Transition modal */}
      <Modal isOpen={transitionOpen} onClose={() => setTransitionOpen(false)} title={t("folders.changeFolderState", { defaultValue: "Change folder state" })} size="md">
        <p className="text-muted small">{transitionTarget?.label}</p>
        <div className="mb-3">
          <label className="form-label">{t("folders.messageForNewState", { defaultValue: "Message (optional)" })}</label>
          <textarea className="form-control" rows={3} value={transitionMessage} onChange={(e) => setTransitionMessage(e.target.value)} />
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={() => setTransitionOpen(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button variant="secondary" disabled={!transitionTarget || applyingTransition} onClick={submitTransition}>
            {applyingTransition ? <Spinner /> : t("folders.apply", { defaultValue: "Apply" })}
          </Button>
        </ModalFooter>
      </Modal>

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
        title={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        message={t("documents.confirmMoveToTrash", {
          defaultValue: "Are you sure you want to move this document to trash?",
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        confirmVariant="danger"
        isLoading={isAttachmentTrashing}
      />

      <ConfirmModal
        isOpen={isBatchAttachmentTrashConfirmOpen}
        onClose={handleCloseBatchAttachmentTrashConfirm}
        onConfirm={handleConfirmBatchAttachmentTrash}
        title={t("documents.moveSelectedToTrash", {
          defaultValue: "Move selected to trash",
        })}
        message={t("documents.confirmBatchMoveToTrash", {
          defaultValue: "Move {{count}} document(s) to trash?",
          count: attachmentSelectedIds.length,
        })}
        confirmLabel={t("documents.moveToTrash", { defaultValue: "Move to trash" })}
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
    </div>
  );
};

export default FolderDetailPage;
