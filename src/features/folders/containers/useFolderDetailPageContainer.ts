import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { handleApiError } from "@/app/adapter/api/client";
import { deleteFolder } from "@/features/folders/services/folders.api";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { useFolderAuditLogs } from "@/features/activity/hooks/useFolderAuditLogs";
import type { ActivityViewMode } from "@/features/activity/types";
import { all_routes } from "@/router/all_routes";
import { downloadDocumentWithToast } from "@/shared/utils/documents/downloadDocumentWithToast";
import { fileToBase64 } from "@/shared/utils/files/fileToBase64";
import { navigateToDocumentDetail, navigateToAttachmentView } from "@/shared/utils/navigation/navigateWithState";
import { useAnnounce } from "@/shared/components/a11y/LiveAnnouncer";
import { useDocumentOperations } from "@/features/documents/hooks/useDocumentOperations";
import { useAttachmentOperations, useSelection } from "@/shared/hooks";
import { getAllowedBatchActionsForDocumentsSelection } from "@/shared/services/documentBatchActionsService";
import { useCapabilityPermissions } from "@/shared/hooks/useCapabilityPermissions";
import { gateBatchActionsForDelete } from "@/shared/utils/capabilityGating";
import { useNotes, useNoteMutations } from "@/features/notes/hooks/useNotes";
import { useNoteEditorHandlers } from "@/features/notes/hooks/useNoteEditorHandlers";
import type { Document, Attachment } from "@/app/adapter/api/documents.api";
import {
  useFolderDetailIds,
  useFolderDetailData,
  useFolderAttachments,
  useFolderManagers,
  useFolderUploadPanel,
  useFolderSignaturesAndEditRequests,
  useFolderTransfer,
} from "@/features/folders/hooks/folderDetail";
import type { FolderUploadContextHint } from "@/features/folders/hooks/folderDetail/useFolderUploadPanel";
import type { FolderDetailPageState, FolderDetailModals } from "@/features/folders/types/folderDetailState";

/**
 * Orchestrator for the Folder detail page: composes data (folder, documents, attachments, notes, activity),
 * selection (sub-docs + attachments), transfer/upload/signatures/edit-requests, and all action handlers.
 * Single source of truth for FolderDetailPageState; each concern is delegated to a dedicated sub-hook.
 */
