import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useDocumentStore } from "../stores/documentStore";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSignatureStore } from "../../signatures/stores/signatureStore";
import { all_routes } from "../../../router/all_routes";
import { documentsApi } from "../../../app/adapter/api/documents.api";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { ocrApi } from "../../../app/adapter/api/ocr.api";
import { handleApiError } from "../../../app/adapter/api/client";
import type { DocumentDetail, DocumentVersion } from "../../../app/adapter/api/documents.api";
import { useAuditLogs } from "../../activity/hooks/useAuditLogs";
import type { ActivityViewMode } from "../../activity/types";
import { useAttachmentOperations, useDocumentOperations, useSelection } from "../../../shared/hooks";
import { convertToArabianStandardTime } from "../../../shared/utils/format/date";
import { fileToBase64 } from "../../../shared/utils/files/fileToBase64";
import { downloadBlobAsFile } from "../../../shared/utils/files/downloadBlobAsFile";
import { useNotes, useNoteMutations } from "../../notes/hooks/useNotes";
import type { NoteListItem, CreateNotePayload, UpdateNotePayload } from "../../notes/types/notes.types";

export const useDocumentDetailPageContainer = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routes = all_routes;

  const docId = useMemo(() => {
    if (!id) return null;
    const n = parseInt(id, 10);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  const {
    currentDocument,
    isLoading,
    fetchDocument,
    downloadVersion,
    uploadVersion,
    error: storeError,
  } = useDocumentStore();
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

  const { requests, fetchRequests, createRequest, uploadSigned } = useSignatureStore();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || (user as { is_admin?: boolean })?.is_admin === true;

  const [attachments, setAttachments] = useState<
    Array<{
      id: number;
      name: string;
      file_name: string;
      file_size?: number;
      description?: string | null;
      attachment_type?: string;
    }>
  >([]);
  const [relations, setRelations] = useState<{
    parent?: { id: number; title: string; barcode?: string } | null;
    related?: Array<{ id: number; title: string; barcode?: string; relation_type?: string; notes?: string }>;
  }>({});
  const [activeTab, setActiveTab] = useState("preview");
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [loadingRelations, setLoadingRelations] = useState(false);
  const [managers, setManagers] = useState<Array<{ id: number; name: string; login?: string }>>([]);

  const [isAddAttachmentPanelOpen, setIsAddAttachmentPanelOpen] = useState(false);
  const [modalUploadVersion, setModalUploadVersion] = useState(false);
  const [uploadVersionFile, setUploadVersionFile] = useState<File | null>(null);
  const [uploadVersionUnlockToken, setUploadVersionUnlockToken] = useState("");
  const [uploadVersionDescription, setUploadVersionDescription] = useState("");
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const uploadVersionInputRef = useRef<HTMLInputElement | null>(null);

  const [modalRequestSign, setModalRequestSign] = useState(false);
  const [selectedSignerId, setSelectedSignerId] = useState<number | "">("");
  const [signMessage, setSignMessage] = useState("");

  const [modalUploadSigned, setModalUploadSigned] = useState(false);
  const [selectedApprovedReqId, setSelectedApprovedReqId] = useState<number | null>(null);
  const [signToken, setSignToken] = useState("");
  const [signedFile, setSignedFile] = useState<File | null>(null);
  const [uploadingSigned, setUploadingSigned] = useState(false);
  const signedFileInputRef = useRef<HTMLInputElement | null>(null);

  const [modalAddRelation, setModalAddRelation] = useState(false);
  const [relatedDocId, setRelatedDocId] = useState("");
  const [relationNotes, setRelationNotes] = useState("");
  const [addingRelation, setAddingRelation] = useState(false);

  const [runOcrLoading, setRunOcrLoading] = useState(false);
  const [modalTrashConfirm, setModalTrashConfirm] = useState(false);
  const [modalPermanentDelete, setModalPermanentDelete] = useState(false);
  const [isEditAttachmentModalOpen, setIsEditAttachmentModalOpen] = useState(false);
  const [editAttachmentId, setEditAttachmentId] = useState<number | null>(null);
  const [editAttachmentName, setEditAttachmentName] = useState("");
  const [editAttachmentDescription, setEditAttachmentDescription] = useState("");
  const [activityViewMode, setActivityViewMode] = useState<ActivityViewMode>("timeline");

  // Notes state
  const [isNotesEditorOpen, setIsNotesEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteListItem | null>(null);
  const [noteImageViewerId, setNoteImageViewerId] = useState<number | null>(null);
  const [noteImageViewerTitle, setNoteImageViewerTitle] = useState<string>("");
  const [noteImageViewerFilename, setNoteImageViewerFilename] = useState<string>("");
  const {
    selectedIds: attachmentSelectedIds,
    selectionConfig: attachmentSelectionConfig,
    clear: clearAttachmentSelection,
  } = useSelection(attachments, (a) => a.id);

  // Notes hooks
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

  const handleClearUploadVersionFile = () => {
    setUploadVersionFile(null);
    if (uploadVersionInputRef.current) {
      uploadVersionInputRef.current.value = "";
    }
  };

  const handleClearSignedFile = () => {
    setSignedFile(null);
    if (signedFileInputRef.current) {
      signedFileInputRef.current.value = "";
    }
  };

  const doc = currentDocument as DocumentDetail | null;
  const title = doc?.name ?? doc?.title ?? "–";
  const documentTypeName =
    (doc?.document_type as { name?: string })?.name ?? doc?.document_type_name ?? "–";
  const departmentName = (doc?.department as { name?: string })?.name ?? doc?.department_name ?? "–";
  const uploaderName = (doc?.uploader_name as string) ?? "–";
  const versions: DocumentVersion[] = Array.isArray(doc?.versions) ? doc.versions : [];
  const tags = Array.isArray(doc?.tags) ? doc.tags : [];
  const ocr = doc?.ocr ?? {};
  const ocrStatus = (doc?.ocr_status ?? (ocr as { ocr_status?: string })?.ocr_status) ?? "pending";
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;
  const fileName =
    (doc?.file_name && doc.file_name.trim() !== "")
      ? doc.file_name
      : (latestVersion?.file_name ?? "");
  const fileExt = (fileName.split(".").pop() ?? "").toLowerCase();
  const isOcrSupported = ["pdf", "jpg", "jpeg", "png", "tiff"].includes(fileExt);
  const latestVersionId = latestVersion?.id;
  const isTrashed = useMemo(() => {
    const status = String(doc?.status ?? "").toLowerCase();
    return status.includes("trash") || status.includes("deleted");
  }, [doc?.status]);

  const signatureRows = useMemo(() => {
    if (!docId || !requests) return [];
    return requests.filter((r: { document_id?: number }) => r.document_id === docId);
  }, [requests, docId]);

  const approvedRequests = useMemo(
    () => signatureRows.filter((r: { state?: string }) => r.state === "approved"),
    [signatureRows]
  );

  const isArchived = (doc?.status ?? "").toLowerCase() === "archived";
  const canRequestSignature = true;
  const {
    logs: auditLogs,
    loading: loadingAudit,
    error: auditError,
    refresh: auditRefresh,
  } = useAuditLogs({
    enabled: Boolean(docId && activeTab === "audit"),
    initialParams: {
      document_id: docId ?? undefined,
      page: 1,
      per_page: 50,
    },
  });

  useEffect(() => {
    if (docId) {
      fetchDocument(docId);
      fetchRequests({ document_id: docId });
    }
  }, [docId, fetchDocument, fetchRequests]);

  useEffect(() => {
    if (!doc?.department_id) return;
    adminApi
      .getManagers(doc.department_id)
      .then((r) => setManagers(r.data ?? []))
      .catch(() => setManagers([]));
  }, [doc?.department_id]);

  useEffect(() => {
    if (!docId || activeTab !== "attachments") return;
    setLoadingAttachments(true);
    documentsApi
      .listAttachments(docId)
      .then((r) => setAttachments(r.data ?? []))
      .catch(() => setAttachments([]))
      .finally(() => setLoadingAttachments(false));
  }, [docId, activeTab]);

  const refreshAttachments = async () => {
    if (!docId) return;
    setLoadingAttachments(true);
    try {
      const r = await documentsApi.listAttachments(docId);
      setAttachments(r.data ?? []);
    } catch {
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const attachmentDocumentId = docId ?? null;
  const {
    isDeletingAttachment,
    isUpdatingAttachment,
    downloadAttachment,
    deleteAttachment,
    deleteAttachments,
    updateAttachment,
  } = useAttachmentOperations(attachmentDocumentId, {
    onSuccess: refreshAttachments,
  });

  useEffect(() => {
    if (!docId || activeTab !== "relations") return;
    setLoadingRelations(true);
    documentsApi
      .getRelations(docId)
      .then((r) => {
        const data = (r as { data?: typeof relations }).data;
        setRelations(data ?? {});
      })
      .catch(() => setRelations({}))
      .finally(() => setLoadingRelations(false));
  }, [docId, activeTab]);

  // Refresh notes when switching to notes tab
  useEffect(() => {
    if (activeTab === "notes" && docId) {
      refreshNotes();
    }
  }, [activeTab, docId, refreshNotes]);

  const handleDownloadVersion = async (versionId: number, fName: string) => {
    if (!doc?.id) return;
    try {
      await downloadVersion(doc.id, versionId, fName);
      toast.success(t("documents.downloadSuccess", { defaultValue: "Download started." }));
    } catch (e) {
      toast.error(
        (e as Error)?.message ?? t("documents.downloadFailed", { defaultValue: "Download failed." })
      );
    }
  };

  const handleDownloadCurrent = async () => {
    if (!doc?.id || !fileName) return;
    try {
      const blob = await documentsApi.downloadDocument(doc.id);
      downloadBlobAsFile(blob, fileName);
      toast.success(t("documents.downloadSuccess", { defaultValue: "Download started." }));
    } catch (e) {
      toast.error(
        (e as Error)?.message ?? t("documents.downloadFailed", { defaultValue: "Download failed." })
      );
    }
  };

  const handleDownloadAttachment = async (attachmentId: number, fName: string) => {
    await downloadAttachment(
      attachmentId,
      fName,
      t("documents.downloadSuccess", { defaultValue: "Download started." })
    );
  };

  /** Single attachment delete: call from useConfirmDialog onConfirm. */
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

  const handleOpenEditAttachment = (attachmentId: number) => {
    const target = attachments.find((attachment) => attachment.id === attachmentId);
    if (!target) return;
    setEditAttachmentId(target.id);
    setEditAttachmentName(target.name ?? "");
    setEditAttachmentDescription(target.description ?? "");
    setIsEditAttachmentModalOpen(true);
  };

  const handleCloseEditAttachment = () => {
    if (!isUpdatingAttachment) {
      setIsEditAttachmentModalOpen(false);
      setEditAttachmentId(null);
      setEditAttachmentName("");
      setEditAttachmentDescription("");
    }
  };

  const handleConfirmEditAttachment = async () => {
    if (!editAttachmentId) return;
    const didUpdate = await updateAttachment(editAttachmentId, {
      name: editAttachmentName.trim() || undefined,
      description: editAttachmentDescription.trim() || null,
    });
    if (didUpdate) {
      handleCloseEditAttachment();
    }
  };

  const handleArchive = async () => {
    if (!doc?.id) return;
    await archiveDocument(doc.id, {
      successMessage: t("documents.archived", { defaultValue: "Document archived." }),
      errorMessage: t("documents.archiveFailed", { defaultValue: "Archive failed." }),
      onSuccess: () => fetchDocument(doc.id),
    });
  };

  const handleUnarchive = async () => {
    if (!doc?.id) return;
    await unarchiveDocument(doc.id, {
      successMessage: t("documents.unarchived", { defaultValue: "Document unarchived." }),
      errorMessage: t("documents.unarchiveFailed", { defaultValue: "Unarchive failed." }),
      onSuccess: () => fetchDocument(doc.id),
    });
  };

  const handleRunOcr = async () => {
    if (!docId) return;
    setRunOcrLoading(true);
    try {
      await ocrApi.runOcr(docId);
      await fetchDocument(docId);
      toast.success(t("documents.ocrStarted", { defaultValue: "OCR started." }));
    } catch (e) {
      toast.error((e as Error)?.message ?? t("documents.ocrFailed", { defaultValue: "OCR failed." }));
    } finally {
      setRunOcrLoading(false);
    }
  };

  const handleTrashDocument = async () => {
    if (!doc?.id) return;
    const didTrash = await trashDocument(doc.id, {
      successMessage: t("documents.trashed", { defaultValue: "Document moved to trash." }),
      errorMessage: t("documents.trashFailed", { defaultValue: "Failed to move to trash." }),
    });
    if (didTrash) {
      setModalTrashConfirm(false);
      navigate(routes.documents);
    }
  };

  const handleRestoreDocument = async () => {
    if (!doc?.id) return;
    await restoreDocument(doc.id, {
      successMessage: t("documents.restored", { defaultValue: "Document restored." }),
      errorMessage: t("documents.restoreFailed", { defaultValue: "Failed to restore." }),
      onSuccess: () => fetchDocument(doc.id),
    });
  };

  const handlePermanentDelete = async () => {
    if (!doc?.id) return;
    const didDelete = await permanentDeleteSingle(doc.id, {
      successMessage: t("documents.permanentlyDeleted", { defaultValue: "Document permanently deleted." }),
      errorMessage: t("documents.permanentDeleteFailed", { defaultValue: "Failed to delete permanently." }),
    });
    if (didDelete) {
      setModalPermanentDelete(false);
      navigate(routes.documentsTrash);
    }
  };

  const handleUploadVersionSubmit = async () => {
    if (!doc?.id || !uploadVersionFile || !uploadVersionUnlockToken.trim()) return;
    setUploadingVersion(true);
    try {
      const fileData = await fileToBase64(uploadVersionFile);
      await uploadVersion(doc.id, {
        file_data: fileData,
        file_name: uploadVersionFile.name,
        unlock_token: uploadVersionUnlockToken.trim(),
        change_description: uploadVersionDescription.trim() || "New version",
      });
      toast.success(t("documents.versionUploaded", { defaultValue: "New version uploaded." }));
      setModalUploadVersion(false);
      setUploadVersionFile(null);
      setUploadVersionUnlockToken("");
      setUploadVersionDescription("");
    } catch (e) {
      toast.error(
        (e as Error)?.message ?? t("documents.versionUploadFailed", { defaultValue: "Upload failed." })
      );
    } finally {
      setUploadingVersion(false);
    }
  };

  const handleCreateSignatureRequest = async () => {
    if (!doc?.id || !selectedSignerId) return;
    try {
      await createRequest({
        document_id: doc.id,
        signer_id: Number(selectedSignerId),
        message: signMessage.trim() || undefined,
      });
      toast.success(t("documents.signatureRequestSent", { defaultValue: "Signature request sent." }));
      setModalRequestSign(false);
      setSelectedSignerId("");
      setSignMessage("");
      fetchRequests({ document_id: doc.id });
    } catch (e) {
      toast.error(
        (e as Error)?.message ??
          t("documents.signatureRequestFailed", { defaultValue: "Request failed." })
      );
    }
  };

  const handleUploadSignedSubmit = async () => {
    if (!selectedApprovedReqId || !signedFile || !signToken.trim()) return;
    setUploadingSigned(true);
    try {
      const fileData = await fileToBase64(signedFile);
      await uploadSigned(selectedApprovedReqId, {
        file_data: fileData,
        file_name: signedFile.name,
        sign_token: signToken.trim(),
        notes: t("documents.signedVersionUploadNotes", { defaultValue: "Signed version uploaded from detail page." }),
      });
      toast.success(t("documents.signedVersionUploaded", { defaultValue: "Signed version uploaded." }));
      setModalUploadSigned(false);
      setSelectedApprovedReqId(null);
      setSignToken("");
      setSignedFile(null);
      if (doc?.id) {
        fetchDocument(doc.id);
        fetchRequests({ document_id: doc.id });
      }
    } catch (e) {
      toast.error(
        (e as Error)?.message ?? t("documents.signedVersionUploadFailed", { defaultValue: "Upload failed." })
      );
    } finally {
      setUploadingSigned(false);
    }
  };

  const handleAddRelationSubmit = async () => {
    if (!docId || !relatedDocId.trim()) return;
    const relatedId = parseInt(relatedDocId.trim(), 10);
    if (!Number.isFinite(relatedId)) return;
    setAddingRelation(true);
    try {
      await documentsApi.addRelation(docId, {
        related_document_id: relatedId,
        notes: relationNotes.trim() || undefined,
      });
      toast.success(t("documents.relationAdded", { defaultValue: "Relation added." }));
      setModalAddRelation(false);
      setRelatedDocId("");
      setRelationNotes("");
      const r = await documentsApi.getRelations(docId);
      const data = (r as { data?: typeof relations }).data;
      setRelations(data ?? {});
    } catch (e) {
      toast.error(
        (e as Error)?.message ?? t("documents.relationAddFailed", { defaultValue: "Failed to add relation." })
      );
    } finally {
      setAddingRelation(false);
    }
  };

  const handleSetParent = async (parentId: number | null) => {
    if (!docId) return;
    try {
      await documentsApi.setParent(docId, parentId);
      toast.success(t("documents.parentUpdated", { defaultValue: "Parent updated." }));
      const r = await documentsApi.getRelations(docId);
      const data = (r as { data?: typeof relations }).data;
      setRelations(data ?? {});
    } catch (e) {
      toast.error(
        (e as Error)?.message ?? t("documents.parentUpdateFailed", { defaultValue: "Failed to update parent." })
      );
    }
  };

  /** Navigate to the dedicated attachment view (preview) page for the current document. */
  const handleViewAttachment = (attachmentId: number) => {
    if (!docId) return;
    navigate(routes.documentAttachmentView.replace(":id", String(docId)).replace(":attachmentId", String(attachmentId)));
  };

  const tabs = [
    { id: "preview", label: t("documents.preview", { defaultValue: "Preview" }) },
    { id: "download", label: t("documents.download", { defaultValue: "Download" }) },
    { id: "versions", label: t("documents.versionHistory", { defaultValue: "Version history" }) },
    { id: "attachments", label: t("documents.attachments", { defaultValue: "Attachments" }) },
    { id: "notes", label: t("documents.notes", { defaultValue: "Notes" }) },
    { id: "ocr", label: t("documents.ocr", { defaultValue: "OCR" }) },
    { id: "signatures", label: t("documents.signatureRequests", { defaultValue: "Signature requests" }) },
    { id: "relations", label: t("documents.relations", { defaultValue: "Relations" }) },
    { id: "audit", label: t("documents.audit", { defaultValue: "Audit log" }) },
  ];

  /** Formats API timestamp (UTC) as Arabia Standard Time for document/version/request dates. */
  const formatDate = (value?: string) => {
    return convertToArabianStandardTime(value);
  };

  // ── Note handlers ──

  /** Open note editor for creating a new note */
  const handleCreateNote = useCallback(() => {
    setEditingNote(null);
    setIsNotesEditorOpen(true);
  }, []);

  /** Open note editor for editing an existing note */
  const handleEditNote = useCallback((note: NoteListItem) => {
    setEditingNote(note);
    setIsNotesEditorOpen(true);
  }, []);

  /** Close note editor */
  const handleCloseNoteEditor = useCallback(() => {
    setIsNotesEditorOpen(false);
    setEditingNote(null);
  }, []);

  /** Save note (create or update) for this document */
  const handleSaveNote = useCallback(
    async (payload: Omit<CreateNotePayload, 'document_id'>) => {
      if (!docId) return;

      if (editingNote) {
        // Update existing note
        const success = await updateNote(editingNote.id, payload as UpdateNotePayload);
        if (success) {
          handleCloseNoteEditor();
          refreshNotes();
        }
      } else {
        // Create new note linked to this document
        const noteId = await createNote({
          ...payload,
          document_id: docId,
          department_id: doc?.department_id,
        });
        if (noteId) {
          handleCloseNoteEditor();
          refreshNotes();
        }
      }
    },
    [docId, editingNote, updateNote, createNote, doc?.department_id, handleCloseNoteEditor, refreshNotes]
  );

  /** Note delete: call from useConfirmDialog onConfirm. */
  const confirmDeleteNote = useCallback(
    async (noteId: number) => {
      const success = await deleteNote(noteId);
      if (success) refreshNotes();
    },
    [deleteNote, refreshNotes]
  );

  /** Open image viewer for a note */
  const handleViewNoteImage = useCallback((note: NoteListItem) => {
    setNoteImageViewerId(note.id);
    setNoteImageViewerTitle(note.title ?? "");
    setNoteImageViewerFilename(note.image_filename ?? "");
  }, []);

  /** Close image viewer */
  const handleCloseNoteImageViewer = useCallback(() => {
    setNoteImageViewerId(null);
    setNoteImageViewerTitle("");
    setNoteImageViewerFilename("");
  }, []);

  /** Grouped return shape: data, loading, error, tabs, selection, actions, modals (KISS/consistency with list containers). */
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
      isCreatingNote,
      isUpdatingNote,
      isDeletingNote,
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
      handleViewAttachment,
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
      handleCreateNote,
      handleEditNote,
      handleCloseNoteEditor,
      handleSaveNote,
      confirmDeleteNote,
      handleViewNoteImage,
      handleCloseNoteImageViewer,
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
      isEditAttachmentModalOpen,
      editAttachmentName,
      editAttachmentDescription,
      isTrashing,
      isRestoring,
      isPermanentDeleting,
      isDeletingAttachment,
      isUpdatingAttachment,
      isNotesEditorOpen,
      editingNote,
      isCreatingNote,
      isUpdatingNote,
      isDeletingNote,
      noteImageViewerId,
      noteImageViewerTitle,
      noteImageViewerFilename,
    },
  };
};
