import { useMemo, useState } from "react";
import type { TFunction } from "i18next";

export type DocumentDetailTabId =
  | "preview"
  | "download"
  | "versions"
  | "attachments"
  | "notes"
  | "ocr"
  | "signatures"
  | "relations"
  | "audit";

/**
 * Tab list and active tab state for document detail.
 */
export function useDocumentTabs(t: TFunction) {
  const [activeTab, setActiveTab] = useState<string>("preview");

  const tabs = useMemo(
    () => [
      { id: "preview", label: t("documents.preview", { defaultValue: "Preview" }) },
      { id: "download", label: t("documents.download", { defaultValue: "Download" }) },
      { id: "versions", label: t("documents.versionHistory", { defaultValue: "Version history" }) },
      { id: "attachments", label: t("documents.attachments", { defaultValue: "Attachments" }) },
      { id: "notes", label: t("documents.notes", { defaultValue: "Notes" }) },
      { id: "ocr", label: t("documents.ocr", { defaultValue: "OCR" }) },
      { id: "signatures", label: t("documents.signatureRequests", { defaultValue: "Signature requests" }) },
      { id: "relations", label: t("documents.relations", { defaultValue: "Relations" }) },
      { id: "audit", label: t("documents.audit", { defaultValue: "Audit log" }) },
    ],
    [t]
  );

  return { tabs, activeTab, setActiveTab };
}
