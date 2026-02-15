import { useEffect, useMemo } from "react";
import type { DocumentDetail, DocumentVersion } from "@/app/adapter/api/documents.api";
import { clearDocumentPreviewCache } from "@/app/adapter/api/documents.api";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { getDocumentTypeName, getDepartmentName, getUploaderName } from "@/features/documents/utils/documentShapeHelpers";

/**
 * Fetches document by id and derives display fields (title, fileName, versions, ocr, etc.).
 * Clears preview cache to ensure the latest version is shown.
 */
export function useDocumentDetailData(docId: number | null) {
  const {
    currentDocument,
    isLoading,
    error: storeError,
    fetchDocument,
  } = useDocumentStore();

  useEffect(() => {
    if (docId) {
      // Clear preview cache to ensure latest version is shown
      clearDocumentPreviewCache(docId).catch(() => {
        // Ignore cache clear errors - fetchDocument will still work
      });
      fetchDocument(docId);
    }
  }, [docId, fetchDocument]);

  const doc = currentDocument as DocumentDetail | null;

  const title = doc?.name ?? doc?.title ?? "–";
  // Use centralized shape helpers for consistent backend field reading
  const documentTypeName = getDocumentTypeName(doc) || "–";
  const departmentName = getDepartmentName(doc) || "–";
  const uploaderName = getUploaderName(doc) || "–";
  const versions: DocumentVersion[] = Array.isArray(doc?.versions) ? doc.versions : [];
  const tags = Array.isArray(doc?.tags) ? doc.tags : [];
  const ocr = doc?.ocr ?? {};
  const ocrStatus = (doc?.ocr_status ?? (ocr as { ocr_status?: string })?.ocr_status) ?? "pending";
  /** Backend returns newest version first in version history. */
  const latestVersion = versions.length > 0 ? versions[0] : null;
  const fileName =
    (doc?.file_name && doc.file_name.trim() !== "")
      ? doc.file_name
      : (latestVersion?.file_name ?? "");
  const fileExt = (fileName.split(".").pop() ?? "").toLowerCase();
  const isOcrSupported = ["pdf", "jpg", "jpeg", "png", "tiff"].includes(fileExt);
  const latestVersionId = latestVersion?.id;
  const isTrashed = useMemo(() => {
    const status = String(doc?.status ?? "").toLowerCase();
    return status.includes("trash") || status.includes("deleted");
  }, [doc?.status]);
  const isArchived = (doc?.status ?? "").toLowerCase() === "archived";

  return {
    doc,
    title,
    documentTypeName,
    departmentName,
    uploaderName,
    versions,
    tags,
    ocr,
    ocrStatus,
    fileName,
    fileExt,
    isOcrSupported,
    latestVersionId,
    latestVersion,
    isTrashed,
    isArchived,
    isLoading,
    storeError,
    fetchDocument,
  };
}
