import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SidePanel } from "@/shared/components/ui";
import type { SelectOption } from "@/shared/components/ui";
import { documentsApi } from "@/app/adapter/api/documents.api";
import type { DocumentDetail } from "@/app/adapter/api/documents.api";
import { adminApi } from "@/app/adapter/api/admin.api";
import { listFolders } from "@/features/folders/services/folders.api";
import type { Department } from "@/app/adapter/api/admin.api";
import type { DocumentType } from "@/app/adapter/api/admin.api";
import type { Folder } from "@/features/folders/types/folders.types";
import { fileToBase64 } from "@/shared/utils/files/fileToBase64";
import type { EditDocumentFormValues, EditDocumentSidePanelProps } from "./types";
import { getEditDocumentSchema } from "./editDocumentSchema";
import { EditDocumentFormContent } from "./EditDocumentFormContent";
import { Button } from "@/shared/components/ui";

/** Default form values when no document is loaded. */
function getDefaultEditFormValues(): EditDocumentFormValues {
  return {
    title: "",
    department_id: 0,
    document_type_id: 0,
    confidentiality_level: "internal",
    folder_id: undefined,
    po_number: "",
    bl_number: "",
    container_number: "",
    invoice_number: "",
    envoy_number: "",
    tags: [],
    changeDescription: "",
    unlockToken: "",
  };
}

/** Maps document detail to form default values for prefill. */
function documentToEditFormValues(doc: DocumentDetail): EditDocumentFormValues {
  const tags = (doc as DocumentDetail).tags?.map((t) => t.id) ?? [];
  const folderId = doc.folder_id != null && doc.folder_id > 0 ? doc.folder_id : 0;
  return {
    title: doc.title ?? (doc as { name?: string }).name ?? "",
    department_id: doc.department_id ?? 0,
    document_type_id: doc.document_type_id ?? 0,
    confidentiality_level: (doc.confidentiality_level as EditDocumentFormValues["confidentiality_level"]) ?? "internal",
    folder_id: folderId,
    po_number: typeof doc.po_number === "string" ? doc.po_number : "",
    bl_number: typeof doc.bl_number === "string" ? doc.bl_number : "",
    container_number: typeof doc.container_number === "string" ? doc.container_number : "",
    invoice_number: typeof doc.invoice_number === "string" ? doc.invoice_number : "",
    envoy_number: typeof doc.envoy_number === "string" ? doc.envoy_number : "",
    tags: tags.length > 0 ? tags : [],
    changeDescription: "",
    unlockToken: "",
  };
}

/** Builds update params from form values (only fields that backend accepts). */
function formValuesToUpdateParams(values: EditDocumentFormValues, isSubDoc: boolean): Record<string, unknown> {
  const params: Record<string, unknown> = {
    title: values.title.trim(),
    department_id: values.department_id,
    document_type_id: values.document_type_id,
    confidentiality_level: values.confidentiality_level,
  };
  if (values.po_number?.trim()) params.po_number = values.po_number.trim();
  if (values.bl_number?.trim()) params.bl_number = values.bl_number.trim();
  if (values.container_number?.trim()) params.container_number = values.container_number.trim();
  if (values.invoice_number?.trim()) params.invoice_number = values.invoice_number.trim();
  if (values.envoy_number?.trim()) params.envoy_number = values.envoy_number.trim();
  if (values.tags && values.tags.length > 0) params.tags = values.tags;
  if (isSubDoc && values.folder_id != null) params.folder_id = values.folder_id > 0 ? values.folder_id : null;
  return params;
}