export const useFolderDetailPageContainer = (): FolderDetailPageState => {
  const [attachmentsDocId, setAttachmentsDocId] = useState<number | "">("");
  const [editDocumentId, setEditDocumentId] = useState<number | null>(null);
  const [activityViewMode, setActivityViewMode] = useState<ActivityViewMode>("timeline");
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false);
  const [editAttachmentId, setEditAttachmentId] = useState<number | null>(null);
  const [editAttachmentName, setEditAttachmentName] = useState("");
  const [editAttachmentDescription, setEditAttachmentDescription] = useState("");

  const { t } = useTranslation();
  const { canDeleteFiles } = useCapabilityPermissions();
  const announce = useAnnounce();
  const routes = all_routes;
  const navigate = useNavigate();
  const { folderId, prefetchedFolder } = useFolderDetailIds();

  const {
    folder,
    documents,
    docsSorted,
    mainDoc,
    subDocs,
    loading,
    error,
    loadFolderDocuments,
  } = useFolderDetailData(folderId, attachmentsDocId, setAttachmentsDocId);

  const {
    attachments,
    loadingAttachments,
    loadAttachmentsForDocument,
    handleAttachmentsDocIdChange,
  } = useFolderAttachments(attachmentsDocId, setAttachmentsDocId);

  const { managers } = useFolderManagers(folder?.department_id);

  const {
    logs: activityLogs,
    loading: activityLoading,
    error: activityError,
    refresh: refreshActivityLogs,
  } = useFolderAuditLogs(folderId, {
    enabled: Boolean(folderId),
    perPage: 50,
  });

  /** Selection state for sub-documents table (ids, config for DataTable, clear). */
  const {
    selectedIds: subDocSelectedIds,
    selectionConfig: subDocsSelectionConfig,
    clear: clearSubDocsSelection,
  } = useSelection<Document>(subDocs, (d) => d.id);

  /** Selection state for attachments list (ids, config, clear). */
  const {
    selectedIds: attachmentSelectedIds,
    selectionConfig: attachmentsSelectionConfig,
    clear: clearAttachmentsSelection,
  } = useSelection<Attachment>(attachments, (a) => a.id);

  /** Batch action visibility for sub-docs: shared service intersection; drives sub-docs toolbar batch buttons. */
  const subDocsBatchActions = useMemo(
    () =>
      gateBatchActionsForDelete(
        getAllowedBatchActionsForDocumentsSelection(
          subDocs,
          subDocSelectedIds.map((id) => Number(id)),
        ),
        canDeleteFiles,
      ),
    [subDocs, subDocSelectedIds, canDeleteFiles],
  );

  const {
    notes,
    loading: loadingNotes,
    error: notesError,
    refresh: refreshNotes,
  } = useNotes({
    folderId: folderId ?? undefined,
    autoLoad: Boolean(folderId),
  });

  const {
    create: createNote,
    update: updateNote,
    remove: deleteNote,
    isCreating: isCreatingNote,
    isUpdating: isUpdatingNote,
    isDeleting: isDeletingNote,
  } = useNoteMutations();

  const noteEditor = useNoteEditorHandlers({
    refreshNotes,
    createNote,
    updateNote,
    deleteNote,
    isCreating: isCreatingNote,
    isUpdating: isUpdatingNote,
    isDeleting: isDeletingNote,
    createContext:
      folderId != null
        ? { folder_id: folderId, department_id: folder?.department_id }
        : undefined,
  });

  const refreshAttachmentsForCurrentDocument = useCallback(() => {
    if (typeof attachmentsDocId === "number") {
      loadAttachmentsForDocument(attachmentsDocId);
    }
  }, [attachmentsDocId, loadAttachmentsForDocument]);

  const {
    transferModalOpen,
    transferMode,
    transferDocIds,
    transferAttachmentIds,
    transferDepartmentId,
    transferSubmitting,
    openTransferDocs,
    openTransferAttachments,
    closeTransferModal,
    handleTransferConfirm,
  } = useFolderTransfer(
    mainDoc,
    subDocs,
    folder?.department_id,
    attachmentsDocId,
    loadFolderDocuments,
    clearSubDocsSelection,
    clearAttachmentsSelection,
    refreshAttachmentsForCurrentDocument
  );

  /** Full GET /documents/:id payload (includes company_name); list row `mainDoc` may omit it until fetch completes. */
  const { currentDocument } = useDocumentStore();

  const folderUploadHint = useMemo((): FolderUploadContextHint | null => {
    if (folderId == null) return null;
    const mainDetail = mainDoc && currentDocument?.id === mainDoc.id ? currentDocument : null;
    
    // Priority: mainDetail > mainDoc > folder (API) > prefetchedFolder (navigation state)
    const companyIdRaw = 
      mainDetail?.company_id ?? 
      mainDoc?.company_id ?? 
      folder?.company_id ?? 
      prefetchedFolder?.company_id;
    const companyId =
      typeof companyIdRaw === "number" && !Number.isNaN(companyIdRaw) && companyIdRaw >= 1 ? companyIdRaw : undefined;
    
    const companyNameRaw = 
      mainDetail?.company_name ?? 
      mainDoc?.company_name ?? 
      folder?.company_name ?? 
      prefetchedFolder?.company_name;
    const companyName =
      typeof companyNameRaw === "string" && companyNameRaw.trim() !== "" ? companyNameRaw.trim() : undefined;
    
    const folderName =
      folder?.name?.trim() ||
      (typeof mainDetail?.folder_name === "string" ? mainDetail.folder_name.trim() : "") ||
      (typeof mainDoc?.folder_name === "string" ? mainDoc.folder_name.trim() : "") ||
      prefetchedFolder?.name?.trim() ||
      undefined;
    const folderCode = folder?.code?.trim() || prefetchedFolder?.code?.trim() || undefined;

    if (import.meta.env.DEV) {
      console.log("[useFolderDetailPageContainer] folderUploadHint result:", {
        folder_company_id: companyId,
        folder_company_name: companyName,
        folder_name: folderName,
        folder_code: folderCode,
      });
      console.log("[useFolderDetailPageContainer] Company sources:", {
        fromPrefetchedNav: prefetchedFolder?.company_name,
        fromFolderAPI: folder?.company_name,
        fromMainDoc: mainDoc?.company_name,
      });
    }

    return {
      ...(companyId != null && { folder_company_id: companyId }),
      ...(companyName != null && { folder_company_name: companyName }),
      ...(folderName != null && folderName !== "" && { folder_name: folderName }),
      ...(folderCode != null && folderCode !== "" && { folder_code: folderCode }),
    };
  }, [
    folderId,
    mainDoc,
    currentDocument?.id,
    currentDocument?.company_id,
    currentDocument?.company_name,
    currentDocument?.folder_name,
    mainDoc?.company_id,
    mainDoc?.company_name,
    mainDoc?.folder_name,
    folder?.company_id,
    folder?.company_name,
    folder?.name,
    folder?.code,
    prefetchedFolder?.company_id,
    prefetchedFolder?.company_name,
    prefetchedFolder?.name,
    prefetchedFolder?.code,
  ]);

  const {
    isUploadOpen,
    uploadPanelLockFolderContext,
    uploadPanelInitialValues,
    handleUploadInFolder,
    handleAddAttachment,
    handleCloseUploadPanel,
    setIsUploadOpen,
  } = useFolderUploadPanel(
    folderId,
    folder?.department_id ?? mainDoc?.department_id,
    documents.length,
    attachmentsDocId,
    folderUploadHint
  );

  const {
    signatureOpen,
    signatureSignerId,
    signatureMessage,
    setSignatureOpen,
    setSignatureSignerId,
    setSignatureMessage,
    editOpen,
    editReason,
    setEditOpen,
    setEditReason,
    openSignature,
    submitSignature,
    openEditRequest,
    submitEditRequest,
  } = useFolderSignaturesAndEditRequests(mainDoc, {
    signatures: routes.signatures,
    editRequests: routes.editRequests,
  });

  const {
    isArchiving,
    isUnarchiving,
    isTrashing,
    archiveDocument,
    unarchiveDocument,
    trashDocument,
  } = useDocumentOperations();

  const {
    isDeletingAttachment: isAttachmentTrashing,
    isUpdatingAttachment,
    downloadAttachment,
    deleteAttachments,
    updateAttachment,
  } = useAttachmentOperations(
    typeof attachmentsDocId === "number" ? attachmentsDocId : null,
    { onSuccess: refreshAttachmentsForCurrentDocument }
  );

  // Use currentDocument directly - it's already DocumentDetail with versions array
  const previewDoc = currentDocument;
  const previewFileName = previewDoc?.file_name ?? "";

  /** Dates are already in Arabia Standard Time from the API. */
  const formatDate = useCallback<(date?: string | null) => string>((dateStr) => (dateStr?.trim() ? dateStr : "–"), []);

  /** Navigate to document detail; pass prefetched document in state when it matches to avoid duplicate API call. */
  const handleNavigateToDocument = useCallback(
    (documentId: number) => {
      navigateToDocumentDetail(navigate, routes.documentDetail, documentId, {
        prefetchedDocument: previewDoc,
        prefetchedFrom: "folderDetail",
      });
    },
    [navigate, routes.documentDetail, previewDoc]
  );

  const handleDownloadMainDocument = useCallback(async () => {
    if (!mainDoc) return;
    const fileName = mainDoc.file_name ?? mainDoc.title ?? mainDoc.name ?? "document";
    await downloadDocumentWithToast(mainDoc.id, fileName, t, announce);
  }, [mainDoc, t, announce]);

  const handleDownloadDocument = useCallback(
    async (documentId: number) => {
      const target = documents.find((d) => d.id === documentId);
      if (!target) return;
      const fileName = target.file_name ?? target.title ?? target.name ?? "document";
      await downloadDocumentWithToast(target.id, fileName, t, announce);
    },
    [documents, t, announce]
  );

  const handleDownloadAttachment = useCallback(
    async (attachmentId: number, fileName: string) => {
      await downloadAttachment(
        attachmentId,
        fileName,
        t("documents.downloadSuccess", { defaultValue: "Download started." })
      );
    },
    [downloadAttachment, t]
  );

  const handleArchiveFolderDocument = useCallback(
    async (documentId: number) => {
      await archiveDocument(documentId, {
        successMessage: t("documents.archived", { defaultValue: "Document archived." }),
        errorMessage: t("documents.archiveFailed", { defaultValue: "Archive failed." }),
        onSuccess: loadFolderDocuments,
      });
    },
    [archiveDocument, loadFolderDocuments, t]
  );

  const handleUnarchiveFolderDocument = useCallback(
    async (documentId: number) => {
      await unarchiveDocument(documentId, {
        successMessage: t("documents.unarchived", { defaultValue: "Document unarchived." }),
        errorMessage: t("documents.unarchiveFailed", { defaultValue: "Unarchive failed." }),
        onSuccess: loadFolderDocuments,
      });
    },
    [loadFolderDocuments, t, unarchiveDocument]
  );

  const confirmSubDocTrash = useCallback(
    async (documentId: number) => {
      await trashDocument(documentId, {
        successMessage: t("documents.trashed", { defaultValue: "Document moved to trash." }),
        errorMessage: t("documents.trashFailed", { defaultValue: "Failed to move to trash." }),
        onSuccess: loadFolderDocuments,
      });
      clearSubDocsSelection();
    },
    [clearSubDocsSelection, loadFolderDocuments, t, trashDocument]
  );

  const confirmBatchSubDocTrash = useCallback(async () => {
    const ids = subDocSelectedIds.map((id) => Number(id));
    if (ids.length === 0) return;
    const didTrash = await trashDocument(ids, {
      successMessage: t("documents.batchTrashed", {
        defaultValue: "{{count}} document(s) moved to trash.",
        count: ids.length,
      }),
      errorMessage: t("documents.batchTrashFailed", {
        defaultValue: "Failed to move documents to trash.",
      }),
      onSuccess: loadFolderDocuments,
    });
    if (didTrash) clearSubDocsSelection();
  }, [clearSubDocsSelection, loadFolderDocuments, subDocSelectedIds, t, trashDocument]);

  const trashAttachmentsByIds = useCallback(
    async (attachmentIds: number[]) => {
      if (attachmentIds.length === 0) return false;
      return deleteAttachments(attachmentIds);
    },
    [deleteAttachments]
  );

  const confirmAttachmentTrash = useCallback(
    async (attachmentId: number) => {
      const didTrash = await trashAttachmentsByIds([attachmentId]);
      if (didTrash) clearAttachmentsSelection();
    },
    [clearAttachmentsSelection, trashAttachmentsByIds]
  );

  const confirmBatchAttachmentTrash = useCallback(async () => {
    const ids = attachmentSelectedIds.map((id) => Number(id));
    if (ids.length === 0) return;
    const didTrash = await trashAttachmentsByIds(ids);
    if (didTrash) clearAttachmentsSelection();
  }, [attachmentSelectedIds, clearAttachmentsSelection, trashAttachmentsByIds]);

  /** Navigate to attachment view; pass doc title and attachments list to avoid duplicate API calls. */
  const handleViewAttachment = useCallback(
    (attachmentId: number) => {
      if (typeof attachmentsDocId !== "number") return;
      const title = previewDoc?.id === attachmentsDocId ? (previewDoc.title ?? previewDoc.name) : undefined;
      navigateToAttachmentView(navigate, routes.documentAttachmentView, attachmentsDocId, attachmentId, {
        prefetchedDocTitle: title ?? null,
        prefetchedAttachments: attachments,
        prefetchedFrom: "folderDetail",
      });
    },
    [attachmentsDocId, navigate, previewDoc, attachments, routes.documentAttachmentView]
  );

  /** Clears edit state so the attachment sidebar shows add form. */
  const clearEditAttachmentState = useCallback(() => {
    setEditAttachmentId(null);
    setEditAttachmentName("");
    setEditAttachmentDescription("");
  }, []);

  /** Closes the attachment sidebar and clears edit state; no-op while update is in progress. */
  const handleCloseEditAttachment = useCallback(() => {
    if (!isUpdatingAttachment) {
      setIsAttachmentPanelOpen(false);
      setEditAttachmentId(null);
      setEditAttachmentName("");
      setEditAttachmentDescription("");
    }
  }, [isUpdatingAttachment]);

  /** Opens the attachment sidebar in edit mode for the given attachment’s name and description. */
  const handleOpenEditAttachment = useCallback((attachmentId: number) => {
    const target = attachments.find((a) => a.id === attachmentId);
    if (!target) return;
    setEditAttachmentId(target.id);
    setEditAttachmentName(target.name ?? "");
    setEditAttachmentDescription(target.description ?? "");
    setIsAttachmentPanelOpen(true);
  }, [attachments]);

  /** Opens the attachment sidebar in add mode (clears edit state). */
  const openAddAttachmentPanel = useCallback(() => {
    clearEditAttachmentState();
    setIsAttachmentPanelOpen(true);
  }, [clearEditAttachmentState]);

  /** Closes the attachment sidebar and clears edit state. */
  const handleCloseAttachmentPanel = useCallback(() => {
    handleCloseEditAttachment();
  }, [handleCloseEditAttachment]);

  /** Saves attachment (name/description and optional replace file) and closes sidebar on success. */
  const handleConfirmEditAttachment = useCallback(
    async (replaceFile?: File | null) => {
      if (!editAttachmentId || typeof attachmentsDocId !== "number") return;
      const name = String(editAttachmentName ?? "").trim() || undefined;
      const description = String(editAttachmentDescription ?? "").trim() || null;
      const payload: { name?: string; description?: string | null; file_data?: string; file_name?: string } = {
        name,
        description,
      };
      if (replaceFile instanceof File) {
        payload.file_data = await fileToBase64(replaceFile);
        payload.file_name = replaceFile.name;
      }
      const didUpdate = await updateAttachment(editAttachmentId, payload);
      if (didUpdate) handleCloseEditAttachment();
    },
    [editAttachmentId, editAttachmentName, editAttachmentDescription, attachmentsDocId, updateAttachment, handleCloseEditAttachment]
  );

  const handleOpenEditFolder = useCallback(() => setIsEditFolderOpen(true), []);
  const handleCloseEditFolder = useCallback(() => setIsEditFolderOpen(false), []);
  const handleEditFolderSuccess = useCallback(() => {
    loadFolderDocuments();
  }, [loadFolderDocuments]);

  const handleOpenEditDocument = useCallback((documentId: number) => setEditDocumentId(documentId), []);
  const handleCloseEditDocument = useCallback(() => setEditDocumentId(null), []);
  const handleEditDocumentSuccess = useCallback(() => {
    loadFolderDocuments();
    setEditDocumentId(null);
  }, [loadFolderDocuments]);

  const confirmDeleteFolder = useCallback(async () => {
    if (!folderId) return;
    try {
      const result = await deleteFolder(folderId);
      if (!result?.ok) {
        toast.error(t("folders.deleteFailed"));
        throw new Error("Delete failed");
      }
      toast.success(t("folders.folderDeleted"));
      navigate(routes.folders);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : handleApiError(e);
      toast.error(message || t("folders.deleteFailed"));
      throw e;
    }
  }, [folderId, t, navigate, routes.folders]);

  const handleLoadNotes = useCallback(() => {
    if (folderId) refreshNotes();
  }, [folderId, refreshNotes]);

  return {
    t,
    routes,
    data: {
      folderId,
      folder,
      documents,
      docsSorted,
      mainDoc,
      subDocs,
      attachmentsDocId,
      attachments,
      managers,
      notes,
      previewDoc,
      previewFileName,
    },
    loadingState: {
      loading,
      loadingAttachments,
      activityLoading,
      loadingNotes,
      isSubDocArchiving: isArchiving,
      isSubDocUnarchiving: isUnarchiving,
      isSubDocTrashing: isTrashing,
      isAttachmentTrashing,
      isUpdatingAttachment,
      transferSubmitting,
      isCreatingNote: noteEditor.isCreatingNote,
      isUpdatingNote: noteEditor.isUpdatingNote,
      isDeletingNote: noteEditor.isDeletingNote,
    },
    errors: {
      main: error,
      activityError,
      notesError,
    },
    activity: {
      activityLogs,
      activityLoading,
      activityError,
      activityDocumentCount: documents.length,
      activityViewMode,
      setActivityViewMode,
      refreshActivityLogs,
    },
    selection: {
      subDocSelectedIds,
      subDocsBatchActions,
      subDocsSelectionConfig,
      attachmentSelectedIds,
      attachmentsSelectionConfig,
      canDeleteFiles,
    },
    actions: {
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
      setIsUploadOpen,
      clearSubDocsSelection,
      confirmSubDocTrash,
      confirmBatchSubDocTrash,
      openTransferDocs,
      clearAttachmentsSelection,
      confirmAttachmentTrash,
      confirmBatchAttachmentTrash,
      openTransferAttachments,
      handleViewAttachment,
      handleOpenEditAttachment,
      handleCloseEditAttachment,
      handleCloseAttachmentPanel,
      openAddAttachmentPanel,
      setEditAttachmentName,
      setEditAttachmentDescription,
      handleConfirmEditAttachment,
      closeTransferModal,
      handleTransferConfirm,
      handleOpenEditFolder,
      handleCloseEditFolder,
      handleEditFolderSuccess,
      handleOpenEditDocument,
      handleCloseEditDocument,
      handleEditDocumentSuccess,
      confirmDeleteFolder,
      handleLoadNotes,
      handleCreateNote: noteEditor.handleCreateNote,
      handleEditNote: noteEditor.handleEditNote,
      handleCloseNoteEditor: noteEditor.handleCloseNoteEditor,
      handleSaveNote: noteEditor.handleSaveNote,
      confirmDeleteNote: noteEditor.confirmDeleteNote,
      handleViewNoteImage: noteEditor.handleViewNoteImage,
      handleCloseNoteImageViewer: noteEditor.handleCloseNoteImageViewer,
    },
    modals: {
      signatureOpen,
      signatureSignerId,
      signatureMessage,
      editOpen,
      editReason,
      isEditFolderOpen,
      editDocumentId,
      isUploadOpen,
      uploadPanelInitialValues,
      uploadPanelLockFolderContext,
      transferModalOpen,
      transferMode: transferMode as FolderDetailModals["transferMode"],
      transferDocIds,
      transferAttachmentIds,
      transferDepartmentId,
      isAttachmentPanelOpen,
      editAttachmentId,
      editAttachmentName,
      editAttachmentDescription,
      isNotesEditorOpen: noteEditor.isNotesEditorOpen,
      editingNote: noteEditor.editingNote,
      noteImageViewerId: noteEditor.noteImageViewerId,
      noteImageViewerTitle: noteEditor.noteImageViewerTitle ?? "",
      noteImageViewerFilename: noteEditor.noteImageViewerFilename ?? "",
    },
  };
};
