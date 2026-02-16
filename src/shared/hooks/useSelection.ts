import { useCallback, useMemo, useState } from "react";

/**
 * Generic selection state for tables (e.g. DataTable).
 * Returns selectedIds, a SelectionConfig-compatible object, clear, setAll, and deselectIds helpers.
 */
export function useSelection<T>(
  rows: T[],
  getId: (row: T) => string | number
): {
  selectedIds: (string | number)[];
  selectionConfig: {
    selectedIds: (string | number)[];
    onToggle: (id: string | number) => void;
    onToggleAll: () => void;
    isAllSelected: boolean;
    isIndeterminate: boolean;
    getRowAriaLabel?: (row: T) => string;
  };
  clear: () => void;
  setAll: () => void;
  /** Removes the given ids from the current selection (e.g. to uncheck main documents). */
  deselectIds: (idsToDeselect: (string | number)[]) => void;
} {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const rowIds = useMemo(() => rows.map(getId), [rows, getId]);
  const isAllSelected = rowIds.length > 0 && selectedIds.length === rowIds.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < rowIds.length;

  const onToggle = useCallback((id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const onToggleAll = useCallback(() => {
    if (rowIds.length === 0) return;
    setSelectedIds(isAllSelected ? [] : [...rowIds]);
  }, [rowIds, isAllSelected]);

  const clear = useCallback(() => setSelectedIds([]), []);
  const setAll = useCallback(() => setSelectedIds([...rowIds]), [rowIds]);
  const deselectIds = useCallback((idsToDeselect: (string | number)[]) => {
    const set = new Set(idsToDeselect);
    setSelectedIds((prev) => prev.filter((id) => !set.has(id)));
  }, []);

  const selectionConfig = useMemo(
    () => ({
      selectedIds,
      onToggle,
      onToggleAll,
      isAllSelected,
      isIndeterminate,
      getRowAriaLabel: (row: T) => `Select row ${getId(row)}`,
    }),
    [selectedIds, onToggle, onToggleAll, isAllSelected, isIndeterminate, getId]
  );

  return { selectedIds, selectionConfig, clear, setAll, deselectIds };
}
