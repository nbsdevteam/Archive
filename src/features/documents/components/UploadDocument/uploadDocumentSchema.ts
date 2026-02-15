import { z } from "zod";
import type { TFunction } from "i18next";

/** Builds the upload form zod schema with translated validation messages. */
export function getUploadDocumentSchema(t: TFunction) {
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
    title: z.string().optional(),
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
      upload_multiple_main: z.boolean().optional(),
      department_id: z.coerce.number().min(1, t("documents.validation.departmentRequired")),
      document_type_id: z.coerce.number().min(1, t("documents.validation.documentTypeRequired")),
      title: z.string().optional(),
      file: z.union([z.instanceof(File), z.undefined()]),
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
      const isMainMulti = data.upload_kind === "main" && data.upload_multiple_main === true;
      if (data.upload_kind === "main") {
        if (!isMainMulti) {
          if (!(data.title ?? "").trim()) {
            ctx.addIssue({ path: ["title"], message: t("documents.validation.titleRequired"), code: z.ZodIssueCode.custom });
          }
          if (!(data.folder_name ?? "").trim()) {
            ctx.addIssue({ path: ["folder_name"], message: t("documents.validation.folderNameRequired"), code: z.ZodIssueCode.custom });
          }
          if (!(data.folder_code ?? "").trim()) {
            ctx.addIssue({ path: ["folder_code"], message: t("documents.validation.folderCodeRequired"), code: z.ZodIssueCode.custom });
          }
          if (!(data.file instanceof File)) {
            ctx.addIssue({ path: ["file"], message: t("documents.validation.fileRequired"), code: z.ZodIssueCode.custom });
          }
        }
      }
      if (data.upload_kind === "sub") {
        const fid = data.folder_id;
        if (fid == null || Number(fid) < 1) {
          ctx.addIssue({ path: ["folder_id"], message: t("documents.validation.folderRequiredForSubDocument"), code: z.ZodIssueCode.custom });
        }
        if (!(data.file instanceof File)) {
          ctx.addIssue({ path: ["file"], message: t("documents.validation.fileRequired"), code: z.ZodIssueCode.custom });
        }
      }
    });
  return z.discriminatedUnion("upload_kind", [attachmentSchema, mainSubSchema]);
}
