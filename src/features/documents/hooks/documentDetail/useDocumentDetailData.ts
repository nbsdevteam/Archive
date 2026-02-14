import { useEffect, useMemo } from "react";
import type { DocumentDetail, DocumentVersion } from "@/app/adapter/api/documents.api";
import { useDocumentStore } from "@/features/documents/stores/documentStore";

/**
 * Fetches document by id and derives display fields (title, fileName, versions, ocr, etc.).
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
      fetchDocument(docId);
    }
  }, [docId, fetchDocument]);

  const doc = currentDocument as DocumentDetail | null;

  const title = doc?.name ?? doc?.title ?? "–";
  const documentTypeName =
    (doc?.document_type as { name?: string })?.name ?? doc?.document_type_name ?? "–";
  const departmentName = (doc?.department as { name?: string })?.name ?? doc?.department_name ?? "–";
  const uploaderName = (doc?.uploader_name as string) ?? "–";
  const versions: DocumentVersion[] = Array.isArray(doc?.versions) ? doc.versions : [];
  const tags = Array.isArray(doc?.tags) ? doc.tags : [];
  const ocr = doc?.ocr ?? {};
  const ocrStatus = (doc?.ocr_status ?? (ocr as { ocr_status?: string })?.ocr_status) ?? "pending";
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : null;
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
