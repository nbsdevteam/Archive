import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchApi } from "../../adapter/api/search.api";
import type { SearchResult } from "../../adapter/api/search.api";
import { useDebounce } from "../../../shared/hooks/useDebounce";
export interface HeaderSearchProps {
  routes: Record<string, string>;
  t: (key: string) => string;
}

/**
 * Header global search: controlled input, debounced API call, dropdown results.
 * Navigates to document/folder/note on result click; closes on outside click or Escape.
 */
export function HeaderSearch({ routes, t }: HeaderSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const headerSearchRef = useRef<HTMLDivElement>(null);

  const normalizeType = useCallback((type: string | undefined): "document" | "folder" | "note" => {
    const lowerType = type?.toLowerCase();
    if (lowerType === "folder") return "folder";
    if (lowerType === "note") return "note";
    return "document";
  }, []);

  const getEffectiveType = useCallback(
    (item: SearchResult): "document" | "folder" | "note" => normalizeType(item.type ?? item.entity_type),
    [normalizeType]
  );

  const getDisplayName = useCallback(
    (item: SearchResult) => {
      const type = getEffectiveType(item);
      if (type === "document") return item.title || item.name || "-";
      if (type === "note") return item.title || "-";
      return item.name || item.title || "-";
    },
    [getEffectiveType]
  );

  /** Dates are already in Arabia Standard Time from the API. */
  const formatDateCompact = useCallback((value: string | undefined): string => {
    return value?.trim() ? value : "-";
  }, []);

  const getMeta = useCallback(
    (item: SearchResult): string => {
      const type = getEffectiveType(item);
      if (type === "document") {
        if (item.barcode?.trim()) return item.barcode.trim();
        return formatDateCompact(item.upload_date ?? item.created_at);
      }
      if (type === "note") return formatDateCompact(item.updated_at ?? item.created_at);
      return formatDateCompact(item.create_date ?? item.created_at);
    },
    [formatDateCompact, getEffectiveType]
  );

  useEffect(() => {
    if (debouncedSearchTerm.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);
    searchApi
      .globalSearch({ query: debouncedSearchTerm.trim(), search_in_content: true, fuzzy: true })
      .then((res) => {
        if (!cancelled) {
          setSearchResults(res.data || []);
          setSearchError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError(err?.message || t("header.searchFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedSearchTerm, t]);

  /** Close dropdown on outside click or Escape; AbortController used only when multiple listeners. */
  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;
    const handleClickOutside = (e: MouseEvent) => {
      if (headerSearchRef.current && !headerSearchRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside, { signal });
    document.addEventListener("keydown", handleEscape, { signal });
    return () => abortController.abort();
  }, []);

  const handleSearchResultClick = useCallback(
    (item: SearchResult) => {
      setSearchDropdownOpen(false);
      setSearchTerm("");
      setSearchResults([]);
      const type = getEffectiveType(item);
      if (type === "document") {
        navigate(routes.documentDetail.replace(":id", String(item.id)));
      } else if (type === "folder") {
        navigate(routes.folderDetail.replace(":id", String(item.id)));
      } else if (type === "note") {
        if (item.folder_id) {
          navigate(routes.folderDetail.replace(":id", String(item.folder_id)));
        } else {
          setSearchError(t("header.noteFolderNotFound") || "Note's folder not found");
          setTimeout(() => setSearchError(null), 3000);
        }
      }
    },
    [navigate, getEffectiveType, routes.documentDetail, routes.folderDetail, t]
  );

  /** Updates search input and opens dropdown when query length >= 2. */
  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      if (value.trim().length >= 2) setSearchDropdownOpen(true);
    },
    []
  );

  /** Opens dropdown on focus if current term is long enough to show results. */
  const handleSearchInputFocus = useCallback(() => {
    if (searchTerm.trim().length >= 2) setSearchDropdownOpen(true);
  }, [searchTerm]);

  /** Navigates to the result row clicked; reads result index from data-result-index. */
  const handleSearchResultRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => {
      const index = e.currentTarget.dataset.resultIndex;
      if (index != null) {
        const item = searchResults[Number(index)];
        if (item) handleSearchResultClick(item);
      }
    },
    [searchResults, handleSearchResultClick]
  );

  /** Handles Enter/Space on result row for accessibility. */
  const handleSearchResultRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const index = e.currentTarget.dataset.resultIndex;
        if (index != null) {
          const item = searchResults[Number(index)];
          if (item) handleSearchResultClick(item);
        }
      }
    },
    [searchResults, handleSearchResultClick]
  );

  return (
    <div ref={headerSearchRef} className="position-relative" style={{ minWidth: "280px", width: "50%", flex: "0 1 50%", maxWidth: "50%" }}>
      <div className="input-group input-group-flat d-inline-flex w-100">
        <span className="input-icon-addon">
          <i className="ti ti-search" aria-hidden></i>
        </span>
        <input
          type="text"
          className="form-control"
          placeholder={t("app.searchPlaceholder")}
          value={searchTerm}
          onChange={handleSearchInputChange}
          onFocus={handleSearchInputFocus}
          aria-label={t("app.searchPlaceholder")}
        />
        <span className="input-group-text">
          <kbd>CTRL + / </kbd>
        </span>
      </div>
      {searchTerm.trim().length >= 2 && searchDropdownOpen && (
        <div
          className="dropdown-menu show w-100 shadow-sm border mt-1 p-0"
          style={{ position: "absolute", inset: "auto auto auto 0", maxHeight: "320px", overflow: "auto", zIndex: 1050 }}
          role="listbox"
        >
          {searchLoading ? (
            <div className="p-3 text-center text-muted small">{t("app.searching")}</div>
          ) : searchError ? (
            <div className="p-3 text-danger small">{searchError}</div>
          ) : searchResults.length === 0 ? (
            <div className="p-3 text-muted small">{t("app.noResults")}</div>
          ) : (
            <div className="table-responsive mb-0">
              <table className="table table-sm table-hover mb-0">
                <thead>
                  <tr>
                    <th className="border-0 py-1 px-2 fs-11">{t("app.type")}</th>
                    <th className="border-0 py-1 px-2 fs-11">{t("app.name")}</th>
                    <th className="border-0 py-1 px-2 fs-11">{t("documents.department")}</th>
                    <th className="border-0 py-1 px-2 fs-11">{t("app.meta")}</th>
                    <th className="border-0 py-1 px-2 fs-11 text-end">{t("app.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((item, index) => {
                    const type = getEffectiveType(item);
                    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
                    return (
                      <tr
                        key={`${type}-${item.id}`}
                        style={{ cursor: "pointer" }}
                        role="button"
                        tabIndex={0}
                        data-result-index={index}
                        onClick={handleSearchResultRowClick}
                        onKeyDown={handleSearchResultRowKeyDown}
                      >
                        <td className="py-1 px-2 fs-12">
                          <div className="d-flex align-items-center gap-1">
                            {type === "document" ? (
                              <i className="ti ti-file text-primary" aria-hidden></i>
                            ) : type === "folder" ? (
                              <i className="ti ti-folder text-secondary" aria-hidden></i>
                            ) : (
                              <i className="ti ti-notes text-info" aria-hidden></i>
                            )}
                            <span>{typeLabel}</span>
                          </div>
                        </td>
                        <td className="py-1 px-2 fs-12">{getDisplayName(item)}</td>
                        <td className="py-1 px-2 fs-12">{item.department_name || "-"}</td>
                        <td className="py-1 px-2 fs-12">{getMeta(item)}</td>
                        <td className="py-1 px-2 fs-12 text-end">
                          <span className="badge bg-light text-dark">View</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
