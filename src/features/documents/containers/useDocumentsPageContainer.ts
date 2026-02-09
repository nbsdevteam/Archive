import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { all_routes } from "../../../router/all_routes";
import { adminApi } from "../../../app/adapter/api/admin.api";
import { useRunOnceOnMount } from "../../../shared/hooks";
import type { SelectOption } from "../../../shared/components/ui";
import { useDocumentStore } from "../stores/documentStore";
import { getDocumentStatusBadgeVariant } from "../utils/getDocumentStatusBadgeVariant";
import { toast } from "react-toastify";
import { handleApiError } from "../../../app/adapter/api/client";

export interface DocumentsFilterState {
  department_id?: number;
  document_type_id?: number;
}

export const useDocumentsPageContainer = () => {
  const { t } = useTranslation();
  const routes = all_routes;
  const navigate = useNavigate();
  const { documents, isLoading, fetchDocuments, error, clearError, pagination, trashDocument } =
    useDocumentStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<DocumentsFilterState>({});
  const [draftFilters, setDraftFilters] = useState<DocumentsFilterState>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [trashTargetId, setTrashTargetId] = useState<number | null>(null);
  const [isTrashing, setIsTrashing] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [documentTypes, setDocumentTypes] = useState<Array<{ id: number; name: string; code: string; department_id: number; department_name: string }>>([]);
  const lastSearchRef = useRef<string>("");

  useRunOnceOnMount(fetchDocuments);

  useEffect(() => {
    let cancelled = false;
    adminApi.getDepartments().then((res) => {
      if (!cancelled && res?.data) {
        setDepartments(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const filterApplyDisabled = useMemo(
    () =>
      draftFilters.department_id === appliedFilters.department_id &&
      draftFilters.document_type_id === appliedFilters.document_type_id,
    [
      draftFilters.department_id,
      draftFilters.document_type_id,
      appliedFilters.department_id,
      appliedFilters.document_type_id,
    ]
  );

  const getFetchParams = useCallback(() => {
    const search = lastSearchRef.current;
    const params: { department_id?: number; document_type_id?: number; search?: string } = {
      ...appliedFilters,
    };
    if (search.length >= 1) {
      params.search = search;
    }
    return params;
  }, [appliedFilters]);

  const handleSearchDebounced = useCallback(
    (value: string) => {
      const hadSearch = lastSearchRef.current.length >= 1;
      lastSearchRef.current = value;
      if (value.length >= 1) {
        fetchDocuments({ ...getFetchParams(), search: value });
      } else if (hadSearch) {
        fetchDocuments(getFetchParams());
      }
    },
    [fetchDocuments, getFetchParams]
  );

  const handleNavigateToDocument = useCallback(
    (documentId: number) => {
      navigate(`${routes.documentDetail.replace(":id", documentId.toString())}`);
    },
    [navigate, routes.documentDetail]
  );

  const handleOpenUpload = useCallback(() => {
    setIsUploadOpen(true);
  }, []);

  const handleCloseUpload = useCallback(() => {
    setIsUploadOpen(false);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    fetchDocuments(getFetchParams());
    setIsUploadOpen(false);
  }, [fetchDocuments, getFetchParams]);

  const handleRetry = useCallback(() => {
    clearError();
    fetchDocuments(getFetchParams());
  }, [clearError, fetchDocuments, getFetchParams]);

  const handleRefresh = useCallback(() => {
    fetchDocuments(getFetchParams());
  }, [fetchDocuments, getFetchParams]);

  const handleOpenTrashConfirm = useCallback((documentId: number) => {
    setTrashTargetId(documentId);
  }, []);

  const handleCloseTrashConfirm = useCallback(() => {
    if (!isTrashing) setTrashTargetId(null);
  }, [isTrashing]);

  const handleConfirmTrash = useCallback(async () => {
    if (!trashTargetId) return;
    setIsTrashing(true);
    try {
      await trashDocument(trashTargetId);
      toast.success(t("documents.trashed", { defaultValue: "Document moved to trash." }));
      fetchDocuments(getFetchParams());
      setTrashTargetId(null);
    } catch (e: unknown) {
      const apiMessage = handleApiError(e);
      const message = apiMessage !== "An unexpected error occurred" ? apiMessage : (e instanceof Error ? e.message : null);
      toast.error(message || t("documents.trashFailed", { defaultValue: "Failed to move to trash." }));
    } finally {
      setIsTrashing(false);
    }
  }, [trashTargetId, trashDocument, fetchDocuments, getFetchParams]);

  const handleOpenFilter = useCallback(() => {
    setDraftFilters(appliedFilters);
    setIsFilterOpen(true);
  }, [appliedFilters]);

  const handleCloseFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const handlePrimaryFilterChange = useCallback((value: number | string | null) => {
    setDraftFilters((prev) => ({
      ...prev,
      department_id: value != null && typeof value === "number" ? value : undefined,
      document_type_id: undefined,
    }));
  }, []);

  const handleSecondaryFilterChange = useCallback((value: number | string | null) => {
    setDraftFilters((prev) => ({
      ...prev,
      document_type_id: value != null && typeof value === "number" ? value : undefined,
    }));
  }, []);

  const handleApplyFilter = useCallback(() => {
    setAppliedFilters(draftFilters);
    const params = {
      ...draftFilters,
      ...(lastSearchRef.current.length >= 1 ? { search: lastSearchRef.current } : {}),
    };
    fetchDocuments(params);
    setIsFilterOpen(false);
  }, [draftFilters, fetchDocuments]);

  const handleClearFilter = useCallback(() => {
    setDraftFilters({});
    setAppliedFilters({});
    const params =
      lastSearchRef.current.length >= 1 ? { search: lastSearchRef.current } : undefined;
    fetchDocuments(params);
    setIsFilterOpen(false);
  }, [fetchDocuments]);

  return {
    routes,
    documents,
    isLoading,
    error,
    pagination,
    isUploadOpen,
    handleSearchDebounced,
    handleNavigateToDocument,
    handleOpenUpload,
    handleCloseUpload,
    handleUploadSuccess,
    handleRetry,
    handleRefresh,
    getDocumentStatusBadgeVariant,
    isFilterOpen,
    draftFilters,
    departmentOptions,
    documentTypeOptions,
    handleOpenFilter,
    handleCloseFilter,
    handlePrimaryFilterChange,
    handleSecondaryFilterChange,
    handleApplyFilter,
    handleClearFilter,
    filterApplyDisabled,
    trashTargetId,
    isTrashing,
    handleOpenTrashConfirm,
    handleCloseTrashConfirm,
    handleConfirmTrash,
  };
};
