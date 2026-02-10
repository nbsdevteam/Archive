import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SidePanel, Input, SelectField, MultiSelectField, Icon, Button, InfoWrapper } from "../../../shared/components/ui";
import type { SelectOption } from "../../../shared/components/ui";
import { FOLDER_TYPE_VALUES } from "../../../shared/constants/folderTypeOptions";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { documentsApi } from "../../../app/adapter/api/documents.api";
import { listFolders } from "../../folders/services/folders.api";
import { createFolder } from "../../folders/services/folders.api";
import { fileToBase64 } from "../../../shared/utils/files/fileToBase64";
import type { Department } from "../../../app/adapter/api/admin.api";
import type { DocumentType } from "../../../app/adapter/api/admin.api";
import type { Tag } from "../../../app/adapter/api/admin.api";
import type { Folder } from "../../folders/types/folders.types";

/** Form state type: all fields present, file optional until selected. */
export type UploadFormValues = {
  upload_kind: "main" | "sub" | "attachment";
  target_document_id?: number;
  department_id: number;
  document_type_id: number;
  title: string;
  file?: File;
  folder_id?: number;
  create_folder?: boolean;
  folder_name?: string;
  folder_code?: string;
  folder_type?: string;
  folder_description?: string;
  confidentiality_level: "internal" | "public" | "confidential" | "strict";
  po_number?: string;
  bl_number?: string;
  container_number?: string;
  invoice_number?: string;
  envoy_number?: string;
  tags?: number[];
};

export type UploadDocumentFormValues = UploadFormValues;

export interface UploadDocumentSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Optional initial values (e.g. from query params). */
  initialValues?: Partial<UploadFormValues>;
  /** When true, upload type, department, folder link and create-folder fields are disabled (e.g. opened from folder detail). */
  lockFolderContext?: boolean;
}

