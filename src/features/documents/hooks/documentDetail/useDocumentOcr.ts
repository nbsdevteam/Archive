import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ocrApi } from "@/app/adapter/api/ocr.api";

/**
 * Run OCR flow for document detail.
 */
export function useDocumentOcr(
  docId: number | null,
  fetchDocument: (id: number) => Promise<void>
) {
  const { t } = useTranslation();
  const [runOcrLoading, setRunOcrLoading] = useState(false);

  const handleRunOcr = useCallback(async () => {
    if (!docId) return;
    setRunOcrLoading(true);
    try {
      await ocrApi.runOcr(docId);
      await fetchDocument(docId);
      toast.success(t("documents.ocrStarted", { defaultValue: "OCR started." }));
    } catch (e) {
      toast.error((e as Error)?.message ?? t("documents.ocrFailed", { defaultValue: "OCR failed." }));
    } finally {
      setRunOcrLoading(false);
    }
  }, [docId, t, fetchDocument]);

  return { runOcrLoading, handleRunOcr };
}
