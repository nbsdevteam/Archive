import { useCallback, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { toast } from "react-toastify";
import { documentsApi } from "@/app/adapter/api/documents.api";
import { uploadFilesWithConcurrency } from "@/app/adapter/api/documents";
import type { BulkUploadProgressData, UploadFileResult, UploadSingleFileBaseParams } from "@/app/adapter/api/documents.api";
import { useAnnounce } from "@/shared/components/a11y/LiveAnnouncer";
import { createFolder } from "@/app/adapter/api/folders.api";
import { fileToBase64 } from "@/shared/utils/files/fileToBase64";
import type { UploadFormValues } from "./types";
import { toCanonicalDdMmYyyy } from "@/shared/utils/documents/documentDate";

function summarizeMultiUploadOutcomes(results: UploadFileResult[], totalFiles: number) {
  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;
  const skippedCount = Math.max(0, totalFiles - results.length);
  return { successCount, failedCount, skippedCount };
}

/** Optional dd-mm-yyyy for upload APIs (JSON body or X-Document-Date); only sent when the value parses. */
function optionalDocumentDateParam(data: UploadFormValues): { document_date?: string } {
  const d = data.document_date?.trim();
  if (!d) return {};
  const canon = toCanonicalDdMmYyyy(d);
  return canon ? { document_date: canon } : {};
}

export interface UseUploadSubmitParams {
  onSuccess?: () => void;
  onClose: () => void;
  t: TFunction;
  setSubmitError: (msg: string | null) => void;
}

/** Hook that holds bulk-upload state and returns submit handler plus cancel. Submit logic runs in the returned onSubmit. */
export function useUploadSubmit({ onSuccess, onClose, t, setSubmitError }: UseUploadSubmitParams) {
  const announce = useAnnounce();
  const [bulkJobId, setBulkJobId] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<BulkUploadProgressData | null>(null);
  const [isCancellingBulkJob, setIsCancellingBulkJob] = useState(false);
  const [failedUploads, setFailedUploads] = useState<UploadFileResult[]>([]);
  const bulkCancelRequestedRef = useRef(false);

  /** Stops workers from taking new files (NBS v2 per-file uploads — no server job to cancel). */
  const handleCancelBulkJob = useCallback(() => {
    if (!bulkJobId) return;
    setIsCancellingBulkJob(true);
    bulkCancelRequestedRef.current = true;
    setBulkProgress((prev) => ({ ...(prev ?? {}), status: "cancelled" }));
    const cancelMsg = t("documents.uploadCancelled", { defaultValue: "Upload cancelled." });
    toast.info(cancelMsg);
    announce(cancelMsg);
    setIsCancellingBulkJob(false);
  }, [bulkJobId, t, announce]);

  /** NBS v2: POST `/api/documents/upload/single` per file with bounded concurrency. */
  const executeMultiFileUpload = useCallback(async (files: File[], baseParams: UploadSingleFileBaseParams) => {
    bulkCancelRequestedRef.current = false;
    setBulkJobId("batch-upload");
    setBulkProgress({
      status: "processing",
      total: files.length,
      processed: 0,
      successful: 0,
      failed: 0,
    });
    const results = await uploadFilesWithConcurrency(files, baseParams, {
      cancelledRef: bulkCancelRequestedRef,
      onProgress: (done, total, result) => {
        setBulkProgress((prev) => ({
          ...(prev ?? {}),
          status: bulkCancelRequestedRef.current ? "cancelled" : "processing",
          total,
          processed: done,
          successful: (prev?.successful ?? 0) + (result.success ? 1 : 0),
          failed: (prev?.failed ?? 0) + (result.success ? 0 : 1),
        }));
      },
    });
    const wasCancelled = bulkCancelRequestedRef.current;
    setBulkJobId(null);
    setBulkProgress(null);
    bulkCancelRequestedRef.current = false;
    return { results, wasCancelled, totalFiles: files.length };
  }, []);

  const finalizeMultiUploadFeedback = useCallback(
    (results: UploadFileResult[], totalFiles: number, wasCancelled: boolean) => {
      const { successCount, failedCount, skippedCount } = summarizeMultiUploadOutcomes(results, totalFiles);
      const failedFiles = results.filter((r) => !r.success);
      
      if (failedFiles.length > 0) {
        setFailedUploads(failedFiles);
      }
      
      if (successCount === 0) {
        if (wasCancelled) return;
        throw new Error(t("documents.bulkUploadAllFailed", { defaultValue: "All uploads failed." }));
      }
      if (wasCancelled && skippedCount > 0) {
        const partialMsg = t("documents.bulkUploadCancelledPartial", {
          defaultValue: "Upload stopped. {{count}} file(s) uploaded before cancel.",
          count: successCount,
        });
        toast.warning(partialMsg);
        announce(partialMsg);
      } else if (failedCount > 0 || skippedCount > 0) {
        const warnMsg = t("documents.bulkUploadCompletedWithFailures", { defaultValue: "Upload finished with some failed files." });
        toast.warning(warnMsg);
        announce(warnMsg);
      } else {
        const successMsg = t("documents.uploadSuccess") ?? "Document uploaded successfully.";
        toast.success(successMsg);
        announce(successMsg);
      }
      onSuccess?.();
      onClose();
    },
    [t, announce, onSuccess, onClose]
  );

  const onSubmit = useCallback(
    async (
      data: UploadFormValues,
      selectedFiles: File[],
      departmentId: number,
      lockFolderContext: boolean
    ) => {
      const isMainMulti = data.upload_kind === "main" && data.upload_multiple_main === true;
      const isSubMulti = data.upload_kind === "sub" && data.upload_multiple_sub === true;
      const file = data.file;
      const filesToUse = isMainMulti ? selectedFiles : isSubMulti ? selectedFiles : (selectedFiles.length > 0 ? selectedFiles : file ? [file] : []);
      if (!isMainMulti && !isSubMulti && !(file instanceof File)) {
        const msg = t("documents.validation.fileRequired");
        setSubmitError(msg);
        announce(msg);
        return;
      }
      if (isMainMulti && filesToUse.length === 0) {
        const msg = t("documents.validation.fileRequired");
        setSubmitError(msg);
        announce(msg);
        return;
      }
      if (isSubMulti && filesToUse.length === 0) {
        const msg = t("documents.validation.fileRequired");
        setSubmitError(msg);
        announce(msg);
        return;
      }

      if (data.upload_kind === "attachment") {
        const docId = Number(data.target_document_id);
        if (!docId) {
          const msg = t("documents.validation.targetDocumentIdRequired");
          setSubmitError(msg);
          toast.error(msg);
          announce(msg);
          return;
        }
        const filesToUpload = selectedFiles.length > 0 ? selectedFiles : file != null ? [file] : [];
        const attachmentsPayload = await Promise.all(
          filesToUpload.map(async (attachmentFile) => {
            if (!attachmentFile) return null;
            return {
              name: attachmentFile.name,
              file_name: attachmentFile.name,
              file_data: await fileToBase64(attachmentFile),
              description: null,
              attachment_type: "supporting",
            };
          })
        );
        const payload = attachmentsPayload.filter((p): p is NonNullable<typeof p> => p != null);
        const result = await documentsApi.uploadMultipleAttachments(docId, payload);
        if (!result.success) throw new Error(result.error ?? "Upload attachments failed");
        const successMsg = t("documents.uploadSuccess") ?? "Document uploaded successfully.";
        toast.success(successMsg);
        announce(successMsg);
        onSuccess?.();
        onClose();
        return;
      }

      if (data.upload_kind === "sub" && isSubMulti && filesToUse.length >= 1) {
        const folderIdForJob = data.folder_id && data.folder_id > 0 ? data.folder_id : undefined;
        if (!folderIdForJob) {
          const msg = t("documents.validation.folderRequiredForSubDocument");
          setSubmitError(msg);
          toast.error(msg);
          announce(msg);
          return;
        }
        const { results, wasCancelled, totalFiles } = await executeMultiFileUpload(filesToUse, {
          department_id: Number(data.department_id),
          document_type_id: Number(data.document_type_id),
          folder_id: folderIdForJob,
          create_folder: false,
          confidentiality_level: data.confidentiality_level,
          auto_ocr: true,
          ...optionalDocumentDateParam(data),
        });
        finalizeMultiUploadFeedback(results, totalFiles, wasCancelled);
        return;
      }

      if (isMainMulti && filesToUse.length >= 1) {
        // Only use existing folder_id if explicitly uploading from within a pre-created empty folder
        const useExistingFolder = lockFolderContext && data.folder_id && data.folder_id > 0;
        const existingFolderId = useExistingFolder ? data.folder_id : undefined;
        const { results, wasCancelled, totalFiles } = await executeMultiFileUpload(filesToUse, {
          department_id: Number(data.department_id),
          document_type_id: Number(data.document_type_id),
          create_folder: !existingFolderId,
          confidentiality_level: data.confidentiality_level,
          auto_ocr: true,
          ...(existingFolderId && { folder_id: existingFolderId }),
          ...(data.folder_company_id != null && data.folder_company_id >= 1 && { company_id: data.folder_company_id }),
          ...optionalDocumentDateParam(data),
        });
        finalizeMultiUploadFeedback(results, totalFiles, wasCancelled);
        return;
      }

      const singleFile = file instanceof File ? file : filesToUse[0];
      if (!(singleFile instanceof File)) {
        setSubmitError(t("documents.validation.fileRequired"));
        return;
      }
      const fileData = await fileToBase64(singleFile);
      // Use existing folder_id if explicitly uploading main doc from within a pre-created empty folder
      let finalFolderId: number | undefined = 
        (lockFolderContext && data.upload_kind === "main" && data.folder_id && data.folder_id > 0) 
          ? data.folder_id 
          : undefined;
      // Create new folder if no existing folder and folder details are provided
      if (!finalFolderId && data.upload_kind === "main" && data.folder_name?.trim() && data.folder_code?.trim() && departmentId) {
        const newFolder = await createFolder({
          name: data.folder_name.trim(),
          code: data.folder_code.trim(),
          department_id: departmentId,
          folder_type: data.folder_type || "other",
          description: data.folder_description?.trim() || null,
          ...(data.folder_company_id != null && data.folder_company_id >= 1 && { company_id: data.folder_company_id }),
        });
        finalFolderId = newFolder.id;
      }
      // Single-file upload: send folder_id (scalar). Multi-file flows use bulk APIs and folder_ids elsewhere.
      const resp = await documentsApi.uploadDocument({
        department_id: Number(data.department_id),
        document_type_id: Number(data.document_type_id),
        title: (data.title ?? "").trim(),
        file_data: fileData,
        file_name: singleFile.name,
        confidentiality_level: data.confidentiality_level,
        upload_kind: data.upload_kind,
        ...(finalFolderId ? { folder_id: finalFolderId } : {}),
        ...(data.po_number?.trim() ? { po_number: data.po_number.trim() } : {}),
        ...(data.bl_number?.trim() ? { bl_number: data.bl_number.trim() } : {}),
        ...(data.container_number?.trim() ? { container_number: data.container_number.trim() } : {}),
        ...(data.invoice_number?.trim() ? { invoice_number: data.invoice_number.trim() } : {}),
        ...(data.envoy_number?.trim() ? { envoy_number: data.envoy_number.trim() } : {}),
        ...(data.tags?.length ? { tags: data.tags } : {}),
        ...optionalDocumentDateParam(data),
      });
      if (!resp?.success) throw new Error(resp?.error || "Upload failed");
      const successMsg = t("documents.uploadSuccess") ?? "Document uploaded successfully.";
      toast.success(successMsg);
      announce(successMsg);
      onSuccess?.();
      onClose();
    },
    [onSuccess, onClose, t, setSubmitError, announce, executeMultiFileUpload, finalizeMultiUploadFeedback]
  );

  return {
    onSubmit,
    handleCancelBulkJob,
    bulkJobId,
    bulkProgress,
    isCancellingBulkJob,
    setBulkJobId,
    setBulkProgress,
    bulkCancelRequestedRef,
    resetBulkState: useCallback(() => {
      setBulkJobId(null);
      setBulkProgress(null);
      bulkCancelRequestedRef.current = false;
      setFailedUploads([]);
    }, []),
    failedUploads,
    clearFailedUploads: useCallback(() => setFailedUploads([]), []),
  };
}
