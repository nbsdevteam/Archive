import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { handleApiError } from "../../../app/adapter/api/client";
import { documentsApi, type Document, type Attachment } from "../../../app/adapter/api/documents.api";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { editRequestsApi } from "../../../app/adapter/api/editRequests.api";
import { getFolderDocuments, getFolderWorkflow, applyFolderTransition, deleteFolder } from "../services/folders.api";
import type { FolderWorkflowInfo } from "../services/folders.api";
import type { FolderDetail } from "../types/folders.types";
import { useDocumentStore } from "../../documents/stores/documentStore";
import { useSignatureStore } from "../../signatures/stores/signatureStore";
import { useFolderAuditLogs } from "../../activity/hooks/useFolderAuditLogs";
import type { ActivityViewMode } from "../../activity/types";
import { all_routes } from "../../../router/all_routes";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import { downloadBlobAsFile } from "../../../shared/utils/files/downloadBlobAsFile";
import { useAttachmentOperations, useDocumentOperations, useSelection } from "../../../shared/hooks";
import { sortFolderDocumentsByUploadDate } from "../utils/sortFolderDocumentsByUploadDate";

export const useFolderDetailPageContainer = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const routes = all_routes;
  const navigate = useNavigate();

  const [folder, setFolder] = useState<FolderDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attachmentsDocId, setAttachmentsDocId] = useState<number | "">("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const [workflowInfo, setWorkflowInfo] = useState<FolderWorkflowInfo | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [activityViewMode, setActivityViewMode] = useState<ActivityViewMode>("table");

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

  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadPanelLockFolderContext, setUploadPanelLockFolderContext] = useState(false);
  const [uploadPanelInitialValues, setUploadPanelInitialValues] = useState<
    Partial<{
      upload_kind: "main" | "sub" | "attachment";
      folder_id: number;
      department_id: number;
      target_document_id: number;
    }>
  >({});

  const { currentDocument, fetchDocument } = useDocumentStore();
  const {
    isArchivingSingle,
    isUnarchiving,
    isTrashingSingle,
    isTrashingBatch,
    archiveSingle,
    unarchiveSingle,
    trashSingle,
    trashBatch,
  } = useDocumentOperations();
  const { createRequest } = useSignatureStore();

  const folderId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  const docsSorted = useMemo(
    () => sortFolderDocumentsByUploadDate(documents),
    [documents]
  );

  const mainDoc = docsSorted[0] ?? null;
  const subDocs = docsSorted.slice(1);
  const {
    logs: activityLogs,
    loading: activityLoading,
    error: activityError,
    documentCount: activityDocumentCount,
    refresh: refreshActivityLogs,
  } = useFolderAuditLogs(folderId, {
    enabled: Boolean(folderId),
    perPage: 50,
    maxDocuments: 20,
    concurrency: 4,
  });

  const {
    selectedIds: subDocSelectedIds,
    selectionConfig: subDocsSelectionConfig,
    clear: clearSubDocsSelection,
  } = useSelection<Document>(subDocs, (d) => d.id);

  const {
    selectedIds: attachmentSelectedIds,
    selectionConfig: attachmentsSelectionConfig,
    clear: clearAttachmentsSelection,
  } = useSelection<Attachment>(attachments, (a) => a.id);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<"docs" | "attachments" | null>(null);
  const [transferDocIds, setTransferDocIds] = useState<number[]>([]);
  const [transferAttachmentIds, setTransferAttachmentIds] = useState<number[]>([]);
  const [transferDepartmentId, setTransferDepartmentId] = useState(0);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [subDocTrashTargetId, setSubDocTrashTargetId] = useState<number | null>(null);
  const [isBatchSubDocTrashConfirmOpen, setIsBatchSubDocTrashConfirmOpen] = useState(false);
  const [attachmentTrashTargetId, setAttachmentTrashTargetId] = useState<number | null>(null);
  const [isBatchAttachmentTrashConfirmOpen, setIsBatchAttachmentTrashConfirmOpen] = useState(false);

  /** Fetches folder and its documents from API and updates local state. Call after move/trash/archive so UI matches backend. */
  const loadFolderDocuments = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getFolderDocuments(folderId);
      setFolder(result.folder ?? null);
      const docs = result.data ?? [];
      setDocuments(docs);

      if (docs.length > 0) {
        const first = sortFolderDocumentsByUploadDate(docs)[0];
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
  }, [folderId, attachmentsDocId]);

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

  const loadAttachmentsForDocument = async (documentId: number) => {
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
    loadFolderDocuments();
  }, [folderId]);

  useEffect(() => {
    if (!folderId) return;
    loadWorkflow(folderId);
  }, [folderId]);

  useEffect(() => {
    if (attachmentsDocId === "" || typeof attachmentsDocId !== "number") return;
    loadAttachmentsForDocument(attachmentsDocId);
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
      const fileName =
        mainDoc.file_name ?? mainDoc.title ?? mainDoc.name ?? "document";
      downloadBlobAsFile(blob, fileName);
      toast.success(t("documents.downloadSuccess", { defaultValue: "Download started." }));
    } catch (e: unknown) {
      toast.error((e as Error)?.message ?? t("documents.downloadFailed", { defaultValue: "Download failed." }));
    }
  };

  const handleDownloadDocument = async (documentId: number) => {
    const target = documents.find((document) => document.id === documentId);
    if (!target) return;
    try {
      const blob = await documentsApi.downloadDocument(target.id);
      const fileName = target.file_name ?? target.title ?? target.name ?? "document";
      downloadBlobAsFile(blob, fileName);
      toast.success(t("documents.downloadSuccess", { defaultValue: "Download started." }));
    } catch (e: unknown) {
      toast.error(
        (e as Error)?.message ??
          t("documents.downloadFailed", { defaultValue: "Download failed." })
      );
    }
  };

  const handleDownloadAttachment = async (attachmentId: number, fileName: string) => {
    await downloadAttachment(
      attachmentId,
      fileName,
      t("documents.downloadSuccess", { defaultValue: "Download started." })
    );
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
  const handleCloseUploadPanel = () => setIsUploadOpen(false);

  const refreshAttachmentsForCurrentDocument = useCallback(() => {
    if (typeof attachmentsDocId === "number") {
      loadAttachmentsForDocument(attachmentsDocId);
    }
  }, [attachmentsDocId]);
  const {
    isDeletingAttachment: isAttachmentTrashing,
    downloadAttachment,
    deleteAttachments,
  } = useAttachmentOperations(
    typeof attachmentsDocId === "number" ? attachmentsDocId : null,
    {
      onSuccess: refreshAttachmentsForCurrentDocument,
    }
  );

  const handleArchiveFolderDocument = useCallback(
    async (documentId: number) => {
      await archiveSingle(documentId, {
        successMessage: t("documents.archived", { defaultValue: "Document archived." }),
        errorMessage: t("documents.archiveFailed", { defaultValue: "Archive failed." }),
        onSuccess: loadFolderDocuments,
      });
    },
    [archiveSingle, loadFolderDocuments, t]
  );

  const handleUnarchiveFolderDocument = useCallback(
    async (documentId: number) => {
      await unarchiveSingle(documentId, {
        successMessage: t("documents.unarchived", { defaultValue: "Document unarchived." }),
        errorMessage: t("documents.unarchiveFailed", { defaultValue: "Unarchive failed." }),
        onSuccess: loadFolderDocuments,
      });
    },
    [loadFolderDocuments, t, unarchiveSingle]
  );

  const handleOpenSubDocTrashConfirm = useCallback((documentId: number) => {
    setSubDocTrashTargetId(documentId);
  }, []);

  const handleCloseSubDocTrashConfirm = useCallback(() => {
    if (!isTrashingSingle) {
      setSubDocTrashTargetId(null);
    }
  }, [isTrashingSingle]);

  const handleConfirmSubDocTrash = useCallback(async () => {
    if (!subDocTrashTargetId) return;
    const didTrash = await trashSingle(subDocTrashTargetId, {
      successMessage: t("documents.trashed", { defaultValue: "Document moved to trash." }),
      errorMessage: t("documents.trashFailed", { defaultValue: "Failed to move to trash." }),
      onSuccess: loadFolderDocuments,
    });
    if (didTrash) {
      clearSubDocsSelection();
      setSubDocTrashTargetId(null);
    }
  }, [clearSubDocsSelection, loadFolderDocuments, subDocTrashTargetId, t, trashSingle]);

  const handleOpenBatchSubDocTrashConfirm = useCallback(() => {
    if (subDocSelectedIds.length > 0) {
      setIsBatchSubDocTrashConfirmOpen(true);
    }
  }, [subDocSelectedIds.length]);

  const handleCloseBatchSubDocTrashConfirm = useCallback(() => {
    if (!isTrashingBatch) {
      setIsBatchSubDocTrashConfirmOpen(false);
    }
  }, [isTrashingBatch]);

  const handleConfirmBatchSubDocTrash = useCallback(async () => {
    const ids = subDocSelectedIds.map((id) => Number(id));
    if (ids.length === 0) return;
    const didTrash = await trashBatch(ids, {
      successMessage: t("documents.batchTrashed", {
        defaultValue: "{{count}} document(s) moved to trash.",
        count: ids.length,
      }),
      errorMessage: t("documents.batchTrashFailed", {
        defaultValue: "Failed to move documents to trash.",
      }),
      onSuccess: loadFolderDocuments,
    });
    if (didTrash) {
      clearSubDocsSelection();
      setIsBatchSubDocTrashConfirmOpen(false);
    }
  }, [clearSubDocsSelection, loadFolderDocuments, subDocSelectedIds, t, trashBatch]);

  const trashAttachmentsByIds = useCallback(
    async (attachmentIds: number[]) => {
      if (attachmentIds.length === 0) return false;
      return deleteAttachments(attachmentIds);
    },
    [deleteAttachments]
  );

  const handleOpenAttachmentTrashConfirm = useCallback((attachmentId: number) => {
    setAttachmentTrashTargetId(attachmentId);
  }, []);

  const handleCloseAttachmentTrashConfirm = useCallback(() => {
    if (!isAttachmentTrashing) {
      setAttachmentTrashTargetId(null);
    }
  }, [isAttachmentTrashing]);

  const handleConfirmAttachmentTrash = useCallback(async () => {
    if (!attachmentTrashTargetId) return;
    const didTrash = await trashAttachmentsByIds([attachmentTrashTargetId]);
    if (didTrash) {
      clearAttachmentsSelection();
      setAttachmentTrashTargetId(null);
    }
  }, [attachmentTrashTargetId, clearAttachmentsSelection, trashAttachmentsByIds]);

  const handleOpenBatchAttachmentTrashConfirm = useCallback(() => {
    if (attachmentSelectedIds.length > 0) {
      setIsBatchAttachmentTrashConfirmOpen(true);
    }
  }, [attachmentSelectedIds.length]);

  const handleCloseBatchAttachmentTrashConfirm = useCallback(() => {
    if (!isAttachmentTrashing) {
      setIsBatchAttachmentTrashConfirmOpen(false);
    }
  }, [isAttachmentTrashing]);

  const handleConfirmBatchAttachmentTrash = useCallback(async () => {
    const ids = attachmentSelectedIds.map((id) => Number(id));
    if (ids.length === 0) return;
    const didTrash = await trashAttachmentsByIds(ids);
    if (didTrash) {
      clearAttachmentsSelection();
      setIsBatchAttachmentTrashConfirmOpen(false);
    }
  }, [attachmentSelectedIds, clearAttachmentsSelection, trashAttachmentsByIds]);

  /** Opens transfer modal for selected sub-documents. Uses folder/mainDoc department when doc.department_id is missing (e.g. folder documents API may omit it). */
  const openTransferDocs = useCallback(
    (ids: number[]) => {
      if (ids.length === 0) return;
      const folderDeptId = folder?.department_id ?? mainDoc?.department_id;
      const depts = [
        ...new Set(
          ids
            .map((id) => subDocs.find((d) => d.id === id)?.department_id ?? folderDeptId)
            .filter((x): x is number => x != null && x > 0)
        ),
      ];
      if (depts.length > 1) {
        toast.error(t("folders.transferSameDepartment", { defaultValue: "Selected documents must be from the same department." }));
        return;
      }
      const departmentId = depts[0] ?? folderDeptId ?? 0;
      if (!departmentId) {
        toast.error(t("folders.transferFailed", { defaultValue: "Transfer failed." }));
        return;
      }
      setTransferDocIds(ids);
      setTransferDepartmentId(departmentId);
      setTransferMode("docs");
      setTransferModalOpen(true);
    },
    [subDocs, folder?.department_id, mainDoc?.department_id, t]
  );

  const openTransferAttachments = useCallback(
    (ids: number[]) => {
      if (ids.length === 0) return;
      const deptId = mainDoc?.department_id ?? folder?.department_id ?? 0;
      setTransferDepartmentId(deptId);
      setTransferAttachmentIds(ids);
      setTransferMode("attachments");
      setTransferModalOpen(true);
    },
    [mainDoc?.department_id, folder?.department_id]
  );

  const closeTransferModal = useCallback(() => {
    if (!transferSubmitting) {
      setTransferModalOpen(false);
      setTransferMode(null);
      setTransferDocIds([]);
      setTransferAttachmentIds([]);
      setTransferDepartmentId(0);
    }
  }, [transferSubmitting]);

  /** After batch move, refreshes source folder list from API so UI no longer shows moved docs in the current folder. */
  const handleTransferConfirm = useCallback(
    async (targetFolderId: number) => {
      setTransferSubmitting(true);
      try {
        if (transferMode === "docs") {
          if (mainDoc && transferDocIds.includes(mainDoc.id)) {
            throw new Error(
              t("folders.transferMainDocumentNotAllowed", {
                defaultValue: "Main document cannot be transferred.",
              })
            );
          }
          await documentsApi.batchMoveDocumentsToFolder(transferDocIds, targetFolderId);
          toast.success(t("folders.transferSuccess", { defaultValue: "Transferred successfully." }));
          clearSubDocsSelection();
          await loadFolderDocuments();
        } else if (transferMode === "attachments") {
          const sourceDocId = typeof attachmentsDocId === "number" ? attachmentsDocId : 0;
          if (!sourceDocId) {
            toast.error(t("folders.transferFailed", { defaultValue: "Transfer failed." }));
            return;
          }

          await documentsApi.batchMoveDocumentsToFolder(transferAttachmentIds, targetFolderId);
          toast.success(t("folders.transferSuccess", { defaultValue: "Transferred successfully." }));
          clearAttachmentsSelection();
          refreshAttachmentsForCurrentDocument();
          await loadFolderDocuments();
        }
        setTransferModalOpen(false);
        setTransferMode(null);
        setTransferDocIds([]);
        setTransferAttachmentIds([]);
        setTransferDepartmentId(0);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : handleApiError(e);
        toast.error(message || t("folders.transferFailed", { defaultValue: "Transfer failed." }));
      } finally {
        setTransferSubmitting(false);
      }
    },
    [
      transferMode,
      transferDocIds,
      transferAttachmentIds,
      attachmentsDocId,
      mainDoc,
      t,
      clearSubDocsSelection,
      clearAttachmentsSelection,
      loadFolderDocuments,
      refreshAttachmentsForCurrentDocument,
    ]
  );

  const handleOpenEditFolder = useCallback(() => setIsEditFolderOpen(true), []);
  const handleCloseEditFolder = useCallback(() => setIsEditFolderOpen(false), []);
  const handleEditFolderSuccess = useCallback(() => {
    loadFolderDocuments();
  }, [folderId]);

  const handleOpenDeleteFolder = useCallback(() => setIsDeleteConfirmOpen(true), []);
  const handleCloseDeleteConfirm = useCallback(() => {
    if (!isDeletingFolder) setIsDeleteConfirmOpen(false);
  }, [isDeletingFolder]);
  const handleConfirmDeleteFolder = useCallback(async () => {
    if (!folderId) return;
    setIsDeletingFolder(true);
    try {
      const result = await deleteFolder(folderId);
      if (!result?.ok) {
        toast.error(t("folders.deleteFailed"));
        return;
      }
      toast.success(t("folders.folderDeleted"));
      setIsDeleteConfirmOpen(false);
      navigate(routes.folders);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : handleApiError(e);
      toast.error(message || t("folders.deleteFailed"));
    } finally {
      setIsDeletingFolder(false);
    }
  }, [folderId, t, navigate, routes.folders]);

  return {
    t,
    routes,
    folderId,
    folder,
    documents,
    docsSorted,
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
    setIsUploadOpen,
    subDocsSelectionConfig,
    subDocSelectedIds,
    clearSubDocsSelection,
    subDocTrashTargetId,
    isSubDocArchiving: isArchivingSingle,
    isSubDocUnarchiving: isUnarchiving,
    isSubDocTrashing: isTrashingSingle,
    isBatchSubDocTrashConfirmOpen,
    isBatchSubDocTrashing: isTrashingBatch,
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
    activityLogs,
    activityLoading,
    activityError,
    activityDocumentCount,
    refreshActivityLogs,
    activityViewMode,
    setActivityViewMode,
  };
};
