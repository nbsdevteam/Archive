/** Form state type for upload panel: all fields present, file optional until selected. */
export type UploadFormValues = {
  upload_kind: "main" | "sub" | "attachment";
  /** When true and upload_kind is "main", multiple files can be selected; one folder per file is auto-created from filename. */
  upload_multiple_main?: boolean;
  /** When true and upload_kind is "sub", multiple files can be selected; each file becomes one sub document in the selected folder. */
  upload_multiple_sub?: boolean;
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
  folder_company_id?: number;
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
  initialValues?: Partial<UploadFormValues>;
  lockFolderContext?: boolean;
}

/** Default form values merged with initialValues; used for reset and useForm defaultValues. */
export function getDefaultUploadFormValues(initialValues?: Partial<UploadFormValues>, lockFolderContext?: boolean): UploadFormValues {
  const defaultKind = initialValues?.upload_kind ?? (lockFolderContext ? "sub" : "main");
  return {
    upload_kind: defaultKind,
    upload_multiple_main: initialValues?.upload_multiple_main ?? false,
    upload_multiple_sub: initialValues?.upload_multiple_sub ?? false,
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
    folder_company_id: initialValues?.folder_company_id ?? 0,
    confidentiality_level: initialValues?.confidentiality_level ?? "internal",
    po_number: initialValues?.po_number ?? "",
    bl_number: initialValues?.bl_number ?? "",
    container_number: initialValues?.container_number ?? "",
    invoice_number: initialValues?.invoice_number ?? "",
    envoy_number: initialValues?.envoy_number ?? "",
    tags: initialValues?.tags ?? [],
    file: undefined,
  };
}
