import { z } from "zod";
import type { TFunction } from "i18next";

/** Builds the edit document form zod schema with translated messages. File and unlock token are optional. */
export function getEditDocumentSchema(t: TFunction) {
  return z.object({
    title: z.string().min(1, t("documents.validation.titleRequired")),
    department_id: z.coerce.number().min(1, t("documents.validation.departmentRequired")),
    document_type_id: z.coerce.number().min(1, t("documents.validation.documentTypeRequired")),
    confidentiality_level: z.enum(["public", "internal", "confidential", "strict"]).default("internal"),
    folder_id: z.coerce.number().optional(),
    po_number: z.string().optional(),
    bl_number: z.string().optional(),
    container_number: z.string().optional(),
    invoice_number: z.string().optional(),
    envoy_number: z.string().optional(),
    tags: z.array(z.number()).optional(),
    changeDescription: z.string().optional(),
    unlockToken: z.string().optional(),
  });
}

export type EditDocumentSchemaType = z.infer<ReturnType<typeof getEditDocumentSchema>>;
