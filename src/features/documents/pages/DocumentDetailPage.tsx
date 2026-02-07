import { Link } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { FilePreview } from "../../../shared/components/FilePreview";
import { Alert, Button, Spinner, Modal, ModalFooter, Icon } from "../../../shared/components/ui";
import { UploadDocumentSidePanel } from "../components";
import { useDocumentDetailPageContainer } from "../containers/useDocumentDetailPageContainer";
import "../styles/documents.css";

const DocumentDetailPage = () => {
  const { t, docId, doc, isLoading, storeError, title, documentTypeName, departmentName, uploaderName, versions, tags, ocrStatus, fileName, isOcrSupported, latestVersionId, signatureRows, approvedRequests, isArchived, canRequestSignature, attachments, relations, auditLogs, activeTab, loadingAttachments, loadingRelations, loadingAudit, managers, isAddAttachmentPanelOpen, modalUploadVersion, uploadVersionFile, uploadVersionUnlockToken, uploadVersionDescription, uploadingVersion, uploadVersionInputRef, modalRequestSign, selectedSignerId, signMessage, modalUploadSigned, selectedApprovedReqId, signToken, signedFile, uploadingSigned, signedFileInputRef, modalAddRelation, relatedDocId, relationNotes, addingRelation, runOcrLoading, tabs, formatDate, refreshAttachments, setActiveTab, setIsAddAttachmentPanelOpen, setModalUploadVersion, setUploadVersionFile, setUploadVersionUnlockToken, setUploadVersionDescription, setModalRequestSign, setSelectedSignerId, setSignMessage, setModalUploadSigned, setSelectedApprovedReqId, setSignToken, setSignedFile, setModalAddRelation, setRelatedDocId, setRelationNotes, handleClearUploadVersionFile, handleClearSignedFile, handleDownloadVersion, handleDownloadCurrent, handleDownloadAttachment, handleArchive, handleUnarchive, handleRunOcr, handleUploadVersionSubmit, handleCreateSignatureRequest, handleUploadSignedSubmit, handleAddRelationSubmit, handleSetParent } = useDocumentDetailPageContainer();
  const routes = all_routes;
  if (isLoading && !doc) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-center min-vh-50">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  if (!docId || !doc) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="warning">
            {t("errors.notFound", { defaultValue: "Not found." })}
          </Alert>
          <Link to={routes.documents} className="btn btn-secondary mt-2">
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
            <h2 className="mb-1 page-heading">{t("documents.details", { defaultValue: "Document details" })}</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to={routes.archiveDocuments}>{t("documents.title", { defaultValue: "Documents" })}</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {title} {doc.barcode && `(${doc.barcode})`}
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
            <Link to={routes.archiveDocuments} className="btn btn-outline-secondary btn-sm">
              <Icon name="arrow-left" className="me-1" />
              {t("common.back", { defaultValue: "Back" })}
            </Link>
            {isArchived ? (
              <Button variant="secondary" size="sm" onClick={handleUnarchive}>
                {t("documents.unarchive", { defaultValue: "Unarchive" })}
              </Button>
            ) : (
              <Button variant="danger" size="sm" onClick={handleArchive}>
                {t("documents.archive", { defaultValue: "Archive" })}
              </Button>
            )}
            <CollapseHeader />
          </div>
        </div>

        {storeError && (
          <Alert variant="danger" className="mb-3">
            {storeError}
          </Alert>
        )}

        <div className="card mb-3">
          <div className="card-header d-flex flex-wrap align-items-center gap-2">
            <h5 className="card-title mb-0">{title}</h5>
            {doc.barcode && (
              <span className="badge bg-secondary">{doc.barcode}</span>
            )}
            <span
              className={`badge ${
                isArchived ? "bg-warning" : "bg-success"
              }`}
            >
              {doc.status ?? "–"}
            </span>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-sm table-borderless">
                  <tbody>
                    <tr>
                      <td className="text-muted">{t("documents.barcode", { defaultValue: "Barcode" })}</td>
                      <td>{doc.barcode ?? "–"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">{t("documents.type", { defaultValue: "Type" })}</td>
                      <td>{documentTypeName}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">{t("documents.department", { defaultValue: "Department" })}</td>
                      <td>{departmentName}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">{t("documents.uploader", { defaultValue: "Uploader" })}</td>
                      <td>{uploaderName}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">{t("documents.uploadDate", { defaultValue: "Upload date" })}</td>
                      <td>{formatDate(doc.upload_date)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-sm table-borderless">
                  <tbody>
                    <tr>
                      <td className="text-muted">{t("documents.status", { defaultValue: "Status" })}</td>
                      <td>{doc.status ?? "–"}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">{t("documents.confidentialityLabel", { defaultValue: "Confidentiality" })}</td>
                      <td>{doc.confidentiality_level ?? "–"}</td>
                    </tr>
                    {tags.length > 0 && (
                      <tr>
                        <td className="text-muted">{t("documents.tags", { defaultValue: "Tags" })}</td>
                        <td>
                          {tags.map((tag: { id?: number; name?: string }) => (
                            <span key={tag.id ?? tag.name} className="badge bg-light text-dark me-1">
                              {tag.name ?? "–"}
                            </span>
                          ))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <ul className="nav nav-tabs mb-2">
          {tabs.map((tab) => (
            <li className="nav-item" key={tab.id}>
              <button
                type="button"
                className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="card">
          <div className="card-body">
            {activeTab === "preview" && (
              <div className="row">
                <div className="col-12 col-lg-6" style={{ minHeight: 300 }}>
                  <FilePreview
                    documentId={doc.id}
                    versionId={latestVersionId}
                    fileName={fileName}
                    maxHeight="600px"
                    notPreviewableMessage={t("documents.previewNotAvailable", { defaultValue: "Preview not available for this file type" })}
                  />
                </div>
              </div>
            )}

            {activeTab === "download" && (
              <div>
                <p className="text-muted mb-2">
                  {t("documents.downloadCurrentVersion", { defaultValue: "Download current version" })}
                </p>
                <Button variant="secondary" onClick={handleDownloadCurrent}>
                  <Icon name="download" className="me-1" />
                  {fileName || t("documents.download", { defaultValue: "Download" })}
                </Button>
                {versions.length > 0 && (
                  <>
                    <hr />
                    <p className="text-muted mb-2">{t("documents.downloadByVersion", { defaultValue: "By version" })}</p>
                    <div className="d-flex flex-wrap gap-2">
                      {versions.map((v) => (
                        <Button
                          key={v.id}
                          variant="outline"
                          size="sm"
                          className="btn-outline-secondary"
                          onClick={() => handleDownloadVersion(v.id, v.file_name)}
                        >
                          v{v.version_number} – {v.file_name}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "versions" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span>{t("documents.versionHistory", { defaultValue: "Version history" })}</span>
                  <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={() => setModalUploadVersion(true)}>
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
                      {versions.map((v) => (
                        <tr key={v.id}>
                          <td>v{v.version_number}</td>
                          <td>{v.file_name}</td>
                          <td>{v.uploaded_by ?? "–"}</td>
                        <td>{formatDate(v.upload_date)}</td>
                          <td>
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-outline-secondary"
                              onClick={() => handleDownloadVersion(v.id, v.file_name)}
                            >
                              {t("documents.download", { defaultValue: "Download" })}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {versions.length === 0 && (
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

            {activeTab === "attachments" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span>{t("documents.attachments", { defaultValue: "Attachments" })}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="btn-secondary btn-sm"
                    onClick={() => setIsAddAttachmentPanelOpen(true)}
                  >
                    {t("documents.addAttachment", { defaultValue: "Add attachment" })}
                  </Button>
                </div>
                {loadingAttachments ? (
                  <Spinner />
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>{t("documents.name", { defaultValue: "Name" })}</th>
                          <th>{t("documents.fileName", { defaultValue: "File name" })}</th>
                          <th>{t("common.actions", { defaultValue: "Actions" })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attachments.map((a) => (
                          <tr key={a.id}>
                            <td>{a.name}</td>
                            <td>{a.file_name}</td>
                            <td>
                              <Button
                                variant="outline"
                                size="sm"
                                className="me-1 btn-outline-secondary"
                                onClick={() => handleDownloadAttachment(a.id, a.file_name)}
                              >
                                {t("documents.download", { defaultValue: "Download" })}
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {attachments.length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center text-muted">
                              {t("common.noData", { defaultValue: "No data" })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ocr" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>{t("documents.ocrStatus", { defaultValue: "OCR status" })}: {ocrStatus}</span>
                  {isOcrSupported && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={runOcrLoading || ocrStatus === "processing"}
                      onClick={handleRunOcr}
                    >
                      {runOcrLoading ? <Spinner /> : t("documents.runOcr", { defaultValue: "Run OCR" })}
                    </Button>
                  )}
                </div>
                {isOcrSupported ? (
                  <div className="border rounded p-3 bg-light">
                    <pre className="mb-0 small text-break" style={{ whiteSpace: "pre-wrap" }}>
                      {(ocr as { extracted_text_preview?: string }).extracted_text_preview ||
                        (ocrStatus === "processing"
                          ? t("documents.ocrProcessing", { defaultValue: "Processing…" })
                          : t("documents.ocrNoText", { defaultValue: "No extracted text yet." }))}
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted">
                    {t("documents.ocrNotSupported", {
                      defaultValue: "OCR not supported for this file type ({{fileName}}).",
                      fileName: fileName || "–",
                    })}
                  </p>
                )}
              </div>
            )}

            {activeTab === "signatures" && (
              <div>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {canRequestSignature && (
                    <Button variant="secondary" size="sm" onClick={() => setModalRequestSign(true)}>
                      {t("documents.requestSignature", { defaultValue: "Request signature" })}
                    </Button>
                  )}
                  {canRequestSignature && approvedRequests.length > 0 && (
                    <Button variant="outline" size="sm" className="btn-outline-secondary" onClick={() => setModalUploadSigned(true)}>
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
                      {signatureRows.map((r) => (
                        <tr key={r.id}>
                          <td>{r.state ?? "–"}</td>
                          <td>{r.signer_name ?? "–"}</td>
                        <td>{formatDate(r.request_date ?? undefined)}</td>
                        </tr>
                      ))}
                      {signatureRows.length === 0 && (
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

            {activeTab === "relations" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span>{t("documents.relations", { defaultValue: "Relations" })}</span>
                  <Button variant="secondary" size="sm" onClick={() => setModalAddRelation(true)}>
                    {t("documents.addRelation", { defaultValue: "Add relation" })}
                  </Button>
                </div>
                {loadingRelations ? (
                  <Spinner />
                ) : (
                  <>
                    <div className="mb-3">
                      <strong>{t("documents.parentDocument", { defaultValue: "Parent document" })}</strong>
                      {relations.parent ? (
                        <p className="mb-1">
                          <Link to={`/documents/${relations.parent.id}`}>
                            {relations.parent.title} ({relations.parent.barcode ?? relations.parent.id})
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ms-2 btn-outline-danger"
                            onClick={() => handleSetParent(null)}
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
                        {(relations.related ?? []).map((rel) => (
                          <li key={rel.id}>
                            <Link to={`/documents/${rel.id}`}>
                              {rel.title} ({rel.barcode ?? rel.id})
                            </Link>
                            {rel.notes && <span className="text-muted ms-1">– {rel.notes}</span>}
                          </li>
                        ))}
                        {(relations.related ?? []).length === 0 && (
                          <li className="text-muted">{t("common.noData", { defaultValue: "No data" })}</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "audit" && (
              <div>
                {loadingAudit ? (
                  <Spinner />
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>{t("documents.action", { defaultValue: "Action" })}</th>
                          <th>{t("documents.user", { defaultValue: "User" })}</th>
                          <th>{t("documents.timestamp", { defaultValue: "Timestamp" })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td>{log.action}</td>
                            <td>{log.user_name}</td>
                        <td>{formatDate(log.timestamp)}</td>
                          </tr>
                        ))}
                        {auditLogs.length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center text-muted">
                              {t("common.noData", { defaultValue: "No data" })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {doc && (
        <UploadDocumentSidePanel
          isOpen={isAddAttachmentPanelOpen}
          onClose={() => setIsAddAttachmentPanelOpen(false)}
          onSuccess={() => {
            setIsAddAttachmentPanelOpen(false);
            refreshAttachments();
          }}
          initialValues={{
            upload_kind: "attachment",
            target_document_id: doc.id,
          }}
        />
      )}

      {/* Upload new version modal */}
      <Modal
        isOpen={modalUploadVersion}
        onClose={() => setModalUploadVersion(false)}
        title={t("documents.uploadNewVersion", { defaultValue: "Upload new version" })}
        size="md"
      >
        <div className="mb-3">
          <label className="form-label">{t("documents.unlockToken", { defaultValue: "Unlock token" })} *</label>
          <input
            type="text"
            className="form-control"
            value={uploadVersionUnlockToken}
            onChange={(e) => setUploadVersionUnlockToken(e.target.value)}
            placeholder={t("documents.unlockTokenPlaceholder", { defaultValue: "Enter unlock token" })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.changeDescription", { defaultValue: "Change description" })}</label>
          <input
            type="text"
            className="form-control"
            value={uploadVersionDescription}
            onChange={(e) => setUploadVersionDescription(e.target.value)}
            placeholder={t("documents.changeDescriptionPlaceholder", { defaultValue: "Optional" })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.file", { defaultValue: "File" })} *</label>
          <div className="d-flex gap-2 align-items-center">
            <input
              ref={uploadVersionInputRef}
              type="file"
              className="form-control"
              onChange={(e) => setUploadVersionFile(e.target.files?.[0] ?? null)}
            />
            {uploadVersionFile && (
              <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={handleClearUploadVersionFile}>
                <Icon name="x" className="me-1" />
                {t("common.remove", { defaultValue: "Remove" })}
              </Button>
            )}
          </div>
          {uploadVersionFile && <small className="text-muted d-block mt-1">{uploadVersionFile.name}</small>}
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={() => setModalUploadVersion(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant="secondary"
            disabled={!uploadVersionFile || !uploadVersionUnlockToken.trim() || uploadingVersion}
            onClick={handleUploadVersionSubmit}
          >
            {uploadingVersion ? <Spinner /> : t("documents.upload", { defaultValue: "Upload" })}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Request signature modal */}
      <Modal
        isOpen={modalRequestSign}
        onClose={() => setModalRequestSign(false)}
        title={t("documents.requestSignature", { defaultValue: "Request signature" })}
        size="md"
      >
        <div className="mb-3">
          <label className="form-label">{t("documents.selectManager", { defaultValue: "Select manager" })}</label>
          <select
            className="form-select"
            value={selectedSignerId}
            onChange={(e) => setSelectedSignerId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">{t("common.select", { defaultValue: "Select…" })}</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.login ? `(${m.login})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.notesOptional", { defaultValue: "Notes (optional)" })}</label>
          <textarea
            className="form-control"
            rows={3}
            value={signMessage}
            onChange={(e) => setSignMessage(e.target.value)}
          />
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={() => setModalRequestSign(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button variant="secondary" disabled={!selectedSignerId} onClick={handleCreateSignatureRequest}>
            {t("documents.send", { defaultValue: "Send" })}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Upload signed version modal */}
      <Modal
        isOpen={modalUploadSigned}
        onClose={() => setModalUploadSigned(false)}
        title={t("documents.uploadSignedVersion", { defaultValue: "Upload signed version" })}
        size="md"
      >
        <div className="mb-3">
          <label className="form-label">{t("documents.selectApprovedRequest", { defaultValue: "Select approved request" })}</label>
          <select
            className="form-select"
            value={selectedApprovedReqId ?? ""}
            onChange={(e) => setSelectedApprovedReqId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t("common.select", { defaultValue: "Select…" })}</option>
            {approvedRequests.map((r: { id: number; signer_name?: string }) => (
              <option key={r.id} value={r.id}>
                #{r.id} • {r.signer_name ?? "–"}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.signToken", { defaultValue: "Sign token" })}</label>
          <input
            type="text"
            className="form-control"
            value={signToken}
            onChange={(e) => setSignToken(e.target.value)}
            placeholder={t("documents.signTokenPlaceholder", { defaultValue: "Enter token from approval email" })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.selectSignedFile", { defaultValue: "Signed file" })}</label>
          <div className="d-flex gap-2 align-items-center">
            <input
              ref={signedFileInputRef}
              type="file"
              className="form-control"
              onChange={(e) => setSignedFile(e.target.files?.[0] ?? null)}
            />
            {signedFile && (
              <Button type="button" variant="outline" size="sm" className="btn-outline-secondary" onClick={handleClearSignedFile}>
                <Icon name="x" className="me-1" />
                {t("common.remove", { defaultValue: "Remove" })}
              </Button>
            )}
          </div>
          {signedFile && <small className="text-muted d-block mt-1">{signedFile.name}</small>}
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={() => setModalUploadSigned(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant="secondary"
            disabled={!selectedApprovedReqId || !signedFile || !signToken.trim() || uploadingSigned}
            onClick={handleUploadSignedSubmit}
          >
            {uploadingSigned ? <Spinner /> : t("documents.upload", { defaultValue: "Upload" })}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add relation modal */}
      <Modal
        isOpen={modalAddRelation}
        onClose={() => setModalAddRelation(false)}
        title={t("documents.addRelation", { defaultValue: "Add relation" })}
        size="md"
      >
        <div className="mb-3">
          <label className="form-label">{t("documents.relatedDocumentId", { defaultValue: "Related document ID" })} *</label>
          <input
            type="number"
            className="form-control"
            value={relatedDocId}
            onChange={(e) => setRelatedDocId(e.target.value)}
            placeholder={t("documents.relatedDocumentIdPlaceholder", { defaultValue: "Document ID" })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">{t("documents.notesOptional", { defaultValue: "Notes (optional)" })}</label>
          <textarea
            className="form-control"
            rows={2}
            value={relationNotes}
            onChange={(e) => setRelationNotes(e.target.value)}
          />
        </div>
        <ModalFooter>
          <Button variant="outline" className="btn-outline-secondary" onClick={() => setModalAddRelation(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant="secondary"
            disabled={!relatedDocId.trim() || addingRelation}
            onClick={handleAddRelationSubmit}
          >
            {addingRelation ? <Spinner /> : t("common.add", { defaultValue: "Add" })}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default DocumentDetailPage;