export const UploadDocumentSidePanel = ({
  isOpen,
  onClose,
  onSuccess,
  initialValues,
  lockFolderContext = false,
}: UploadDocumentSidePanelProps) => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const uploadDocumentSchema = useMemo(() => {
    const baseOptional = {
      confidentiality_level: z.enum(["public", "internal", "confidential", "strict"]).default("internal"),
      po_number: z.string().optional(),
      bl_number: z.string().optional(),
      container_number: z.string().optional(),
      invoice_number: z.string().optional(),
      envoy_number: z.string().optional(),
      tags: z.array(z.number()).optional(),
    };
    const fileRequired = z
      .union([z.instanceof(File), z.undefined()])
      .refine((v): v is File => v instanceof File, { message: t("documents.validation.fileRequired") });
    const attachmentSchema = z.object({
      upload_kind: z.literal("attachment"),
      target_document_id: z.coerce.number().min(1, t("documents.validation.targetDocumentIdRequired")),
      title: z.string().min(1, t("documents.validation.titleRequired")),
      file: fileRequired,
      department_id: z.coerce.number().optional(),
      document_type_id: z.coerce.number().optional(),
      folder_id: z.coerce.number().optional(),
      folder_type: z.string().optional(),
      folder_description: z.string().optional(),
      ...baseOptional,
    });
    const optionalTargetDocumentId = z.preprocess(
      (val) => (val === "" || val === undefined || (typeof val === "number" && Number.isNaN(val)) ? undefined : val),
      z.number().optional()
    );
    const mainSubSchema = z
      .object({
        upload_kind: z.enum(["main", "sub"]),
        department_id: z.coerce.number().min(1, t("documents.validation.departmentRequired")),
        document_type_id: z.coerce.number().min(1, t("documents.validation.documentTypeRequired")),
        title: z.string().min(1, t("documents.validation.titleRequired")),
        file: fileRequired,
        target_document_id: optionalTargetDocumentId,
        folder_id: z.coerce.number().optional(),
        create_folder: z.boolean().optional(),
        folder_name: z.string().optional(),
        folder_code: z.string().optional(),
        folder_type: z.string().optional(),
        folder_description: z.string().optional(),
        ...baseOptional,
      })
      .superRefine((data, ctx) => {
        if (data.upload_kind === "main") {
          if (!(data.folder_name ?? "").trim()) {
            ctx.addIssue({ path: ["folder_name"], message: t("documents.validation.folderNameRequired"), code: z.ZodIssueCode.custom });
          }
          if (!(data.folder_code ?? "").trim()) {
            ctx.addIssue({ path: ["folder_code"], message: t("documents.validation.folderCodeRequired"), code: z.ZodIssueCode.custom });
          }
        }
        if (data.upload_kind === "sub") {
          const fid = data.folder_id;
          if (fid == null || Number(fid) < 1) {
            ctx.addIssue({ path: ["folder_id"], message: t("documents.validation.folderRequiredForSubDocument"), code: z.ZodIssueCode.custom });
          }
        }
      });
    return z.discriminatedUnion("upload_kind", [attachmentSchema, mainSubSchema]);
  }, [t]);

  const UPLOAD_KIND_OPTIONS: SelectOption<string>[] = useMemo(
    () => [
      { value: "main", label: t("documents.mainDocument") },
      { value: "sub", label: t("documents.subDocument") },
      { value: "attachment", label: t("documents.attachment") },
    ],
    [t]
  );

  const CONFIDENTIALITY_OPTIONS: SelectOption<string>[] = useMemo(
    () => [
      { value: "internal", label: t("documents.confidentiality.internal") },
      { value: "public", label: t("documents.confidentiality.public") },
      { value: "confidential", label: t("documents.confidentiality.confidential") },
      { value: "strict", label: t("documents.confidentiality.strict") },
    ],
    [t]
  );

  const FOLDER_TYPE_OPTIONS: SelectOption<string>[] = useMemo(
    () =>
      FOLDER_TYPE_VALUES.map((value) => ({
        value,
        label: t(`documents.folderTypeOptions.${value}`, { defaultValue: value }),
      })),
    [t]
  );

  const {
    control,
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UploadFormValues>({
    mode: "onChange",
    resolver: zodResolver(uploadDocumentSchema) as Resolver<UploadFormValues>,
    defaultValues: {
      upload_kind: "main",
      target_document_id: undefined,
      department_id: 0,
      document_type_id: 0,
      title: "",
      folder_id: undefined,
      create_folder: false,
      folder_name: "",
      folder_code: "",
      folder_type: "other",
      folder_description: "",
      confidentiality_level: "internal",
      po_number: "",
      bl_number: "",
      container_number: "",
      invoice_number: "",
      envoy_number: "",
      tags: [],
      file: undefined,
      ...initialValues,
    },
  });

  const uploadKind = watch("upload_kind");
  const departmentId = watch("department_id");
  const documentTypeId = watch("document_type_id");
  const title = watch("title");
  const folderName = watch("folder_name");
  const folderCode = watch("folder_code");
  const targetDocumentId = watch("target_document_id");
  const folderId = watch("folder_id");
  const selectedFile = watch("file");

  // Clear new-folder fields when switching away from main document so they stay hidden and don't carry over
  useEffect(() => {
    if (uploadKind !== "main") {
      setValue("folder_name", "");
      setValue("folder_code", "");
      setValue("folder_type", "other");
      setValue("folder_description", "");
    }
  }, [uploadKind, setValue]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const [deptsRes, tagsRes] = await Promise.all([
          adminApi.getDepartments(),
          adminApi.getTags(),
        ]);
        if (!cancelled && deptsRes?.data) setDepartments(deptsRes.data);
        if (!cancelled && tagsRes?.data) setTags(tagsRes.data);
      } catch {
        if (!cancelled) setDepartments([]);
        if (!cancelled) setTags([]);
      }
    })();
    return () => {
      cancelled = true;
    };
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
          // Preserve folder_id when opened from folder detail (e.g. "Upload in folder") for this department
          const preserveFolder =
            lockFolderContext &&
            initialValues?.folder_id != null &&
            (initialValues?.department_id ?? 0) === departmentId;
          if (!preserveFolder) {
            setValue("folder_id", undefined);
          }
        }
      } catch {
        if (!cancelled) {
          setDocumentTypes([]);
          setFolders([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [departmentId, setValue, lockFolderContext, initialValues?.folder_id, initialValues?.department_id]);

  useEffect(() => {
    if (isOpen) {
      // When opened from folder detail: default upload type to "sub document" unless overridden
      // When adding attachment: default to "attachment" and lock the field
      const defaultUploadKind = initialValues?.upload_kind ?? (lockFolderContext ? "sub" : "main");
      const values: UploadFormValues = {
        upload_kind: defaultUploadKind,
        target_document_id: initialValues?.target_document_id,
        department_id: initialValues?.department_id ?? 0,
        document_type_id: initialValues?.document_type_id ?? 0,
        title: initialValues?.title ?? "",
        folder_id: initialValues?.folder_id,
        create_folder: initialValues?.create_folder ?? false,
        folder_name: initialValues?.folder_name ?? "",
        folder_code: initialValues?.folder_code ?? "",
        folder_type: initialValues?.folder_type ?? "other",
        folder_description: initialValues?.folder_description ?? "",
        confidentiality_level: initialValues?.confidentiality_level ?? "internal",
        po_number: initialValues?.po_number ?? "",
        bl_number: initialValues?.bl_number ?? "",
        container_number: initialValues?.container_number ?? "",
        invoice_number: initialValues?.invoice_number ?? "",
        envoy_number: initialValues?.envoy_number ?? "",
        tags: initialValues?.tags ?? [],
        file: undefined,
      };
      reset(values);
      setSubmitError(null);
    }
  }, [isOpen, reset, initialValues, lockFolderContext]);

  const onSubmit = async (data: UploadFormValues) => {
    setSubmitError(null);
    setIsUploading(true);
    try {
      const file = data.file;
      if (!(file instanceof File)) {
        setSubmitError(t("documents.validation.fileRequired"));
        setIsUploading(false);
        return;
      }
      const fileData = await fileToBase64(file);

      if (data.upload_kind === "attachment") {
        const docId = Number(data.target_document_id);
        if (!docId) {
          const msg = t("documents.validation.targetDocumentIdRequired");
          setSubmitError(msg);
          toast.error(msg);
          return;
        }
        const result = await documentsApi.addAttachment(docId, {
          name: data.title.trim(),
          file_name: file.name,
          file_data: fileData,
          description: null,
          attachment_type: "supporting",
        });
        if (!result.success) throw new Error(result.error ?? "Add attachment failed");
        toast.success(t("documents.uploadSuccess") || "Document uploaded successfully.");
        onSuccess?.();
        onClose();
        return;
      }

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
        title: data.title.trim(),
        file_data: fileData,
        file_name: file.name,
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
      toast.success(t("documents.uploadSuccess") || "Document uploaded successfully.");
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = async () => {
    setSubmitError(null);
    const isValid = await trigger(undefined, { shouldFocus: true });
    if (!isValid) {
      const msg = t("common.fixErrorsBelow");
      setSubmitError(msg);
      toast.error(msg);
      return;
    }
    await handleSubmit(onSubmit)();
  };

  const titleRegistration = register("title");
  const departmentOptions: SelectOption[] = departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }));
  const documentTypeOptions: SelectOption[] = documentTypes.map((dt) => ({ value: dt.id, label: `${dt.name} (${dt.code})` }));
  const folderOptions: SelectOption[] = [{ value: 0, label: t("common.none") }, ...folders.map((f) => ({ value: f.id, label: `${f.name} — ${f.code}` }))];
  const tagOptions: SelectOption[] = tags.map((tag) => ({ value: tag.id, label: tag.name }));

  const uploadWhatDocumentLabel = useMemo(() => {
    const typeKey =
      uploadKind === "main"
        ? "documents.mainDocument"
        : uploadKind === "sub"
          ? "documents.subDocument"
          : "documents.attachment";
    return t("documents.uploadWhatDocument", { type: t(typeKey) });
  }, [uploadKind, t]);

  // Enable Upload when all required (*) fields are filled, including file.
  const hasRequiredTitle = typeof title === "string" && title.trim().length > 0;
  const hasFile = selectedFile instanceof File;
  const canSubmit =
    hasRequiredTitle &&
    hasFile &&
    (uploadKind === "attachment"
      ? Number(targetDocumentId) >= 1
      : Number(departmentId) >= 1 &&
        Number(documentTypeId) >= 1 &&
        (uploadKind !== "sub" || Number(folderId) >= 1) &&
        (uploadKind !== "main" ||
          ((folderName ?? "").trim().length > 0 && (folderCode ?? "").trim().length > 0)));

  const submitDisabled = !canSubmit || isUploading;

  /** Memoized random integer 1–1000; only invoked on title blur to avoid running on every render. */
  const getRandom1To1000 = useMemo(() => Math.floor(Math.random() * 1000) + 1, []);

  /**
   * Builds suggested folder name for main-document upload: DeptCode-DocTypeCode-Title_Random.
   * Runs on title blur when department and document type are selected.
   */
  const fillFolderNameFromTitle = useCallback(
    (titleValue: string) => {
      if (uploadKind !== "main" || !departmentId || departmentId < 1 || !documentTypeId || documentTypeId < 1) return;
      const dept = departments.find((d) => d.id === Number(departmentId));
      const docType = documentTypes.find((dt) => dt.id === Number(documentTypeId));
      const trimmed = (titleValue ?? "").trim();
      if (!dept?.code || !docType?.code || !trimmed) return;
      const sanitizedTitle = trimmed.replace(/\s+/g, "_");
      const random = getRandom1To1000;
      setValue("folder_name", `${dept.code}-${docType.code}-${sanitizedTitle}_${random}`, { shouldValidate: true });
      setValue("folder_code", String(random), { shouldValidate: true });
    },
    [uploadKind, departmentId, documentTypeId, departments, documentTypes, getRandom1To1000, setValue]
  );

  const handleClearFile = () => {
    setValue("file", undefined, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const footer = (
    <div className="d-flex gap-2 justify-content-end">
      <Button variant="secondary" onClick={onClose} disabled={isUploading}>
        Cancel
      </Button>
      <Button
        variant="secondary"
        isLoading={isUploading}
        onClick={handleUploadClick}
        disabled={submitDisabled}
      >
        {t("documents.uploadDocument")}
      </Button>
    </div>
  );

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t("documents.uploadNewDocument")}
      footer={footer}
      loading={isUploading}
      width="50vw"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleUploadClick();
        }}
        className="d-flex flex-column gap-0"
      >
        {submitError && (
          <div className="alert alert-danger py-2 mb-3" role="alert">
            {submitError}
          </div>
        )}

        <h6 className="fw-semibold mb-2">{t("documents.basicDocumentInfo")}</h6>

        <div className="d-flex flex-column gap-2">
          <label className="form-label d-flex align-items-center gap-1">
            {t("documents.uploadType")}
            <InfoWrapper
              content={t("documents.uploadTypeMainDocumentInfo")}
              triggerClassName="text-muted"
            />
          </label>
          <SelectField
            control={control}
            name="upload_kind"
            options={UPLOAD_KIND_OPTIONS}
            isStringValue
            isDisabled={lockFolderContext}
            isClearable={false}
            error={errors.upload_kind?.message as string | undefined}
          />
        </div>

        {uploadKind === "attachment" && (
          <Input
            label={t("documents.targetDocumentId")}
            type="number"
            {...register("target_document_id", { valueAsNumber: true })}
            error={errors.target_document_id?.message}
            required
            disabled={initialValues?.target_document_id != null && Number(initialValues.target_document_id) >= 1}
          />
        )}

        {uploadKind !== "attachment" && (
          <>
            <SelectField
              control={control}
              name="department_id"
              options={departmentOptions}
              label="Department"
              placeholder="Select department"
              required
              isDisabled={lockFolderContext}
              error={errors.department_id?.message as string | undefined}
            />
            <SelectField
              control={control}
              name="document_type_id"
              options={documentTypeOptions}
              label={t("documents.documentType")}
              placeholder={departmentId ? t("common.selectDocumentType") : t("common.selectDepartmentFirst")}
              isDisabled={!departmentId || departmentId < 1}
              required
              error={errors.document_type_id?.message as string | undefined}
            />
          </>
        )}

        <Input
          label={t("documents.documentTitle")}
          {...titleRegistration}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            titleRegistration.onBlur(e);
            fillFolderNameFromTitle(e.target.value ?? "");
          }}
          error={errors.title?.message}
          required
          autoComplete="off"
        />

        {uploadKind !== "attachment" && (
          <>
            {uploadKind === "sub" && (
              <SelectField
                control={control}
                name="folder_id"
                options={folderOptions}
                label={t("documents.linkToFolder")}
                placeholder="None"
                required
                isDisabled={lockFolderContext || !departmentId || departmentId < 1}
                allowZero
                error={errors.folder_id?.message as string | undefined}
              />
            )}

            {uploadKind === "main" && (
              <>
                <Input
                  label={t("documents.newFolderName")}
                  {...register("folder_name")}
                  error={errors.folder_name?.message}
                  autoComplete="off"
                  required={!lockFolderContext}
                  disabled={lockFolderContext}
                />
                <Input
                  label={t("documents.newFolderCode")}
                  {...register("folder_code")}
                  error={errors.folder_code?.message}
                  autoComplete="off"
                  required={!lockFolderContext}
                  disabled={lockFolderContext}
                />
                <SelectField
                  control={control}
                  name="folder_type"
                  options={FOLDER_TYPE_OPTIONS}
                  label={t("documents.folderType")}
                  placeholder={t("common.other")}
                  isStringValue
                  isDisabled={lockFolderContext}
                  error={errors.folder_type?.message as string | undefined}
                />
                <div className="mb-3">
                  <label className="form-label">Folder description</label>
                  <textarea
                    className="form-control"
                    {...register("folder_description")}
                    rows={2}
                    autoComplete="off"
                    disabled={lockFolderContext}
                  />
                </div>
              </>
            )}

            <SelectField
              control={control}
              name="confidentiality_level"
              options={CONFIDENTIALITY_OPTIONS}
              label={t("documents.confidentialityLevel")}
              isStringValue
              error={errors.confidentiality_level?.message as string | undefined}
            />
          </>
        )}

        <div className="mb-3">
          <label className="form-label">
            {uploadWhatDocumentLabel}
            <span className="text-danger ms-1">*</span>
          </label>
          <input
            type="file"
            className="d-none"
            id="upload-doc-file"
            accept="*/*"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setValue("file", file, { shouldValidate: true });
              } else {
                setValue("file", undefined, { shouldValidate: true });
              }
            }}
          />
          <div className="d-flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className={`flex-grow-1 ${errors.file ? "is-invalid" : ""}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="paperclip" className="me-1" />
              {selectedFile instanceof File ? `Selected: ${selectedFile.name}` : "Select File"}
            </Button>
            {selectedFile instanceof File && (
              <Button type="button" variant="outline" className="btn-outline-secondary" onClick={handleClearFile}>
                <Icon name="x" className="me-1" />
                {t("common.remove", { defaultValue: "Remove" })}
              </Button>
            )}
          </div>
          {errors.file && <div className="invalid-feedback d-block">{errors.file.message as string}</div>}
        </div>

        {uploadKind !== "attachment" && (
          <>
            <h6 className="fw-semibold mb-2 mt-2">
              <Icon name="search" className="me-1" />
              {t("documents.searchableNumbersOptional")}
            </h6>
            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <Input label={t("documents.poNumber")} {...register("po_number")} placeholder="PO-2024-001" autoComplete="off" />
              </div>
              <div className="col-md-4">
                <Input label={t("documents.blNumber")} {...register("bl_number")} placeholder="BL-2024-001" autoComplete="off" />
              </div>
              <div className="col-md-4">
                <Input label={t("documents.containerNumber")} {...register("container_number")} placeholder="CONT-2024-001" autoComplete="off" />
              </div>
              <div className="col-md-6">
                <Input label={t("documents.invoiceNumber")} {...register("invoice_number")} placeholder="INV-2024-001" autoComplete="off" />
              </div>
              <div className="col-md-6">
                <Input label={t("documents.envoyNumber")} {...register("envoy_number")} placeholder="ENV-2024-001" autoComplete="off" />
              </div>
            </div>

            <MultiSelectField
              control={control}
              name="tags"
              options={tagOptions}
              label={t("documents.tagsOptional")}
              placeholder={t("common.selectTags")}
              error={errors.tags?.message as string | undefined}
            />
          </>
        )}
      </form>
    </SidePanel>
  );
};
