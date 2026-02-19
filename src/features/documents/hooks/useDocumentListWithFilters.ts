import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/app/adapter/api/admin.api";
import type { Document } from "@/app/adapter/api/documents.api";
import type { SelectOption } from "@/shared/components/ui";
import { useDocumentStore } from "@/features/documents/stores/documentStore";
import { useDepartmentsStore } from "@/shared/stores/departmentsStore";
import { useCompaniesStore } from "@/shared/stores/companiesStore";
import { useRunOnceOnMount, useSelection } from "@/shared/hooks";

export interface DocumentListFilterState {
  department_id?: number;
  document_type_id?: number;
  company_id?: number;
}

export interface UseDocumentListWithFiltersOptions {
  /** If set, all fetches include this status (e.g. "archived"). */
  status?: string;
  /** If true, fetches use page/per_page and the hook returns pagination + handlePageChange. */
  paginated?: boolean;
  /** When set (e.g. from URL), fetches use this page and refetch when it changes. */
  pageOverride?: number;
  /** When set (e.g. from URL), fetches use this per_page and refetch when it changes. */
  perPageOverride?: number;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Shared hook for document list pages: filter state, department/document-type options,
 * search ref, selection, and refetch params. Uses useDepartmentsStore for departments everywhere.
 * Used by useDocumentsPageContainer and useArchivedDocumentsPageContainer to avoid duplication.
 */
export function useDocumentListWithFilters(
  options: UseDocumentListWithFiltersOptions = {}
) {
  const { status, paginated = false, pageOverride, perPageOverride } = options;

  const [appliedFilters, setAppliedFilters] = useState<DocumentListFilterState>({});
  const [draftFilters, setDraftFilters] = useState<DocumentListFilterState>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<
    Array<{
      id: number;
      name: string;
      code: string;
      department_id: number;
      department_name: string;
    }>
  >([]);

  const { t } = useTranslation();
  const {
    documents,
    isLoading,
    fetchDocuments,
    error,
    clearError,
    pagination,
  } = useDocumentStore();
  const { departments, fetchDepartments } = useDepartmentsStore();
  const { companies, fetchCompanies } = useCompaniesStore();
  const lastSearchRef = useRef<string>("");

  const {
    selectedIds: selectedDocumentIdsRaw,
    selectionConfig: baseSelectionConfig,
    clear: clearSelection,
    deselectIds: deselectDocumentIds,
  } = useSelection<Document>(documents, (d) => d.id);

  const selectedDocumentIds = useMemo(
    () => selectedDocumentIdsRaw.map((id) => Number(id)),
    [selectedDocumentIdsRaw]
  );

  /** Builds fetch params from current filter state, optional status, search ref, and pagination. */
  const getFetchParams = useCallback(
    (overrides?: { page?: number; per_page?: number }) => {
      const search = lastSearchRef.current;
      const params: Record<string, unknown> = {
        ...appliedFilters,
        ...(status != null ? { status } : {}),
        ...(search.length >= 1 ? { search } : {}),
      };
      if (paginated) {
        params.page = overrides?.page ?? pageOverride ?? 1;
        params.per_page = overrides?.per_page ?? perPageOverride ?? DEFAULT_PAGE_SIZE;
      }
      return params;
    },
    [appliedFilters, status, paginated, pageOverride, perPageOverride]
  );

  const initialFetch = useCallback(() => {
    fetchDocuments(getFetchParams());
  }, [fetchDocuments, getFetchParams]);

  useRunOnceOnMount(() => {
    fetchDepartments();
  });
  useRunOnceOnMount(() => {
    fetchCompanies({ limit: 100 });
  });
  /** When paginated with URL overrides, the effect below does the fetch; otherwise run once on mount. */
  useRunOnceOnMount(() => {
    if (paginated && (pageOverride != null || perPageOverride != null)) return;
    initialFetch();
  });

  /** When URL-driven page/per_page are provided, fetch so list stays in sync with URL (and on mount). */
  useEffect(() => {
    if (!paginated) return;
    if (pageOverride != null || perPageOverride != null) {
      fetchDocuments(
        getFetchParams({
          page: pageOverride ?? 1,
          per_page: perPageOverride ?? DEFAULT_PAGE_SIZE,
        })
      );
    }
  }, [paginated, pageOverride, perPageOverride, fetchDocuments, getFetchParams]);

  const departmentIdForTypes = draftFilters.department_id;

  useEffect(() => {
    if (departmentIdForTypes == null || departmentIdForTypes < 1) {
      setDocumentTypes([]);
      return;
    }
    let cancelled = false;
    adminApi.getDocumentTypes(departmentIdForTypes).then((res) => {
      if (!cancelled && res?.data) {
        setDocumentTypes(res.data);
      } else if (!cancelled) {
        setDocumentTypes([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [departmentIdForTypes]);

  const departmentOptions: SelectOption<number>[] = useMemo(
    () => departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
    [departments]
  );

  const documentTypeOptions: SelectOption<number>[] = useMemo(
    () => documentTypes.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
    [documentTypes]
  );

  const companyOptions: SelectOption<number>[] = useMemo(
    () => companies.map((c) => ({ value: c.id, label: c.name })),
    [companies]
  );

  const filterApplyDisabled = useMemo(
    () =>
      draftFilters.department_id === appliedFilters.department_id &&
      draftFilters.document_type_id === appliedFilters.document_type_id &&
      draftFilters.company_id === appliedFilters.company_id,
    [
      draftFilters.department_id,
      draftFilters.document_type_id,
      draftFilters.company_id,
      appliedFilters.department_id,
      appliedFilters.document_type_id,
      appliedFilters.company_id,
    ]
  );

  const handleSearchDebounced = useCallback(
    (value: string) => {
      const hadSearch = lastSearchRef.current.length >= 1;
      lastSearchRef.current = value;
      if (paginated) {
        if (value.length >= 1) {
          fetchDocuments({ ...getFetchParams(), search: value, page: 1 });
        } else if (hadSearch) {
          fetchDocuments(getFetchParams());
        }
      } else {
        if (value.length >= 1) {
          fetchDocuments({ ...getFetchParams(), search: value });
        } else if (hadSearch) {
          fetchDocuments(getFetchParams());
        }
      }
    },
    [fetchDocuments, getFetchParams, paginated]
  );

  const handleOpenFilter = useCallback(() => {
    setDraftFilters(appliedFilters);
    setIsFilterOpen(true);
  }, [appliedFilters]);

  const handleCloseFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const handlePrimaryFilterChange = useCallback(
    (value: number | string | null) => {
      setDraftFilters((prev) => ({
        ...prev,
        department_id:
          value != null && typeof value === "number" ? value : undefined,
        document_type_id: undefined,
      }));
    },
    []
  );

  const handleSecondaryFilterChange = useCallback(
    (value: number | string | null) => {
      setDraftFilters((prev) => ({
        ...prev,
        document_type_id:
          value != null && typeof value === "number" ? value : undefined,
      }));
    },
    []
  );

  const handleTertiaryFilterChange = useCallback(
    (value: number | string | null) => {
      setDraftFilters((prev) => ({
        ...prev,
        company_id:
          value != null && typeof value === "number" ? value : undefined,
      }));
    },
    []
  );

  const handleApplyFilter = useCallback(() => {
    setAppliedFilters(draftFilters);
    const params: Record<string, unknown> = {
      ...draftFilters,
      ...(status != null ? { status } : {}),
      ...(lastSearchRef.current.length >= 1
        ? { search: lastSearchRef.current }
        : {}),
    };
    if (paginated) {
      params.page = 1;
      params.per_page = DEFAULT_PAGE_SIZE;
    }
    fetchDocuments(params);
    setIsFilterOpen(false);
  }, [draftFilters, fetchDocuments, status, paginated]);

  const handleClearFilter = useCallback(() => {
    setDraftFilters({});
    setAppliedFilters({});
    const params: Record<string, unknown> = {
      ...(status != null ? { status } : {}),
      ...(lastSearchRef.current.length >= 1
        ? { search: lastSearchRef.current }
        : {}),
    };
    if (paginated) {
      params.page = 1;
      params.per_page = DEFAULT_PAGE_SIZE;
    }
    fetchDocuments(params);
    setIsFilterOpen(false);
  }, [fetchDocuments, status, paginated]);

  const handleRetry = useCallback(() => {
    clearError();
    fetchDocuments(getFetchParams());
  }, [clearError, fetchDocuments, getFetchParams]);

  const handleRefresh = useCallback(() => {
    fetchDocuments(getFetchParams());
  }, [fetchDocuments, getFetchParams]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchDocuments({
        ...getFetchParams(),
        page,
        per_page: perPageOverride ?? DEFAULT_PAGE_SIZE,
      });
    },
    [fetchDocuments, getFetchParams, perPageOverride]
  );

  const isSomeSelected = selectedDocumentIds.length > 0;
  const selectionConfig = useMemo(
    () => ({
      ...baseSelectionConfig,
      getRowAriaLabel: (row: Document) =>
        t("documents.selectDocument", {
          defaultValue: 'Select document "{{title}}"',
          title: row.title || row.name || row.barcode || String(row.id),
        }),
    }),
    [baseSelectionConfig, t]
  );

  return {
    documents,
    isLoading,
    error,
    clearError,
    pagination,
    appliedFilters,
    draftFilters,
    isFilterOpen,
    departmentOptions,
    documentTypeOptions,
    companyOptions,
    filterApplyDisabled,
    lastSearchRef,
    getFetchParams,
    handleSearchDebounced,
    handleOpenFilter,
    handleCloseFilter,
    handlePrimaryFilterChange,
    handleSecondaryFilterChange,
    handleTertiaryFilterChange,
    handleApplyFilter,
    handleClearFilter,
    handleRetry,
    handleRefresh,
    handlePageChange,
    selectedDocumentIds,
    selectionConfig,
    clearSelection,
    deselectDocumentIds,
    isSomeSelected,
  };
}
