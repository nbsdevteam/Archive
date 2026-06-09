import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { createUploadDocumentResolver } from "../../utils/UploadDocumentSidePanel.validations";
import { SidePanel } from "@/shared/components/ui";
import type { SelectOption } from "@/shared/components/ui";
import { adminApi } from "@/app/adapter/api/admin.api";
import { listFolders } from "@/app/adapter/api/folders.api";
import { useCompaniesStore } from "@/shared/stores/companiesStore";
import type { Department } from "@/app/adapter/api/admin.api";
import type { DocumentType } from "@/app/adapter/api/admin.api";
import type { Tag } from "@/app/adapter/api/admin.api";
import type { Folder } from "@/app/adapter/api/folders.types";
import type { UploadFormValues, UploadDocumentSidePanelProps } from "./types";
import { getDefaultUploadFormValues } from "./types";
import { UploadDocumentFormContent } from "./UploadDocumentFormContent";
import { UploadDocumentActions } from "./UploadDocumentActions";
import { useViewport } from "@/shared/hooks/useViewport";
import { useCapabilityPermissions } from "@/shared/hooks/useCapabilityPermissions";
import { useUploadSubmit } from "./useUploadSubmit";
import { FailedUploadsModal } from "./FailedUploadsModal";

/** Upload side panel: composes form state, submit logic, and target/file/optional/actions sections. */
function UploadDocumentSidePanel({
  isOpen,
  onClose,
  onSuccess,
  initialValues,
  lockFolderContext = false,
}: UploadDocumentSidePanelProps) {
  const { t } = useTranslation();
  const { isMobileView } = useViewport();
  const { uploadLimit } = useCapabilityPermissions();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const { companies, fetchCompanies } = useCompaniesStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);

  const submitLogic = useUploadSubmit({ onSuccess, onClose, t, setSubmitError });
  const resolver = useMemo(() => createUploadDocumentResolver(t), [t]);

  const defaultValues = useMemo(() => getDefaultUploadFormValues(initialValues, lockFolderContext), [initialValues, lockFolderContext]);
  const { control, register, handleSubmit, trigger, watch, formState: { errors }, reset, setValue } = useForm<UploadFormValues>({
    mode: "onChange",
    resolver,
    defaultValues,
  });

  const uploadKind = watch("upload_kind");
  const uploadMultipleMain = watch("upload_multiple_main") ?? false;
  const uploadMultipleSub = watch("upload_multiple_sub") ?? false;
  const departmentId = watch("department_id");
  const documentTypeId = watch("document_type_id");
  const title = watch("title");
  const folderName = watch("folder_name");
  const folderCode = watch("folder_code");
  const folderCompanyId = watch("folder_company_id");
  const targetDocumentId = watch("target_document_id");
  const folderId = watch("folder_id");
  const selectedFile = watch("file");

  useEffect(() => {
    if (uploadKind !== "main") {
      setValue("upload_multiple_main", false);
      setValue("folder_name", "");
      setValue("folder_code", "");
      setValue("folder_type", "other");
      setValue("folder_description", "");
      setValue("folder_company_id", 0);
    }
    if (uploadKind !== "sub") {
      setValue("upload_multiple_sub", false);
    }
    // Disable upload multiple when uploading main file to a pre-created folder
    if (lockFolderContext && uploadKind === "main") {
      setValue("upload_multiple_main", false);
    }
  }, [uploadKind, lockFolderContext, setValue]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const [deptsRes, tagsRes] = await Promise.all([adminApi.getDepartments(), adminApi.getTags()]);
        if (!cancelled && deptsRes?.data) setDepartments(deptsRes.data);
        if (!cancelled && tagsRes?.data) setTags(tagsRes.data);
      } catch {
        if (!cancelled) setDepartments([]);
        if (!cancelled) setTags([]);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Only fetch companies when creating NEW folders (not in locked folder context)
  useEffect(() => {
    if (isOpen && !lockFolderContext) {
      fetchCompanies({ limit: 100 });
      if (import.meta.env.DEV) {
        console.log("[UploadDocumentSidePanel] Fetching companies for new folder creation");
      }
    }
  }, [isOpen, lockFolderContext, fetchCompanies]);

  // Debug: Log companies after fetch
  useEffect(() => {
    if (import.meta.env.DEV && isOpen) {
      console.log("[UploadDocumentSidePanel] lockFolderContext:", lockFolderContext);
      console.log("[UploadDocumentSidePanel] companies count:", companies.length);
      console.log("[UploadDocumentSidePanel] initialValues.folder_company_name:", initialValues?.folder_company_name);
    }
  }, [companies, isOpen, lockFolderContext, initialValues?.folder_company_name]);

  /** Locked folder upload: ensure RHF has company id for validation/submit when API prefilled it outside the companies list. */
  useEffect(() => {
    if (!isOpen || !lockFolderContext) return;
    const cid = initialValues?.folder_company_id;
    if (cid != null && cid >= 1) {
      setValue("folder_company_id", cid, { shouldValidate: true });
    }
  }, [isOpen, lockFolderContext, initialValues?.folder_company_id, setValue]);

  useEffect(() => {
    if (!departmentId || departmentId < 1) {
      setDocumentTypes([]);
      setFolders([]);
      setValue("document_type_id", 0);
      setValue("folder_id", undefined);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [typesRes, foldersRes] = await Promise.all([
          adminApi.getDocumentTypes(departmentId),
          listFolders({ department_id: departmentId }),
        ]);
        if (!cancelled) {
          const types = typesRes?.data ?? [];
          setDocumentTypes(types);
          setFolders(foldersRes?.folders ?? []);
          const firstTypeId = types[0]?.id;
          if (lockFolderContext && firstTypeId != null && firstTypeId >= 1) {
            setValue("document_type_id", firstTypeId);
          } else {
            setValue("document_type_id", 0);
          }
          const preserveFolder = lockFolderContext && initialValues?.folder_id != null && (initialValues?.department_id ?? 0) === departmentId;
          if (!preserveFolder) setValue("folder_id", undefined);
        }
      } catch {
        if (!cancelled) {
          setDocumentTypes([]);
          setFolders([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [departmentId, setValue, lockFolderContext, initialValues?.folder_id, initialValues?.department_id]);

  useEffect(() => {
    if (isOpen) {
      reset(getDefaultUploadFormValues(initialValues, lockFolderContext));
      setSelectedFiles([]);
      submitLogic.resetBulkState();
      setSubmitError(null);
    }
  }, [isOpen, reset, initialValues, lockFolderContext, submitLogic.resetBulkState]);

  const onSubmitWrapper = useCallback(
    async (data: UploadFormValues) => {
      setIsUploading(true);
      try {
        await submitLogic.onSubmit(data, selectedFiles, departmentId, lockFolderContext);
        
        // After upload completes, check if there are failed files and show modal
        if (submitLogic.failedUploads.length > 0) {
          setIsFailedModalOpen(true);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setSubmitError(msg);
        toast.error(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [selectedFiles, departmentId, lockFolderContext, submitLogic.onSubmit, submitLogic.failedUploads.length]
  );

  const handleUploadClick = useCallback(async () => {
    setSubmitError(null);
    const isValid = await trigger(undefined, { shouldFocus: true });
    if (!isValid) {
      const msg = t("common.fixErrorsBelow");
      setSubmitError(msg);
      toast.error(msg);
      return;
    }
    await handleSubmit(onSubmitWrapper)();
  }, [trigger, handleSubmit, onSubmitWrapper, t]);

  const uploadWhatDocumentLabel = useMemo(() => {
    const typeKey = uploadKind === "main" ? "documents.mainDocument" : uploadKind === "sub" ? "documents.subDocument" : "documents.attachment";
    return t("documents.uploadWhatDocument", { type: t(typeKey) });
  }, [uploadKind, t]);

  const hasRequiredTitle = typeof title === "string" && title.trim().length > 0;
  const hasFile = selectedFile instanceof File;
  const hasMainMultiFiles = uploadKind === "main" && uploadMultipleMain && selectedFiles.length >= 1;
  const hasSubMultiFiles = uploadKind === "sub" && uploadMultipleSub && selectedFiles.length >= 1;
  const canSubmit =
    uploadKind === "attachment"
      ? hasFile && Number(targetDocumentId) >= 1
      : uploadKind === "main" && uploadMultipleMain
        ? hasMainMultiFiles && Number(departmentId) >= 1 && Number(documentTypeId) >= 1 && Number(folderCompanyId) >= 1
        : uploadKind === "sub" && uploadMultipleSub
          ? hasSubMultiFiles && Number(departmentId) >= 1 && Number(documentTypeId) >= 1 && Number(folderId) >= 1
          : hasRequiredTitle &&
            hasFile &&
            Number(departmentId) >= 1 &&
            Number(documentTypeId) >= 1 &&
            (uploadKind !== "sub" || Number(folderId) >= 1) &&
            (uploadKind !== "main" || ((folderName ?? "").trim().length > 0 && (folderCode ?? "").trim().length > 0 && Number(folderCompanyId) >= 1));
  const submitDisabled = !canSubmit || isUploading;

  /** Auto-fills folder name (only) from document title when uploading a main document; folder code is not prefilled. */
  const fillFolderNameFromTitle = useCallback(
    (titleValue: string) => {
      if (uploadKind !== "main" || !departmentId || departmentId < 1 || !documentTypeId || documentTypeId < 1) return;
      const dept = departments.find((d) => d.id === Number(departmentId));
      const docType = documentTypes.find((dt) => dt.id === Number(documentTypeId));
      const trimmed = (titleValue ?? "").trim();
      if (!dept?.code || !docType?.code || !trimmed) return;
      const sanitizedTitle = trimmed.replace(/\s+/g, "_");
      setValue("folder_name", `${dept.code}-${docType.code}-${sanitizedTitle}`, { shouldValidate: true });
    },
    [uploadKind, departmentId, documentTypeId, departments, documentTypes, setValue]
  );

  /** Limits selected files when upload_limit > 1 and multi-upload is enabled. */
  const handleFileChange = useCallback(
    (files: File[]) => {
      const max =
        (uploadKind === "main" && uploadMultipleMain) ||
        (uploadKind === "sub" && uploadMultipleSub)
          ? uploadLimit
          : 1;
      const resolvedMax = max > 1 ? max : files.length;
      setSelectedFiles(files.slice(0, resolvedMax));
    },
    [uploadKind, uploadMultipleMain, uploadMultipleSub, uploadLimit],
  );

  const handleClearFile = useCallback(() => {
    setSelectedFiles([]);
    setValue("file", undefined, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [setValue]);

  /** Toggle for main-document batch upload; only relevant when upload_kind is "main". */
  const handleUploadMultipleMainChange = useCallback(
    (value: boolean) => {
      setValue("upload_multiple_main", value, { shouldValidate: true });
    },
    [setValue]
  );

  /** Toggle for sub-document batch upload; only relevant when upload_kind is "sub". */
  const handleUploadMultipleSubChange = useCallback(
    (value: boolean) => {
      setValue("upload_multiple_sub", value, { shouldValidate: true });
    },
    [setValue]
  );

  /** Prefill title and folder name from filename when user selects a single main file. */
  const handleMainSingleFileSelected = useCallback(
    (baseName: string) => {
      setValue("title", baseName, { shouldValidate: true });
      setValue("folder_name", baseName, { shouldValidate: true });
    },
    [setValue]
  );

  /** Prefill title from filename when user selects a single sub file. */
  const handleSubSingleFileSelected = useCallback(
    (baseName: string) => {
      setValue("title", baseName, { shouldValidate: true });
    },
    [setValue]
  );

  /** Prevents default form submit and triggers upload validation + submit. */
  const handleUploadFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void handleUploadClick();
    },
    [handleUploadClick]
  );

  const tagOptions: SelectOption[] = useMemo(() => tags.map((tag) => ({ value: tag.id, label: tag.name })), [tags]);

  const handleCloseFailedModal = useCallback(() => {
    setIsFailedModalOpen(false);
    submitLogic.clearFailedUploads();
  }, [submitLogic]);

  return (
    <>
      <FailedUploadsModal
        isOpen={isFailedModalOpen}
        onClose={handleCloseFailedModal}
        failedFiles={submitLogic.failedUploads}
      />
      
      <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdropClick={false}
      title={t("documents.uploadNewDocument", { defaultValue: "Upload new document" })}
      footer={
        <UploadDocumentActions
          onClose={onClose}
          onUpload={handleUploadClick}
          isUploading={isUploading}
          submitDisabled={submitDisabled}
          t={t}
        />
      }
      loading={isUploading}
      width={isMobileView ? "100vw" : "50vw"}
    >
      <form onSubmit={handleUploadFormSubmit} className="d-flex flex-column gap-0">
        <UploadDocumentFormContent
          submitError={submitError}
          control={control}
          register={register}
          errors={errors}
          setValue={setValue}
          uploadKind={uploadKind}
          departmentId={departmentId}
          documentTypeId={documentTypeId}
          title={title ?? ""}
          folderName={folderName ?? ""}
          folderCode={folderCode ?? ""}
          folderId={folderId}
          targetDocumentId={targetDocumentId}
          lockFolderContext={lockFolderContext}
          initialValues={initialValues}
          departments={departments}
          documentTypes={documentTypes}
          folders={folders}
          companies={companies}
          fileInputRef={fileInputRef}
          selectedFile={selectedFile}
          selectedFiles={selectedFiles}
          onFileChange={handleFileChange}
          uploadLimit={uploadLimit}
          onClearFile={handleClearFile}
          uploadWhatDocumentLabel={uploadWhatDocumentLabel}
          uploadMultipleMain={uploadMultipleMain}
          onUploadMultipleMainChange={handleUploadMultipleMainChange}
          uploadMultipleSub={uploadMultipleSub}
          onUploadMultipleSubChange={handleUploadMultipleSubChange}
          onMainSingleFileSelected={handleMainSingleFileSelected}
          onSubSingleFileSelected={handleSubSingleFileSelected}
          tagOptions={tagOptions}
          bulkJobId={submitLogic.bulkJobId}
          bulkProgress={submitLogic.bulkProgress}
          isCancellingBulkJob={submitLogic.isCancellingBulkJob}
          onCancelBulkJob={submitLogic.handleCancelBulkJob}
          isUploading={isUploading}
          t={t}
          fillFolderNameFromTitle={fillFolderNameFromTitle}
        />
      </form>
    </SidePanel>
    </>
  );
}

export default UploadDocumentSidePanel;
