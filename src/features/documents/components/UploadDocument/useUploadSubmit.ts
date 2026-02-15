import { useCallback, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { toast } from "react-toastify";
import { documentsApi } from "@/app/adapter/api/documents.api";
import { useAnnounce } from "@/shared/components/a11y/LiveAnnouncer";
import type { BulkUploadProgressData } from "@/app/adapter/api/documents.api";
import { createFolder } from "@/features/folders/services/folders.api";
import { fileToBase64 } from "@/shared/utils/files/fileToBase64";
import { getBaseName } from "@/shared/utils/files/filename";
import type { UploadFormValues } from "./types";

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
  const bulkCancelRequestedRef = useRef(false);

  const isBulkTerminalStatus = useCallback((status?: string) => {
    const normalized = (status ?? "").toLowerCase();
    return ["completed", "done", "failed", "cancelled", "canceled"].includes(normalized);
  }, []);

  const pollBulkJobUntilFinished = useCallback(
    async (jobId: string) => {
      for (;;) {
        const progressResponse = await documentsApi.getBulkUploadProgress(jobId);
        const progress = progressResponse.data ?? {};
        setBulkProgress(progress);
        const total = Number(progress.total ?? 0);
        const processed = Number(progress.processed ?? 0);
        const failed = Number(progress.failed ?? 0);
        const finishedByCounts = total > 0 && processed + failed >= total;
        if (bulkCancelRequestedRef.current || finishedByCounts || isBulkTerminalStatus(progress.status)) {
          return progress;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    },
    [isBulkTerminalStatus]
  );

  const handleCancelBulkJob = useCallback(async () => {
    if (!bulkJobId) return;
    setIsCancellingBulkJob(true);
    bulkCancelRequestedRef.current = true;
    try {
      await documentsApi.cancelBulkUploadJob(bulkJobId);
      setBulkProgress((prev) => ({ ...(prev ?? {}), status: "cancelled" }));
      const cancelMsg = t("documents.uploadCancelled", { defaultValue: "Upload cancelled." });
      toast.info(cancelMsg);
      announce(cancelMsg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.unexpectedError", { defaultValue: "Unexpected error" });
      setSubmitError(msg);
      toast.error(msg);
      announce(msg);
    } finally {
      setIsCancellingBulkJob(false);
    }
  }, [bulkJobId, t, setSubmitError, announce]);

  const onSubmit = useCallback(
    async (
      data: UploadFormValues,
      selectedFiles: File[],
      departmentId: number
    ) => {
      const isMainMulti = data.upload_kind === "main" && data.upload_multiple_main === true;
      const file = data.file;
      const filesToUse = isMainMulti ? selectedFiles : selectedFiles.length > 0 ? selectedFiles : file ? [file] : [];
      if (!isMainMulti && !(file instanceof File)) {
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

      if (data.upload_kind === "attachment") {
        const docId = Number(data.target_document_id);
        if (!docId) {
          const msg = t("documents.validation.targetDocumentIdRequired");
          setSubmitError(msg);
          toast.error(msg);
          announce(msg);
          return;
        }
        const filesToUpload = selectedFiles.length > 0 ? selectedFiles : [file];
        const attachmentsPayload = await Promise.all(
          filesToUpload.map(async (attachmentFile) => ({
            name: attachmentFile.name,
            file_name: attachmentFile.name,
            file_data: await fileToBase64(attachmentFile),
            description: null,
            attachment_type: "supporting",
          }))
        );
        const result = await documentsApi.uploadMultipleAttachments(docId, attachmentsPayload);
        if (!result.success) throw new Error(result.error ?? "Upload attachments failed");
        const successMsg = t("documents.uploadSuccess") ?? "Document uploaded successfully.";
        toast.success(successMsg);
        announce(successMsg);
        onSuccess?.();
        onClose();
        return;
      }

      const filesToUpload = selectedFiles.length > 0 ? selectedFiles : [file];
      if (data.upload_kind === "sub" && filesToUpload.length > 1) {
        const folderIdForJob = data.folder_id && data.folder_id > 0 ? data.folder_id : undefined;
        if (!folderIdForJob) {
          const msg = t("documents.validation.folderRequiredForSubDocument");
          setSubmitError(msg);
          toast.error(msg);
          announce(msg);
          return;
        }
        const startResponse = await documentsApi.startBulkUpload({
          department_id: Number(data.department_id),
          document_type_id: Number(data.document_type_id),
          folder_id: folderIdForJob,
          confidentiality_level: data.confidentiality_level,
          auto_ocr: false,
          auto_barcode: false,
        });
        const jobId = startResponse.data?.job_id;
        if (!jobId) throw new Error("Bulk upload job id is missing.");
        setBulkJobId(jobId);
        setBulkProgress({ status: "starting", total: filesToUpload.length, processed: 0, failed: 0 });
        const bulkFilesPayload = await Promise.all(
          filesToUpload.map(async (subFile) => ({
            file_name: subFile.name,
            file_data: await fileToBase64(subFile),
            name: subFile.name,
            description: "",
          }))
        );
        await documentsApi.uploadFilesToBulkJob(jobId, bulkFilesPayload);
        const finalProgress = await pollBulkJobUntilFinished(jobId);
        const finalStatus = (finalProgress.status ?? "").toLowerCase();
        if (finalStatus === "cancelled" || finalStatus === "canceled" || bulkCancelRequestedRef.current) return;
        if (Number(finalProgress.failed ?? 0) > 0) {
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
        return;
      }

      if (isMainMulti && filesToUse.length >= 1) {
        const startResponse = await documentsApi.startBulkUpload({
          department_id: Number(data.department_id),
          document_type_id: Number(data.document_type_id),
          confidentiality_level: data.confidentiality_level,
          auto_ocr: false,
          auto_barcode: false,
        });
        const jobId = startResponse.data?.job_id;
        if (!jobId) throw new Error("Bulk upload job id is missing.");
        setBulkJobId(jobId);
        setBulkProgress({ status: "starting", total: filesToUse.length, processed: 0, failed: 0 });
        const bulkFilesPayload = await Promise.all(
          filesToUse.map(async (mainFile) => {
            const baseName = getBaseName(mainFile.name) || mainFile.name;
            return {
              file_name: mainFile.name,
              file_data: await fileToBase64(mainFile),
              name: baseName,
              description: "",
              folder_name: baseName,
              folder_code: baseName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/gi, "_"),
            };
          })
        );
        await documentsApi.uploadFilesToBulkJob(jobId, bulkFilesPayload);
        const finalProgress = await pollBulkJobUntilFinished(jobId);
        const finalStatus = (finalProgress.status ?? "").toLowerCase();
        if (finalStatus === "cancelled" || finalStatus === "canceled" || bulkCancelRequestedRef.current) return;
        if (Number(finalProgress.failed ?? 0) > 0) {
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
        return;
      }

      const singleFile = file instanceof File ? file : filesToUse[0];
      if (!(singleFile instanceof File)) {
        setSubmitError(t("documents.validation.fileRequired"));
        return;
      }
      const fileData = await fileToBase64(singleFile);
      let finalFolderId: number | undefined = data.folder_id && data.folder_id > 0 ? data.folder_id : undefined;
      if (data.upload_kind === "main" && data.folder_name?.trim() && data.folder_code?.trim() && departmentId) {
        const newFolder = await createFolder({
          name: data.folder_name.trim(),
          code: data.folder_code.trim(),
          department_id: departmentId,
          folder_type: data.folder_type || "other",
          description: data.folder_description?.trim() || null,
        });
        finalFolderId = newFolder.id;
      }
      const resp = await documentsApi.uploadDocument({
        department_id: Number(data.department_id),
        document_type_id: Number(data.document_type_id),
        title: (data.title ?? "").trim(),
        file_data: fileData,
        file_name: singleFile.name,
        confidentiality_level: data.confidentiality_level,
        upload_kind: data.upload_kind,
        ...(finalFolderId ? { folder_ids: [finalFolderId] } : {}),
        ...(data.po_number?.trim() ? { po_number: data.po_number.trim() } : {}),
        ...(data.bl_number?.trim() ? { bl_number: data.bl_number.trim() } : {}),
        ...(data.container_number?.trim() ? { container_number: data.container_number.trim() } : {}),
        ...(data.invoice_number?.trim() ? { invoice_number: data.invoice_number.trim() } : {}),
        ...(data.envoy_number?.trim() ? { envoy_number: data.envoy_number.trim() } : {}),
        ...(data.tags?.length ? { tags: data.tags } : {}),
      });
      if (!resp?.success) throw new Error(resp?.error || "Upload failed");
      const successMsg = t("documents.uploadSuccess") ?? "Document uploaded successfully.";
      toast.success(successMsg);
      announce(successMsg);
      onSuccess?.();
      onClose();
    },
    [onSuccess, onClose, t, setSubmitError, pollBulkJobUntilFinished, announce]
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
    }, []),
  };
}
