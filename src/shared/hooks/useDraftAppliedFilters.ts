import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Shallow equality for plain filter objects (same keys, same values).
 */
function shallowEqualFilter(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
}

export interface UseDraftAppliedFiltersOptions<T> {
  /** Initial applied filter state. */
  initialApplied?: T;
}

/**
 * Generic draft/applied filter panel state: open/close, draft vs applied, apply/clear.
 * Use in list pages (documents, folders) to avoid duplicating filter UI state logic.
 * Domain-specific options (department, document type, folder type) stay in the feature;
 * this hook only manages the state machine.
 */
export function useDraftAppliedFilters<T extends object>(
  options: UseDraftAppliedFiltersOptions<T> = {}
) {
  const { initialApplied = {} as T } = options;

  const [appliedFilters, setAppliedFilters] = useState<T>(initialApplied);
  const [draftFilters, setDraftFilters] = useState<T>(initialApplied);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterApplyDisabled = useMemo(
    () =>
      shallowEqualFilter(
        draftFilters as Record<string, unknown>,
        appliedFilters as Record<string, unknown>
      ),
    [draftFilters, appliedFilters]
  );

  const handleOpenFilter = useCallback(() => {
    setDraftFilters(appliedFilters);
    setIsFilterOpen(true);
  }, [appliedFilters]);

  const handleCloseFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  /** Applies draft to applied and closes. Caller should refetch using draftFilters (same as new applied). */
  const handleApplyFilter = useCallback(() => {
    setAppliedFilters(draftFilters);
    setIsFilterOpen(false);
  }, [draftFilters]);

  /** Clears draft and applied and closes. Caller should refetch with empty filters. */
  const handleClearFilter = useCallback(() => {
    const empty = {} as T;
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setIsFilterOpen(false);
  }, []);

  return {
    appliedFilters,
    setAppliedFilters: setAppliedFilters as Dispatch<SetStateAction<T>>,
    draftFilters,
    setDraftFilters: setDraftFilters as Dispatch<SetStateAction<T>>,
    isFilterOpen,
    handleOpenFilter,
    handleCloseFilter,
    handleApplyFilter,
    handleClearFilter,
    filterApplyDisabled,
  };
}
