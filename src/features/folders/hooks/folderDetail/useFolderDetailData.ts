import { useCallback, useEffect, useMemo, useState } from "react";
import { handleApiError } from "@/app/adapter/api/client";
import { getFolderDocuments } from "../../services/folders.api";
import type { FolderDetail } from "../../types/folders.types";
import type { Document } from "@/app/adapter/api/documents.api";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { sortFolderDocumentsByUploadDate } from "../../utils/sortFolderDocumentsByUploadDate";

/**
 * Fetches folder and its documents. Derives mainDoc/subDocs.
 * Optionally sets initial attachmentsDocId when first document loads.
 */
export function useFolderDetailData(
  folderId: number | null,
  attachmentsDocId: number | "",
  setAttachmentsDocId: (id: number | "") => void
) {
  const { fetchDocument } = useDocumentStore();
  const [folder, setFolder] = useState<FolderDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFolderDocuments = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getFolderDocuments(folderId);
      setFolder(result.folder ?? null);
      const docs = result.data ?? [];
      setDocuments(docs);
      if (docs.length > 0) {
        const first = sortFolderDocumentsByUploadDate(docs)[0];
        if (first?.id) {
          fetchDocument(first.id);
          if (attachmentsDocId === "") setAttachmentsDocId(first.id);
        }
      }
    } catch (e: unknown) {
      setError(handleApiError(e));
      setFolder(null);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [folderId, attachmentsDocId, setAttachmentsDocId, fetchDocument]);

  useEffect(() => {
    loadFolderDocuments();
  }, [folderId]);

  const docsSorted = useMemo(
    () => sortFolderDocumentsByUploadDate(documents),
    [documents]
  );
  const mainDoc = docsSorted[0] ?? null;
  const subDocs = docsSorted.slice(1);

  return {
    folder,
    documents,
    docsSorted,
    mainDoc,
    subDocs,
    loading,
    error,
    loadFolderDocuments,
  };
}
