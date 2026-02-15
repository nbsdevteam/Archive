import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { handleApiError } from "@/app/adapter/api/client";
import { deleteFolder } from "@/features/folders/services/folders.api";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { useFolderAuditLogs } from "@/features/activity/hooks/useFolderAuditLogs";
import type { ActivityViewMode } from "@/features/activity/types";
import { all_routes } from "@/router/all_routes";
import { formatRelativeTime } from "@/shared/utils/format/date";
import { downloadDocumentWithToast } from "@/shared/utils/documents/downloadDocumentWithToast";
import { useAnnounce } from "@/shared/components/a11y/LiveAnnouncer";
import { useAttachmentOperations, useDocumentOperations, useSelection } from "@/shared/hooks";
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
import type { FolderDetailPageState } from "@/features/folders/types/folderDetailState";

/**
 * Composes folder-detail hooks and returns typed state contract.
 * Single source of truth for folder detail page state shape.
 */
export const useFolderDetailPageContainer = (): FolderDetailPageState => {
  const { t } = useTranslation();
  const announce = useAnnounce();
  const routes = all_routes;
  const navigate = useNavigate();

  const { folderId } = useFolderDetailIds();
  const [attachmentsDocId, setAttachmentsDocId] = useState<number | "">("");
  const [editDocumentId, setEditDocumentId] = useState<number | null>(null);

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

  const [activityViewMode, setActivityViewMode] = useState<ActivityViewMode>("timeline");
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
    folder?.department_id,
    documents.length,
    attachmentsDocId
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

  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const { currentDocument } = useDocumentStore();
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

  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false);
  const [editAttachmentId, setEditAttachmentId] = useState<number | null>(null);
  const [editAttachmentName, setEditAttachmentName] = useState("");
  const [editAttachmentDescription, setEditAttachmentDescription] = useState("");

  // Use currentDocument directly - it's already DocumentDetail with versions array
  const previewDoc = currentDocument;
  const previewFileName = previewDoc?.file_name ?? "";

  const formatDate = useCallback((dateStr?: string | null) => {
    if (!dateStr) return "–";
    try {
      return formatRelativeTime(new Date(dateStr));
    } catch {
      return "–";
    }
  }, []);

  const handleNavigateToDocument = useCallback(
    (documentId: number) => {
      navigate(routes.documentDetail.replace(":id", String(documentId)));
    },
    [navigate, routes.documentDetail]
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

  const handleViewAttachment = useCallback(
    (attachmentId: number) => {
      if (typeof attachmentsDocId === "number") {
        navigate(
          routes.documentAttachmentView
            .replace(":id", String(attachmentsDocId))
            .replace(":attachmentId", String(attachmentId))
        );
      }
    },
    [attachmentsDocId, navigate, routes.documentAttachmentView]
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
        const { fileToBase64 } = await import("@/shared/utils/files/fileToBase64");
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
      activityDocumentCount,
      activityViewMode,
      setActivityViewMode,
      refreshActivityLogs,
    },
    selection: {
      subDocSelectedIds,
      subDocsSelectionConfig,
      attachmentSelectedIds,
      attachmentsSelectionConfig,
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
      transferMode,
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
      noteImageViewerTitle: noteEditor.noteImageViewerTitle,
      noteImageViewerFilename: noteEditor.noteImageViewerFilename,
    },
  };
};
