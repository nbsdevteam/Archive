import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { FilePreview } from "../../../shared/components/FilePreview";
import { UploadDocumentSidePanel } from "../../documents/components";
import { Alert, Button, Spinner, Modal, ModalFooter, Icon } from "../../../shared/components/ui";
import { useFolderDetailPageContainer } from "../containers/useFolderDetailPageContainer";

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
    handleDownloadAttachment,
    setTransitionOpen,
    openTransition,
    setTransitionMessage,
    submitTransition,
    setSignatureOpen,
    setSignatureSignerId,
    setSignatureMessage,
    submitSignature,
    setEditOpen,
    setEditReason,
    submitEditRequest,
    loadFolderDocuments,
    handleCloseUploadPanel,
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
                  {folder.name || `Folder #${id}`}
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
            <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleUploadInFolder}>
              <Icon name="upload" className="me-1" />
              {t("folders.uploadInFolder", { defaultValue: "Upload in folder" })}
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
            <h5 className="card-title mb-0">{folder.name || `Folder #${id}`}</h5>
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
                <div className="fw-medium">{formatDate(folder.updated_at ?? folder.create_date ?? folder.updated)}</div>
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
          <div className="card-header">
            <h6 className="mb-0">🧩 {t("folders.secondaryDocuments", { defaultValue: "Secondary documents" })}</h6>
          </div>
          <div className="card-body">
            {subDocs.length === 0 ? (
              <p className="text-muted mb-0">{t("folders.noSecondaryDocuments", { defaultValue: "No secondary documents." })}</p>
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
                    {subDocs.map((d) => (
                      <tr
                        key={d.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleNavigateToDocument(d.id)}
                      >
                        <td>{d.barcode ?? "–"}</td>
                        <td>{d.title ?? d.name ?? "–"}</td>
                        <td>{d.document_type_name ?? (d.document_type as { name?: string })?.name ?? "–"}</td>
                        <td>{formatDate(d.upload_date)}</td>
                        <td>{d.status ?? "–"}</td>
                        <td className="text-end">
                          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={(e) => { e.stopPropagation(); handleNavigateToDocument(d.id); }}>
                            {t("common.view", { defaultValue: "View" })}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
              <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={handleAddAttachment}>
                {t("folders.addAttachment", { defaultValue: "Add attachment" })}
              </Button>
            
            </div>
          </div>
          <div className="card-body">
            {loadingAttachments ? (
              <Spinner />
            ) : attachments.length === 0 ? (
              <p className="text-muted mb-0">{t("common.noData", { defaultValue: "No data" })}</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>{t("folders.name", { defaultValue: "Name" })}</th>
                      <th>{t("documents.fileName", { defaultValue: "File name" })}</th>
                      <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attachments.map((a) => (
                      <tr key={a.id}>
                        <td>{a.name}</td>
                        <td>{a.file_name}</td>
                        <td className="text-end">
                          <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={() => handleDownloadAttachment(a.id, a.file_name)}>
                            {t("documents.download", { defaultValue: "Download" })}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

      <UploadDocumentSidePanel
        isOpen={isUploadOpen}
        onClose={handleCloseUploadPanel}
        onSuccess={() => {
          loadFolderDocuments();
          handleCloseUploadPanel();
        }}
        initialValues={uploadPanelInitialValues}
        lockFolderContext={uploadPanelLockFolderContext}
      />
    </div>
  );
};

export default FolderDetailPage;
