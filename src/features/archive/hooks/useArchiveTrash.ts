/**
 * useArchiveTrash - Hook for archive trash
 * Provides trashed documents data with static fallback by default
 */

import { useState, useEffect } from "react";
import type { Document } from "../types/archive.types";

interface UseArchiveTrashOptions {
  useApi?: boolean;
}

// Static mock data: minimal Document shape for archive trash UI
const staticTrashedItems: Document[] = [
  {
    id: 1,
    title: "Old_Policy_2019.pdf",
    name: "Old_Policy_2019.pdf",
    department_id: 0,
    department_name: "",
    document_type_id: 0,
    document_type_name: "PDF",
    uploader_id: 0,
    uploader_name: "",
    upload_date: "",
    status: "trashed",
    confidentiality_level: "internal",
    barcode: "",
    file_name: "Old_Policy_2019.pdf",
    file_size: 0,
    type: "PDF",
    updated: "Today",
  },
  {
    id: 2,
    title: "Invoice_2020_Q4.xlsx",
    name: "Invoice_2020_Q4.xlsx",
    department_id: 0,
    department_name: "",
    document_type_id: 0,
    document_type_name: "Spreadsheet",
    uploader_id: 0,
    uploader_name: "",
    upload_date: "",
    status: "trashed",
    confidentiality_level: "internal",
    barcode: "",
    file_name: "Invoice_2020_Q4.xlsx",
    file_size: 0,
    type: "Spreadsheet",
    updated: "Yesterday",
  },
  {
    id: 3,
    title: "Draft_Contract.docx",
    name: "Draft_Contract.docx",
    department_id: 0,
    department_name: "",
    document_type_id: 0,
    document_type_name: "Document",
    uploader_id: 0,
    uploader_name: "",
    upload_date: "",
    status: "trashed",
    confidentiality_level: "internal",
    barcode: "",
    file_name: "Draft_Contract.docx",
    file_size: 0,
    type: "Document",
    updated: "3 days ago",
  },
];

export const useArchiveTrash = (options: UseArchiveTrashOptions = {}) => {
  const { useApi = false } = options;
  const [trashedItems, setTrashedItems] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrashedItems = async () => {
      setLoading(true);
      setError(null);
      try {
        if (useApi) {
          // TODO: Implement API call for trashed documents
          setTrashedItems(staticTrashedItems);
        } else {
          setTrashedItems(staticTrashedItems);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trashed items");
        setTrashedItems(staticTrashedItems);
      } finally {
        setLoading(false);
      }
    };

    fetchTrashedItems();
  }, [useApi]);

  const restoreItem = async (itemId: number) => {
    // TODO: Implement restore API call when useApi is true
    if (import.meta.env.DEV) console.log("Restore item:", itemId);
  };

  const deletePermanently = async (itemId: number) => {
    // TODO: Implement permanent delete API call when useApi is true
    if (import.meta.env.DEV) console.log("Delete permanently:", itemId);
  };

  const emptyTrash = async () => {
    // TODO: Implement empty trash API call when useApi is true
    if (import.meta.env.DEV) console.log("Empty trash");
  };

  return {
    trashedItems,
    loading,
    error,
    restoreItem,
    deletePermanently,
    emptyTrash,
  };
};
