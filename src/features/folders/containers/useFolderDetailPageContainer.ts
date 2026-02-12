import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { handleApiError } from "../../../app/adapter/api/client";
import { documentsApi, type Document, type Attachment } from "../../../app/adapter/api/documents.api";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { editRequestsApi } from "../../../app/adapter/api/editRequests.api";
import { getFolder, getFolderDocuments, deleteFolder, updateFolder } from "../services/folders.api";
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
import { useNotes, useNoteMutations } from "../../notes/hooks/useNotes";
import type { NoteListItem, CreateNotePayload, UpdateNotePayload } from "../../notes/types/notes.types";

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

  const [activityViewMode, setActivityViewMode] = useState<ActivityViewMode>("timeline");

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
    isArchiving,
    isUnarchiving,
    isTrashing,
    archiveDocument,
    unarchiveDocument,
    trashDocument,
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

  // Notes hooks
  const {
    notes,
    loading: loadingNotes,
    error: notesError,
    refresh: refreshNotes,
  } = useNotes({
    folderId: folderId ?? undefined,
    autoLoad: Boolean(folderId), // Load automatically on folder detail page mount/reload
  });

  const {
    create: createNote,
    update: updateNote,
    remove: deleteNote,
    isCreating: isCreatingNote,
    isUpdating: isUpdatingNote,
    isDeleting: isDeletingNote,
  } = useNoteMutations();

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

  // Notes state
  const [isNotesEditorOpen, setIsNotesEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteListItem | null>(null);
  const [noteImageViewerId, setNoteImageViewerId] = useState<number | null>(null);
  const [noteImageViewerTitle, setNoteImageViewerTitle] = useState<string>("");
  const [noteImageViewerFilename, setNoteImageViewerFilename] = useState<string>("");

  /** Fetches folder and its documents from GET /api/folders/:id/documents; folder includes last_modified (UTC) for "Updated" display. */
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

  /** Dummy call to GET folder by id when opening folder; log response to inspect latest_changes / last_modified etc. in Network or Console. */
  useEffect(() => {
    if (folderId == null) return;
    getFolder(folderId)
      .then((response) => {
        console.log("[folders/id] response for folderId", folderId, response);
      })
      .catch((err) => {
        console.warn("[folders/id] failed for folderId", folderId, err);
      });
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

  const handleOpenSubDocTrashConfirm = useCallback((documentId: number) => {
    setSubDocTrashTargetId(documentId);
  }, []);

  const handleCloseSubDocTrashConfirm = useCallback(() => {
    if (!isTrashing) {
      setSubDocTrashTargetId(null);
    }
  }, [isTrashing]);

  const handleConfirmSubDocTrash = useCallback(async () => {
    if (!subDocTrashTargetId) return;
    const didTrash = await trashDocument(subDocTrashTargetId, {
      successMessage: t("documents.trashed", { defaultValue: "Document moved to trash." }),
      errorMessage: t("documents.trashFailed", { defaultValue: "Failed to move to trash." }),
      onSuccess: loadFolderDocuments,
    });
    if (didTrash) {
      clearSubDocsSelection();
      setSubDocTrashTargetId(null);
    }
  }, [clearSubDocsSelection, loadFolderDocuments, subDocTrashTargetId, t, trashDocument]);

  const handleOpenBatchSubDocTrashConfirm = useCallback(() => {
    if (subDocSelectedIds.length > 0) {
      setIsBatchSubDocTrashConfirmOpen(true);
    }
  }, [subDocSelectedIds.length]);

  const handleCloseBatchSubDocTrashConfirm = useCallback(() => {
    if (!isTrashing) {
      setIsBatchSubDocTrashConfirmOpen(false);
    }
  }, [isTrashing]);

  const handleConfirmBatchSubDocTrash = useCallback(async () => {
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
    if (didTrash) {
      clearSubDocsSelection();
      setIsBatchSubDocTrashConfirmOpen(false);
    }
  }, [clearSubDocsSelection, loadFolderDocuments, subDocSelectedIds, t, trashDocument]);

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

  /** Navigate to the dedicated attachment view (preview) page for the currently selected document's attachment. */
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

  // Load notes when needed
  const handleLoadNotes = useCallback(() => {
    if (folderId) {
      refreshNotes();
    }
  }, [folderId, refreshNotes]);

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

  /** Save note (create or update) */
  const handleSaveNote = useCallback(
    async (payload: Omit<CreateNotePayload, 'folder_id'>) => {
      if (!folderId) return;

      if (editingNote) {
        // Update existing note
        const success = await updateNote(editingNote.id, payload as UpdateNotePayload);
        if (success) {
          handleCloseNoteEditor();
          refreshNotes();
        }
      } else {
        // Create new note
        const noteId = await createNote({
          ...payload,
          folder_id: folderId,
          department_id: folder?.department_id,
        });
        if (noteId) {
          handleCloseNoteEditor();
          refreshNotes();
        }
      }
    },
    [folderId, editingNote, updateNote, createNote, folder?.department_id, handleCloseNoteEditor, refreshNotes]
  );

  /** Delete a note */
  const handleDeleteNote = useCallback(
    async (note: NoteListItem) => {
      const confirmed = window.confirm(
        t("notes.confirmDelete", {
          defaultValue: "Are you sure you want to delete this note?",
        })
      );
      if (!confirmed) return;

      const success = await deleteNote(note.id);
      if (success) {
        refreshNotes();
      }
    },
    [deleteNote, refreshNotes, t]
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
    setIsUploadOpen,
    subDocsSelectionConfig,
    subDocSelectedIds,
    clearSubDocsSelection,
    subDocTrashTargetId,
    isSubDocArchiving: isArchiving,
    isSubDocUnarchiving: isUnarchiving,
    isSubDocTrashing: isTrashing,
    isBatchSubDocTrashConfirmOpen,
    isBatchSubDocTrashing: isTrashing,
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
    // Notes
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
    handleViewNoteImage,
    handleCloseNoteImageViewer,
  };
};