/** Returns true if any metadata field differs from the original document. */
function hasMetadataChanges(values: EditDocumentFormValues, doc: DocumentDetail, isSubDoc: boolean): boolean {
  const current = documentToEditFormValues(doc);
  if (values.title.trim() !== (current.title ?? "")) return true;
  if (values.department_id !== current.department_id) return true;
  if (values.document_type_id !== current.document_type_id) return true;
  if (values.confidentiality_level !== current.confidentiality_level) return true;
  if ((values.po_number ?? "") !== (current.po_number ?? "")) return true;
  if ((values.bl_number ?? "") !== (current.bl_number ?? "")) return true;
  if ((values.container_number ?? "") !== (current.container_number ?? "")) return true;
  if ((values.invoice_number ?? "") !== (current.invoice_number ?? "")) return true;
  if ((values.envoy_number ?? "") !== (current.envoy_number ?? "")) return true;
  const tagsA = (values.tags ?? []).slice().sort((a, b) => a - b).join(",");
  const tagsB = (current.tags ?? []).slice().sort((a, b) => a - b).join(",");
  if (tagsA !== tagsB) return true;
  if (isSubDoc && (values.folder_id ?? 0) !== (current.folder_id ?? 0)) return true;
  return false;
}

/**
 * Edit document side panel: fetches full document on open, prefills form,
 * allows editing metadata and optionally uploading a new version (replace file).
 */
