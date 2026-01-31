/**
 * useArchiveTrash - Hook for archive trash
 * Provides trashed documents data with static fallback by default
 */

import { useState, useEffect } from "react";
import type { Document } from "../types/archive.types";

interface UseArchiveTrashOptions {
  useApi?: boolean;
}

// Static mock data
const staticTrashedItems: Document[] = [
  { name: "Old_Policy_2019.pdf", type: "PDF", updated: "Today" },
  { name: "Invoice_2020_Q4.xlsx", type: "Spreadsheet", updated: "Yesterday" },
  { name: "Draft_Contract.docx", type: "Document", updated: "3 days ago" },
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
    console.log("Restore item:", itemId);
  };

  const deletePermanently = async (itemId: number) => {
    // TODO: Implement permanent delete API call when useApi is true
    console.log("Delete permanently:", itemId);
  };

  const emptyTrash = async () => {
    // TODO: Implement empty trash API call when useApi is true
    console.log("Empty trash");
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
