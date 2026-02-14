import { useMemo } from "react";
import { useParams } from "react-router-dom";

/**
 * Parses and validates document id from route params.
 * Returns null if the id is missing or not a valid number.
 */
export function useDocumentDetailIds() {
  const { id } = useParams<{ id: string }>();
  const docId = useMemo(() => {
    if (!id) return null;
    const n = parseInt(id, 10);
    return Number.isFinite(n) ? n : null;
  }, [id]);
  return { docId };
}