export function EditDocumentSidePanel({ isOpen, documentId, onClose, onSuccess }: EditDocumentSidePanelProps) {
  const { t } = useTranslation();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<{ id: number; name: string }[]>([]);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);

  const schema = useMemo(() => getEditDocumentSchema(t), [t]);
  const defaultValues = useMemo(() => getDefaultEditFormValues(), []);

  const { control, register, formState: { errors }, reset, watch, setValue, handleSubmit, trigger } = useForm<EditDocumentFormValues>({
    mode: "onChange",
    resolver: zodResolver(schema) as Resolver<EditDocumentFormValues>,
    defaultValues,
  });

  const departmentId = watch("department_id");

  // Fetch document when panel opens with a valid id.
  useEffect(() => {
    if (!isOpen || !documentId || documentId < 1) {
      setDoc(null);
      return;
    }
    let cancelled = false;
    setLoadingDoc(true);
    setSubmitError(null);
    documentsApi
      .getDocument(documentId)
      .then((res) => {
        if (!cancelled && res?.data) setDoc(res.data as DocumentDetail);
      })
      .catch(() => {
        if (!cancelled) {
          setDoc(null);
          setSubmitError(t("errors.loadFailed", { defaultValue: "Failed to load document." }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDoc(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, documentId, t]);

  // Prefill form when doc is loaded.
  useEffect(() => {
    if (doc) {
      reset(documentToEditFormValues(doc));
      setReplaceFile(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  }, [doc, reset]);

  // Load departments and tags when panel opens.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    Promise.all([adminApi.getDepartments(), adminApi.getTags()])
      .then(([deptsRes, tagsRes]) => {
        if (!cancelled && deptsRes?.data) setDepartments(deptsRes.data);
        if (!cancelled && tagsRes?.data) setTags(tagsRes.data);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
        if (!cancelled) setTags([]);
      });
    return () => { cancelled = true; };
  }, [isOpen]);

  // Load document types and folders when department changes.
  useEffect(() => {
    if (!departmentId || departmentId < 1) {
      setDocumentTypes([]);
      setFolders([]);
      return;
    }
    let cancelled = false;
    Promise.all([adminApi.getDocumentTypes(departmentId), listFolders({ department_id: departmentId })])
      .then(([typesRes, foldersRes]) => {
        if (!cancelled) {
          setDocumentTypes(typesRes?.data ?? []);
          setFolders(foldersRes?.folders ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setDocumentTypes([]);
        if (!cancelled) setFolders([]);
      });
    return () => { cancelled = true; };
  }, [departmentId]);

  const handleReplaceFileChange = useCallback((file: File | null) => {
    setReplaceFile(file);
  }, []);

  const handleClearReplaceFile = useCallback(() => {
    setReplaceFile(null);
    setValue("changeDescription", "");
    setValue("unlockToken", "");
    if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
  }, [setValue]);

  const isSubDoc = doc ? !(doc.is_main_document === true) : false;
  const isLocked = doc?.is_locked === true;
  const isInFolder = doc?.folder_id != null && doc.folder_id > 0;
  const tagOptions: SelectOption[] = useMemo(() => tags.map((tag) => ({ value: tag.id, label: tag.name })), [tags]);

  const onSubmit = useCallback(
    async (values: EditDocumentFormValues) => {
      if (!documentId || !doc) return;
      if (replaceFile && isLocked && !(values.unlockToken ?? "").trim()) {
        setSubmitError(t("documents.unlockTokenRequiredWhenLocked", { defaultValue: "Unlock token is required to upload a new version for a locked document." }));
        toast.error(t("documents.unlockTokenRequiredWhenLocked", { defaultValue: "Unlock token is required to upload a new version for a locked document." }));
        return;
      }
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        if (replaceFile) {
          const fileData = await fileToBase64(replaceFile);
          await documentsApi.uploadVersion(
            documentId,
            fileData,
            replaceFile.name,
            isLocked ? (values.unlockToken ?? "").trim() : "",
            (values.changeDescription ?? "").trim() || "New version from edit"
          );
        }
        const didChangeMetadata = hasMetadataChanges(values, doc, isSubDoc);
        if (didChangeMetadata) {
          const params = formValuesToUpdateParams(values, isSubDoc);
          await documentsApi.updateDocument(documentId, params as Parameters<typeof documentsApi.updateDocument>[1]);
        }
        toast.success(t("documents.updateSuccess", { defaultValue: "Document updated successfully." }));
        onSuccess?.();
        onClose();
      } catch (err) {
        const msg = err instanceof Error ? err.message : t("common.unexpectedError", { defaultValue: "Unexpected error" });
        setSubmitError(msg);
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [documentId, doc, isSubDoc, isLocked, replaceFile, onSuccess, onClose, t]
  );

  const handleSaveClick = useCallback(async () => {
    const valid = await trigger(undefined, { shouldFocus: true });
    if (!valid) {
      const msg = t("common.fixErrorsBelow");
      setSubmitError(msg);
      toast.error(msg);
      return;
    }
    await handleSubmit(onSubmit)();
  }, [trigger, handleSubmit, onSubmit, t]);

  if (!isOpen) return null;

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={t("documents.editDocument", { defaultValue: "Edit document" })}
      footer={
        <div className="d-flex gap-2 justify-content-end">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button variant="secondary" isLoading={isSubmitting} onClick={handleSaveClick} disabled={loadingDoc || !doc}>
            {t("common.save", { defaultValue: "Save" })}
          </Button>
        </div>
      }
      loading={loadingDoc || isSubmitting}
      width="50vw"
    >
      {submitError && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {submitError}
        </div>
      )}
      {loadingDoc && !doc && (
        <div className="text-muted text-center py-4">{t("common.loading", { defaultValue: "Loading…" })}</div>
      )}
      {!loadingDoc && !doc && documentId != null && (
        <div className="alert alert-warning mb-0">{t("errors.notFound", { defaultValue: "Document not found." })}</div>
      )}
      {doc && (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveClick(); }} className="d-flex flex-column gap-0">
          <EditDocumentFormContent
            control={control}
            register={register}
            errors={errors}
            setValue={setValue}
            isSubDoc={isSubDoc}
            isInFolder={isInFolder}
            departmentId={departmentId}
            departments={departments}
            documentTypes={documentTypes}
            folders={folders}
            tagOptions={tagOptions}
            isLocked={isLocked}
            replaceFile={replaceFile}
            replaceFileInputRef={replaceFileInputRef}
            onReplaceFileChange={handleReplaceFileChange}
            onClearReplaceFile={handleClearReplaceFile}
            t={t}
          />
        </form>
      )}
    </SidePanel>
  );
}
