import { useMemo } from "react";
import { useParams } from "react-router-dom";

/**
 * Parses and validates folder id from route params.
 * Returns null if the id is missing or not a valid number.
 */
export function useFolderDetailIds() {
  const { id } = useParams<{ id: string }>();
  const folderId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);
  return { folderId };
}
