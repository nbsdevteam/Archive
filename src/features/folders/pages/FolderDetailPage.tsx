import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import apiClient from "../../../app/adapter/api/client";
import { handleApiError } from "../../../app/adapter/api/client";
import { documentsApi } from "../../../app/adapter/api/documents.api";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { editRequestsApi } from "../../../app/adapter/api/editRequests.api";
import { getFolderWorkflow, applyFolderTransition } from "../services/folders.api";
import type { FolderWorkflowInfo } from "../services/folders.api";
import { useDocumentStore } from "../../documents/stores/documentStore";
import { useSignatureStore } from "../../signatures/stores/signatureStore";
import { FilePreview } from "../../../shared/components/FilePreview";
import { UploadDocumentSidePanel } from "../../documents/components";
import { Alert, Button, Spinner, Modal, ModalFooter, Icon } from "../../../shared/components/ui";
import { formatRelativeTime } from "../../../shared/utils/format/date";

type FolderDoc = {
  id: number;
  title: string;
  name?: string;
  barcode: string;
  document_type_name?: string;
  document_type?: { name?: string };
  upload_date?: string;
  status?: string;
};

type AttachmentRow = {
  id: number;
  name: string;
  file_name: string;
  file_size?: number;
  upload_date?: string;
};

const FolderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const routes = all_routes;
  const navigate = useNavigate();

  const [folder, setFolder] = useState<{
    id: number;
    name: string;
    code?: string;
    description?: string;
    department_id?: number;
    department_name?: string;
    folder_type?: string;
    state?: string;
    create_date?: string;
    updated_at?: string;
    updated?: string;
  } | null>(null);
  const [documents, setDocuments] = useState<FolderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attachmentsDocId, setAttachmentsDocId] = useState<number | "">("");
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const [workflowInfo, setWorkflowInfo] = useState<FolderWorkflowInfo | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const [transitionOpen, setTransitionOpen] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<{ id: number; label: string } | null>(null);
  const [transitionMessage, setTransitionMessage] = useState("");
  const [applyingTransition, setApplyingTransition] = useState(false);

  const [managers, setManagers] = useState<Array<{ id: number; name: string; login?: string }>>([]);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signatureSignerId, setSignatureSignerId] = useState<number | "">("");
  const [signatureMessage, setSignatureMessage] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editReason, setEditReason] = useState("");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadPanelLockFolderContext, setUploadPanelLockFolderContext] = useState(false);
  const [uploadPanelInitialValues, setUploadPanelInitialValues] = useState<Partial<{
    upload_kind: "main" | "sub" | "attachment";
    folder_id: number;
    department_id: number;
    target_document_id: number;
  }>>({});

  const { currentDocument, fetchDocument } = useDocumentStore();
  const { createRequest } = useSignatureStore();

  const folderId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  const docsSorted = useMemo(() => {
    return [...documents].sort((a, b) => {
      const ta = a.upload_date ? new Date(a.upload_date).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.upload_date ? new Date(b.upload_date).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
  }, [documents]);

  const mainDoc = docsSorted[0] ?? null;
  const subDocs = docsSorted.slice(1);

  const load = async () => {
    if (!folderId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await apiClient.post(`/api/folders/${folderId}/documents`, {
        jsonrpc: "2.0",
        method: "call",
        params: {},
      });
      const result = resp.data?.result ?? resp.data;
      setFolder(result?.folder ?? null);
      const docs = Array.isArray(result?.data) ? result.data : [];
      setDocuments(docs);

      if (docs.length > 0) {
        const first = [...docs].sort((a, b) => {
          const ta = a.upload_date ? new Date(a.upload_date).getTime() : Number.POSITIVE_INFINITY;
          const tb = b.upload_date ? new Date(b.upload_date).getTime() : Number.POSITIVE_INFINITY;
          return ta - tb;
        })[0];
        if (first?.id) {
          fetchDocument(first.id);
          if (attachmentsDocId === "") setAttachmentsDocId(first.id);
        }
      }
    } catch (e: unknown) {
      setError(handleApiError(e));
      setFolder(null);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflow = async (fId: number) => {
    setWorkflowError(null);
    try {
      const r = await getFolderWorkflow(fId);
      if (r.success && r.data) setWorkflowInfo(r.data);
      else setWorkflowInfo(null);
    } catch (e: unknown) {
      setWorkflowInfo(null);
      setWorkflowError((e as Error)?.message ?? "Failed to load workflow");
    }
  };

  const loadAttachments = async (documentId: number) => {
    setLoadingAttachments(true);
    try {
      const r = await documentsApi.listAttachments(documentId);
      setAttachments(r.data ?? []);
    } catch {
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  useEffect(() => {
    load();
  }, [folderId]);

  useEffect(() => {
    if (!folderId) return;
    loadWorkflow(folderId);
  }, [folderId]);

  useEffect(() => {
    if (attachmentsDocId === "" || typeof attachmentsDocId !== "number") return;
    loadAttachments(attachmentsDocId);
  }, [attachmentsDocId]);

  useEffect(() => {
    adminApi
      .getManagers(folder?.department_id)
      .then((r) => setManagers(r.data ?? []))
      .catch(() => setManagers([]));
  }, [folder?.department_id]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "–";
    try {
      return formatRelativeTime(new Date(dateStr));
    } catch {
      return "–";
    }
  };

  const handleNavigateToDocument = (documentId: number) => {
    navigate(routes.documentDetail.replace(":id", String(documentId)));
  };

  const handleUploadInFolder = () => {
    if (!folderId) return;
    const kind = documents.length === 0 ? "main" : "sub";
    setUploadPanelLockFolderContext(true);
    setUploadPanelInitialValues({
      upload_kind: kind,
      folder_id: folderId,
      department_id: folder?.department_id ?? 0,
    });
    setIsUploadOpen(true);
  };

  const handleAttachmentsDocIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAttachmentsDocId(e.target.value ? Number(e.target.value) : "");
  };

  const handleAddAttachment = () => {
    setUploadPanelLockFolderContext(true);
    setUploadPanelInitialValues({
      upload_kind: "attachment",
      target_document_id: typeof attachmentsDocId === "number" ? attachmentsDocId : 0,
    });
    setIsUploadOpen(true);
  };

  const handleDownloadMainDocument = async () => {
    if (!mainDoc) return;
    try {
      const blob = await documentsApi.downloadDocument(mainDoc.id);
      const fileName = (mainDoc as { file_name?: string }).file_name ?? mainDoc.title ?? mainDoc.name ?? "document";
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(t("documents.downloadSuccess", { defaultValue: "Download started." }));
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? t("documents.downloadFailed", { defaultValue: "Download failed." }));
    }
  };

  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    if (typeof attachmentsDocId !== "number") return;
    try {
      const blob = await documentsApi.downloadAttachment(attachmentsDocId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(t("documents.downloadSuccess", { defaultValue: "Download started." }));
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? t("documents.downloadFailed", { defaultValue: "Download failed." }));
    }
  };

  const openTransition = (transitionId: number, label: string) => {
    setTransitionTarget({ id: transitionId, label });
    setTransitionMessage("");
    setTransitionOpen(true);
  };

  const submitTransition = async () => {
    if (!folderId || !transitionTarget) return;
    setApplyingTransition(true);
    try {
      await applyFolderTransition(folderId, {
        transition_id: transitionTarget.id,
        message: transitionMessage.trim() || undefined,
      });
      toast.success(t("folders.transitionApplied", { defaultValue: "Transition applied." }));
      setTransitionOpen(false);
      setTransitionTarget(null);
      loadWorkflow(folderId);
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? t("folders.transitionFailed", { defaultValue: "Transition failed." }));
    } finally {
      setApplyingTransition(false);
    }
  };

  const openSignature = () => {
    setSignatureSignerId("");
    setSignatureMessage("");
    setSignatureOpen(true);
  };

  const submitSignature = async () => {
    if (!mainDoc || !signatureSignerId) {
      toast.error(t("folders.selectSignerError", { defaultValue: "Please select a signer." }));
      return;
    }
    try {
      await createRequest({
        document_id: mainDoc.id,
        signer_id: Number(signatureSignerId),
        message: signatureMessage.trim() || undefined,
      });
      toast.success(t("folders.signatureRequestCreated", { defaultValue: "Signature request created." }));
      setSignatureOpen(false);
      navigate(routes.signatures);
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? t("folders.signatureRequestCreateFailed", { defaultValue: "Failed to create request." }));
    }
  };

  const openEditRequest = () => {
    setEditReason("");
    setEditOpen(true);
  };

  const submitEditRequest = async () => {
    if (!mainDoc) return;
    if (!editReason.trim()) {
      toast.error(t("folders.writeEditReason", { defaultValue: "Please enter a reason." }));
      return;
    }
    try {
      const res = await editRequestsApi.createEditRequest(mainDoc.id, editReason.trim());
      if (!res.success) throw new Error("Create failed");
      toast.success(t("folders.editRequestCreated", { defaultValue: "Edit request created." }));
      setEditOpen(false);
      navigate(routes.editRequests);
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? t("folders.editRequestCreateFailed", { defaultValue: "Failed to create edit request." }));
    }
  };

  const transitions = workflowInfo?.allowed_transitions ?? [];
  const previewDoc = currentDocument as { id?: number; file_name?: string } | null;
  const previewFileName = previewDoc?.file_name ?? "";

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
            <h2 className="mb-1">{t("folders.details", { defaultValue: "Folder details" })}</h2>
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
            <Button variant="secondary" size="sm" onClick={handleUploadInFolder}>
              <Icon name="upload" className="me-1" />
              {t("folders.uploadInFolder", { defaultValue: "Upload in folder" })}
            </Button>
            <Link to={routes.folders} className="btn btn-outline-secondary btn-sm">
              {t("common.back", { defaultValue: "Back" })}
            </Link>
            <Button variant="outline" size="sm" className="btn-outline-primary" onClick={load}>
              {t("common.refresh", { defaultValue: "Refresh" })}
            </Button>
            <CollapseHeader />
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
            <Button variant="outline" size="sm" className="ms-2 btn-outline-primary" onClick={load}>
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
              <Button variant="outline" size="sm" className="btn-outline-primary" onClick={handleDownloadMainDocument}>
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
                        <Button variant="outline" size="sm" className="btn-outline-primary me-1" onClick={(e) => { e.stopPropagation(); handleDownloadMainDocument(); }}>
                          <Icon name="download" className="me-1" />
                          {t("documents.download", { defaultValue: "Download" })}
                        </Button>
                        <Button variant="outline" size="sm" className="btn-outline-primary" onClick={(e) => { e.stopPropagation(); handleNavigateToDocument(mainDoc.id); }}>
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
                          <Button variant="outline" size="sm" className="btn-outline-primary" onClick={(e) => { e.stopPropagation(); handleNavigateToDocument(d.id); }}>
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
              <Button variant="outline" size="sm" className="btn-outline-primary" onClick={handleAddAttachment}>
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
                          <Button variant="outline" size="sm" className="btn-outline-primary" onClick={() => handleDownloadAttachment(a.id, a.file_name)}>
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
              <Button variant="outline" size="sm" className="btn-outline-primary" onClick={handleDownloadMainDocument}>
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
          <textarea
            className="form-control"
            rows={3}
            value={transitionMessage}
            onChange={(e) => setTransitionMessage(e.target.value)}
          />
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
          <select
            className="form-select"
            value={signatureSignerId}
            onChange={(e) => setSignatureSignerId(e.target.value ? Number(e.target.value) : "")}
          >
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
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          load();
          setIsUploadOpen(false);
        }}
        initialValues={uploadPanelInitialValues}
        lockFolderContext={uploadPanelLockFolderContext}
      />
    </div>
  );
};

export default FolderDetailPage;
