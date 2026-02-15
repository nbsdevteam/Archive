import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolverZod4 } from "@/shared/utils/form/zodResolverZod4";
import { SidePanel } from "@/shared/components/ui";
import type { SelectOption } from "@/shared/components/ui";
import { adminApi } from "@/app/adapter/api/admin.api";
import { listFolders } from "@/features/folders/services/folders.api";
import type { Department } from "@/app/adapter/api/admin.api";
import type { DocumentType } from "@/app/adapter/api/admin.api";
import type { Tag } from "@/app/adapter/api/admin.api";
import type { Folder } from "@/features/folders/types/folders.types";
import type { UploadFormValues, UploadDocumentSidePanelProps } from "./types";
import { getDefaultUploadFormValues } from "./types";
import { UploadDocumentFormContent } from "./UploadDocumentFormContent";
import { UploadDocumentActions } from "./UploadDocumentActions";
import { useUploadSubmit } from "./useUploadSubmit";
import { getUploadDocumentSchema } from "./uploadDocumentSchema";

/** Upload side panel: composes form state, submit logic, and target/file/optional/actions sections. */
export function UploadDocumentSidePanel({
  isOpen,
  onClose,
  onSuccess,
  initialValues,
  lockFolderContext = false,
}: UploadDocumentSidePanelProps) {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const submitLogic = useUploadSubmit({ onSuccess, onClose, t, setSubmitError });
  const uploadDocumentSchema = useMemo(() => getUploadDocumentSchema(t), [t]);

  const defaultValues = useMemo(() => getDefaultUploadFormValues(initialValues, lockFolderContext), [initialValues, lockFolderContext]);
  const { control, register, handleSubmit, trigger, watch, formState: { errors }, reset, setValue } = useForm<UploadFormValues>({
    mode: "onChange",
    resolver: zodResolverZod4(uploadDocumentSchema) as Resolver<UploadFormValues>,
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
    }
    if (uploadKind !== "sub") {
      setValue("upload_multiple_sub", false);
    }
  }, [uploadKind, setValue]);

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
          setDocumentTypes(typesRes?.data ?? []);
          setFolders(foldersRes?.folders ?? []);
          setValue("document_type_id", 0);
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
        await submitLogic.onSubmit(data, selectedFiles, departmentId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setSubmitError(msg);
        toast.error(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [selectedFiles, departmentId, submitLogic.onSubmit]
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
        ? hasMainMultiFiles && Number(departmentId) >= 1 && Number(documentTypeId) >= 1
        : uploadKind === "sub" && uploadMultipleSub
          ? hasSubMultiFiles && Number(departmentId) >= 1 && Number(documentTypeId) >= 1 && Number(folderId) >= 1
          : hasRequiredTitle &&
            hasFile &&
            Number(departmentId) >= 1 &&
            Number(documentTypeId) >= 1 &&
            (uploadKind !== "sub" || Number(folderId) >= 1) &&
            (uploadKind !== "main" || ((folderName ?? "").trim().length > 0 && (folderCode ?? "").trim().length > 0));
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

  const tagOptions: SelectOption[] = useMemo(() => tags.map((tag) => ({ value: tag.id, label: tag.name })), [tags]);

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
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
      width="50vw"
    >
      <form onSubmit={(e) => { e.preventDefault(); handleUploadClick(); }} className="d-flex flex-column gap-0">
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
          fileInputRef={fileInputRef}
          selectedFile={selectedFile}
          selectedFiles={selectedFiles}
          onFileChange={setSelectedFiles}
          onClearFile={handleClearFile}
          uploadWhatDocumentLabel={uploadWhatDocumentLabel}
          uploadMultipleMain={uploadMultipleMain}
          onUploadMultipleMainChange={handleUploadMultipleMainChange}
          uploadMultipleSub={uploadMultipleSub}
          onUploadMultipleSubChange={handleUploadMultipleSubChange}
          onMainSingleFileSelected={handleMainSingleFileSelected}
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
  );
}
