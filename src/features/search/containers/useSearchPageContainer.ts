import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { useSearchStore } from "../stores/searchStore";

export const useSearchPageContainer = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    results,
    isLoading,
    error,
    search,
    globalSearch,
    searchByBarcode,
    clearResults,
    clearError,
  } = useSearchStore();
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState<"standard" | "global" | "barcode">("standard");
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 1) {
      if (searchType === "barcode") {
        searchByBarcode(debouncedQuery.trim());
      } else if (searchType === "global") {
        globalSearch({ query: debouncedQuery.trim(), search_in_content: true, fuzzy: true });
      } else {
        search({ query: debouncedQuery.trim(), search_in_content: false });
      }
    } else {
      clearResults();
    }
  }, [debouncedQuery, searchType, search, globalSearch, searchByBarcode, clearResults]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleRetry = () => {
    clearError();
    if (searchQuery.trim()) {
      if (searchType === "barcode") {
        searchByBarcode(searchQuery.trim());
      } else if (searchType === "global") {
        globalSearch({ query: searchQuery.trim(), search_in_content: true, fuzzy: true });
      } else {
        search({ query: searchQuery.trim(), search_in_content: false });
      }
    }
  };

  const handleNavigateToDocument = (documentId: number) => {
    navigate(`${routes.documentDetail.replace(":id", documentId.toString())}`);
  };

  return {
    routes,
    results,
    isLoading,
    error,
    searchQuery,
    searchType,
    setSearchType,
    handleSearchChange,
    handleSearchKeyDown,
    handleRetry,
    handleNavigateToDocument,
  };
};
