import { useCallback, useEffect, useMemo, useState } from "react";
import { handleApiError } from "@/app/adapter/api/client";
import { getFolderDocuments } from "../../services/folders.api";
import type { FolderDetail } from "../../types/folders.types";
import type { Document } from "@/app/adapter/api/documents.api";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { sortFolderDocumentsByUploadDate } from "../../utils/sortFolderDocumentsByUploadDate";

/** Folder role for main document (only this is shown in Main document section). */
const FOLDER_ROLE_MAIN = "main";

function isMainRole(role: string | undefined): boolean {
  return (role ?? "").toLowerCase() === FOLDER_ROLE_MAIN;
}

function isSecondaryRole(role: string | undefined): boolean {
  const r = (role ?? "").toLowerCase();
  return r === "sub" || r === "other";
}

/**
 * Fetches folder and its documents. Derives mainDoc from folder_role === "main", subDocs from "sub" | "other".
 * Optionally sets initial attachmentsDocId to main doc when present, else first secondary doc.
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
      const folderData = result.folder ?? null;
      
      if (import.meta.env.DEV) {
        console.log("[useFolderDetailData] Loaded folder:", {
          id: folderData?.id,
          name: folderData?.name,
          company_id: folderData?.company_id,
          company_name: folderData?.company_name,
          fullFolder: folderData,
        });
      }
      
      setFolder(folderData);
      const docs = result.data ?? [];
      setDocuments(docs);
      const main = docs.find((d) => isMainRole(d.folder_role));
      const secondary = docs.filter((d) => isSecondaryRole(d.folder_role));
      const docToPreload = main ?? sortFolderDocumentsByUploadDate(secondary)[0] ?? null;
      if (docToPreload?.id) {
        await fetchDocument(docToPreload.id);
        if (attachmentsDocId === "") setAttachmentsDocId(docToPreload.id);
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
  /** Main document section: only the document with folder_role "main". */
  const mainDoc = useMemo(() => docsSorted.find((d) => isMainRole(d.folder_role)) ?? null, [docsSorted]);
  /** Secondary documents section: documents with folder_role "sub" or "other". */
  const subDocs = useMemo(() => docsSorted.filter((d) => isSecondaryRole(d.folder_role)), [docsSorted]);

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
