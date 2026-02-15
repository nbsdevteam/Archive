import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { all_routes } from "@/router/all_routes";
import { useDocumentOperations } from "@/shared/hooks";
import { convertToArabianStandardTime } from "@/shared/utils/format/date";
import { useNotes, useNoteMutations } from "@/features/notes/hooks/useNotes";
import { useNoteEditorHandlers } from "@/features/notes/hooks/useNoteEditorHandlers";
import {
  useDocumentDetailIds,
  useDocumentDetailData,
  useDocumentTabs,
  useDocumentAudit,
  useDocumentManagers,
  useDocumentAttachments,
  useDocumentVersions,
  useDocumentOcr,
  useDocumentRelations,
  useDocumentSignatures,
} from "@/features/documents/hooks/documentDetail";
import type { DocumentDetailPageState } from "@/features/documents/types/documentDetailState";

/**
 * Composes document-detail hooks and returns typed state contract.
 * Single source of truth for document detail page state shape.
 */
export const useDocumentDetailPageContainer = (): DocumentDetailPageState => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routes = all_routes;
  const [editDocumentId, setEditDocumentId] = useState<number | null>(null);

  const { docId } = useDocumentDetailIds();
  const {
    doc,
    title,
    documentTypeName,
    departmentName,
    uploaderName,
    versions,
    tags,
    ocr,
    ocrStatus,
    fileName,
    isOcrSupported,
    latestVersionId,
    isTrashed,
    isArchived,
    isLoading,
    storeError,
    fetchDocument,
  } = useDocumentDetailData(docId);

  const handleOpenEdit = useCallback(() => {
    if (docId != null) setEditDocumentId(docId);
  }, [docId]);
  const handleCloseEdit = useCallback(() => setEditDocumentId(null), []);
  const handleEditSuccess = useCallback(() => {
    if (docId != null) fetchDocument(docId);
    setEditDocumentId(null);
  }, [docId, fetchDocument]);

  const { tabs, activeTab, setActiveTab } = useDocumentTabs(t);
  const {
    auditLogs,
    loadingAudit,
    auditError,
    auditRefresh,
    activityViewMode,
    setActivityViewMode,
  } = useDocumentAudit(docId, activeTab);

  const { managers } = useDocumentManagers(doc?.department_id);

  const {
    attachments,
    loadingAttachments,
    refreshAttachments,
    attachmentSelectedIds,
    attachmentSelectionConfig,
    clearAttachmentSelection,
    downloadAttachment,
    deleteAttachment,
    deleteAttachments,
    isDeletingAttachment,
    isUpdatingAttachment,
    editAttachmentId,
    editAttachmentName,
    editAttachmentDescription,
    setEditAttachmentName,
    setEditAttachmentDescription,
    handleOpenEditAttachment: openEditAttachmentState,
    handleCloseEditAttachment,
    handleConfirmEditAttachment,
    clearEditAttachmentState,
  } = useDocumentAttachments(docId, activeTab, {
    onEditSuccess: () => setIsAddAttachmentPanelOpen(false),
  });

  const {
    modalUploadVersion,
    setModalUploadVersion,
    uploadVersionFile,
    setUploadVersionFile,
    uploadVersionUnlockToken,
    setUploadVersionUnlockToken,
    uploadVersionDescription,
    setUploadVersionDescription,
    uploadingVersion,
    uploadVersionInputRef,
    handleClearUploadVersionFile,
    handleDownloadVersion,
    handleDownloadCurrent,
    handleUploadVersionSubmit,
  } = useDocumentVersions(doc, fileName, fetchDocument);

  const { runOcrLoading, handleRunOcr } = useDocumentOcr(docId, fetchDocument);

  const {
    relations,
    loadingRelations,
    modalAddRelation,
    setModalAddRelation,
    relatedDocId,
    setRelatedDocId,
    relationNotes,
    setRelationNotes,
    addingRelation,
    handleAddRelationSubmit,
    handleSetParent,
  } = useDocumentRelations(docId, activeTab);

  const {
    signatureRows,
    approvedRequests,
    modalRequestSign,
    setModalRequestSign,
    selectedSignerId,
    setSelectedSignerId,
    signMessage,
    setSignMessage,
    modalUploadSigned,
    setModalUploadSigned,
    selectedApprovedReqId,
    setSelectedApprovedReqId,
    signToken,
    setSignToken,
    signedFile,
    setSignedFile,
    uploadingSigned,
    signedFileInputRef,
    handleCreateSignatureRequest,
    handleClearSignedFile,
    handleUploadSignedSubmit,
  } = useDocumentSignatures(docId, doc, managers, fetchDocument);

  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || (user as { is_admin?: boolean })?.is_admin === true;
  const canRequestSignature = true;

  const {
    isTrashing,
    isRestoring,
    isPermanentDeleting,
    archiveDocument,
    unarchiveDocument,
    trashDocument,
    restoreDocument,
    permanentDeleteSingle,
  } = useDocumentOperations();

  const [isAddAttachmentPanelOpen, setIsAddAttachmentPanelOpen] = useState(false);
  /** Opens the attachment sidebar in edit mode for the given attachment. */
  const handleOpenEditAttachment = useCallback(
    (id: number) => {
      openEditAttachmentState(id);
      setIsAddAttachmentPanelOpen(true);
    },
    [openEditAttachmentState]
  );
  /** Opens the attachment sidebar in add mode (clears any edit state). */
  const openAddAttachmentPanel = useCallback(() => {
    clearEditAttachmentState();
    setIsAddAttachmentPanelOpen(true);
  }, [clearEditAttachmentState]);
  /** Closes the attachment sidebar and clears edit state. */
  const handleCloseAttachmentPanel = useCallback(() => {
    handleCloseEditAttachment();
    setIsAddAttachmentPanelOpen(false);
  }, [handleCloseEditAttachment]);
  const [modalTrashConfirm, setModalTrashConfirm] = useState(false);
  const [modalPermanentDelete, setModalPermanentDelete] = useState(false);

  const {
    notes,
    loading: loadingNotes,
    error: notesError,
    refresh: refreshNotes,
  } = useNotes({
    documentId: docId ?? undefined,
    autoLoad: activeTab === "notes",
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
      docId != null ? { document_id: docId, department_id: doc?.department_id } : undefined,
  });

  useEffect(() => {
    if (activeTab === "notes" && docId) {
      refreshNotes();
    }
  }, [activeTab, docId, refreshNotes]);

  const formatDate = useCallback((value?: string) => convertToArabianStandardTime(value), []);

  const handleDownloadAttachment = useCallback(
    async (attachmentId: number, fName: string) => {
      await downloadAttachment(
        attachmentId,
        fName,
        t("documents.downloadSuccess", { defaultValue: "Download started." })
      );
    },
    [downloadAttachment, t]
  );

  const confirmAttachmentTrash = useCallback(
    async (attachmentId: number) => {
      const didDelete = await deleteAttachment(attachmentId);
      if (didDelete) clearAttachmentSelection();
    },
    [deleteAttachment, clearAttachmentSelection]
  );

  const confirmBatchAttachmentTrash = useCallback(async () => {
    const selected = attachmentSelectedIds.map((id) => Number(id));
    if (selected.length === 0) return;
    const didDelete = await deleteAttachments(selected);
    if (didDelete) clearAttachmentSelection();
  }, [attachmentSelectedIds, deleteAttachments, clearAttachmentSelection]);

  const handleViewAttachment = useCallback(
    (attachmentId: number) => {
      if (!docId) return;
      navigate(
        routes.documentAttachmentView
          .replace(":id", String(docId))
          .replace(":attachmentId", String(attachmentId))
      );
    },
    [docId, navigate, routes.documentAttachmentView]
  );

  const handleArchive = useCallback(async () => {
    if (!doc?.id) return;
    await archiveDocument(doc.id, {
      successMessage: t("documents.archived", { defaultValue: "Document archived." }),
      errorMessage: t("documents.archiveFailed", { defaultValue: "Archive failed." }),
      onSuccess: () => fetchDocument(doc.id),
    });
  }, [doc?.id, archiveDocument, t, fetchDocument]);

  const handleUnarchive = useCallback(async () => {
    if (!doc?.id) return;
    await unarchiveDocument(doc.id, {
      successMessage: t("documents.unarchived", { defaultValue: "Document unarchived." }),
      errorMessage: t("documents.unarchiveFailed", { defaultValue: "Unarchive failed." }),
      onSuccess: () => fetchDocument(doc.id),
    });
  }, [doc?.id, unarchiveDocument, t, fetchDocument]);

  const handleTrashDocument = useCallback(async () => {
    if (!doc?.id) return;
    const didTrash = await trashDocument(doc.id, {
      successMessage: t("documents.trashed", { defaultValue: "Document moved to trash." }),
      errorMessage: t("documents.trashFailed", { defaultValue: "Failed to move to trash." }),
    });
    if (didTrash) {
      setModalTrashConfirm(false);
      navigate(routes.documents);
    }
  }, [doc?.id, trashDocument, t, navigate, routes.documents]);

  const handleRestoreDocument = useCallback(async () => {
    if (!doc?.id) return;
    await restoreDocument(doc.id, {
      successMessage: t("documents.restored", { defaultValue: "Document restored." }),
      errorMessage: t("documents.restoreFailed", { defaultValue: "Failed to restore." }),
      onSuccess: () => fetchDocument(doc.id),
    });
  }, [doc?.id, restoreDocument, t, fetchDocument]);

  const handlePermanentDelete = useCallback(async () => {
    if (!doc?.id) return;
    const didDelete = await permanentDeleteSingle(doc.id, {
      successMessage: t("documents.permanentlyDeleted", { defaultValue: "Document permanently deleted." }),
      errorMessage: t("documents.permanentDeleteFailed", { defaultValue: "Failed to delete permanently." }),
    });
    if (didDelete) {
      setModalPermanentDelete(false);
      navigate(routes.documentsTrash);
    }
  }, [doc?.id, permanentDeleteSingle, t, navigate, routes.documentsTrash]);

  return {
    t,
    routes,
    data: {
      docId,
      doc,
      title,
      documentTypeName,
      departmentName,
      uploaderName,
      versions,
      tags,
      ocr,
      ocrStatus,
      fileName,
      isOcrSupported,
      latestVersionId,
      signatureRows,
      approvedRequests,
      isArchived,
      isTrashed,
      isAdmin,
      canRequestSignature,
      attachments,
      relations,
      auditLogs,
      managers,
      notes,
    },
    loading: {
      isLoading,
      loadingAttachments,
      loadingRelations,
      loadingAudit,
      loadingNotes,
      isTrashing,
      isRestoring,
      isPermanentDeleting,
      isDeletingAttachment,
      isUpdatingAttachment,
      uploadingVersion,
      uploadingSigned,
      addingRelation,
      runOcrLoading,
      isCreatingNote: noteEditor.isCreatingNote,
      isUpdatingNote: noteEditor.isUpdatingNote,
      isDeletingNote: noteEditor.isDeletingNote,
    },
    error: {
      storeError,
      auditError,
      notesError,
    },
    tabState: {
      tabs,
      activeTab,
      setActiveTab,
      activityViewMode,
      setActivityViewMode,
      auditRefresh,
    },
    selection: {
      attachmentSelectedIds,
      attachmentSelectionConfig,
    },
    actions: {
      formatDate,
      refreshAttachments,
      confirmAttachmentTrash,
      confirmBatchAttachmentTrash,
      handleClearUploadVersionFile,
      handleClearSignedFile,
      handleDownloadVersion,
      handleDownloadCurrent,
      handleDownloadAttachment,
      handleOpenEditAttachment,
      handleCloseEditAttachment,
      handleConfirmEditAttachment,
      handleCloseAttachmentPanel,
      openAddAttachmentPanel,
      handleViewAttachment,
      handleOpenEdit,
      handleCloseEdit,
      handleEditSuccess,
      handleArchive,
      handleUnarchive,
      handleRunOcr,
      handleTrashDocument,
      handleRestoreDocument,
      handlePermanentDelete,
      handleUploadVersionSubmit,
      handleCreateSignatureRequest,
      handleUploadSignedSubmit,
      handleAddRelationSubmit,
      handleSetParent,
      handleCreateNote: noteEditor.handleCreateNote,
      handleEditNote: noteEditor.handleEditNote,
      handleCloseNoteEditor: noteEditor.handleCloseNoteEditor,
      handleSaveNote: noteEditor.handleSaveNote,
      confirmDeleteNote: noteEditor.confirmDeleteNote,
      handleViewNoteImage: noteEditor.handleViewNoteImage,
      handleCloseNoteImageViewer: noteEditor.handleCloseNoteImageViewer,
      setIsAddAttachmentPanelOpen,
      setModalUploadVersion,
      setUploadVersionFile,
      setUploadVersionUnlockToken,
      setUploadVersionDescription,
      setModalRequestSign,
      setSelectedSignerId,
      setSignMessage,
      setModalUploadSigned,
      setSelectedApprovedReqId,
      setSignToken,
      setSignedFile,
      setModalAddRelation,
      setRelatedDocId,
      setRelationNotes,
      setModalTrashConfirm,
      setModalPermanentDelete,
      setEditAttachmentName,
      setEditAttachmentDescription,
    },
    modals: {
      isAddAttachmentPanelOpen,
      editDocumentId,
      modalUploadVersion,
      uploadVersionFile,
      uploadVersionUnlockToken,
      uploadVersionDescription,
      uploadingVersion,
      uploadVersionInputRef,
      modalRequestSign,
      selectedSignerId,
      signMessage,
      modalUploadSigned,
      selectedApprovedReqId,
      signToken,
      signedFile,
      uploadingSigned,
      signedFileInputRef,
      modalAddRelation,
      relatedDocId,
      relationNotes,
      addingRelation,
      modalTrashConfirm,
      modalPermanentDelete,
      editAttachmentId,
      editAttachmentName,
      editAttachmentDescription,
      isTrashing,
      isRestoring,
      isPermanentDeleting,
      isDeletingAttachment,
      isUpdatingAttachment,
      isNotesEditorOpen: noteEditor.isNotesEditorOpen,
      editingNote: noteEditor.editingNote,
      isCreatingNote: noteEditor.isCreatingNote,
      isUpdatingNote: noteEditor.isUpdatingNote,
      isDeletingNote: noteEditor.isDeletingNote,
      noteImageViewerId: noteEditor.noteImageViewerId,
      noteImageViewerTitle: noteEditor.noteImageViewerTitle,
      noteImageViewerFilename: noteEditor.noteImageViewerFilename,
    },
  };
};
