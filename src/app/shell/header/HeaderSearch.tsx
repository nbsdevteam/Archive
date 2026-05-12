import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Folder, StickyNote } from "lucide-react";
import { searchApi } from "../../adapter/api/search.api";
import type { SearchResult } from "../../adapter/api/search.api";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { useShortcuts } from "@/shared/shortcuts/ShortcutsContext";
import { SHORTCUT_KEYS } from "@/shared/shortcuts/shortcutsRegistry";
import { DataTable } from "@/shared/components/ui";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
export interface HeaderSearchProps {
  routes: Record<string, string>;
  t: (key: string) => string;
}

/**
 * Header global search: controlled input, debounced API call, dropdown results.
 * Navigates to document/folder/note on result click; closes on outside click or Escape.
 * Registers global-search (Alt + /) with ShortcutsProvider so the overlay lists it and the chord is handled centrally.
 */
export function HeaderSearch({ routes, t }: HeaderSearchProps) {
  const { registerHandler } = useShortcuts();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const headerSearchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const searchColumns: ColumnDef<SearchResult>[] = useMemo(
    () => [
      {
        id: "type",
        header: t("app.type"),
        headerClassName: "border-0 py-1 px-2 fs-11",
        className: "py-1 px-2 fs-12",
        render: (item) => {
          const type = getEffectiveType(item);
          const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
          return (
            <div className="d-flex align-items-center gap-1">
              {type === "document" ? (
                <FileText size={16} className="text-primary" aria-hidden />
              ) : type === "folder" ? (
                <Folder size={16} className="text-secondary" aria-hidden />
              ) : (
                <StickyNote size={16} className="text-info" aria-hidden />
              )}
              <span>{typeLabel}</span>
            </div>
          );
        },
      },
      {
        id: "name",
        header: t("app.name"),
        headerClassName: "border-0 py-1 px-2 fs-11",
        className: "py-1 px-2 fs-12",
        truncate: true,
        render: (item) => getDisplayName(item),
      },
      {
        id: "department",
        header: t("documents.department"),
        headerClassName: "border-0 py-1 px-2 fs-11",
        className: "py-1 px-2 fs-12",
        truncate: true,
        render: (item) => item.department_name || "-",
      },
      {
        id: "meta",
        header: t("app.meta"),
        headerClassName: "border-0 py-1 px-2 fs-11",
        className: "py-1 px-2 fs-12",
        truncate: true,
        render: (item) => getMeta(item),
      },
      {
        id: "action",
        header: t("app.action"),
        headerClassName: "border-0 py-1 px-2 fs-11 text-end",
        className: "py-1 px-2 fs-12 text-end",
        render: () => <span className="badge bg-light text-dark">View</span>,
      },
    ],
    [t, getEffectiveType, getDisplayName, getMeta]
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

  /** Registers Alt + / with the app shortcuts system (overlay + global key handler). */
  const focusGlobalSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    registerHandler(SHORTCUT_KEYS.GLOBAL_SEARCH, focusGlobalSearch);
    return () => registerHandler(SHORTCUT_KEYS.GLOBAL_SEARCH, undefined);
  }, [registerHandler, focusGlobalSearch]);

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

  return (
    <div ref={headerSearchRef} className="position-relative" style={{ minWidth: "280px", width: "50%", flex: "0 1 50%", maxWidth: "50%" }}>
      <div className="input-group input-group-flat d-inline-flex w-100">
        <span className="input-icon-addon">
          <Search size={16} aria-hidden />
        </span>
        <input
          ref={searchInputRef}
          type="text"
          className="form-control"
          placeholder={t("app.searchPlaceholder")}
          value={searchTerm}
          onChange={handleSearchInputChange}
          onFocus={handleSearchInputFocus}
          aria-label={t("app.searchPlaceholder")}
        />
        <span className="input-group-text">
          <kbd>ALT + /</kbd>
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
            <DataTable<SearchResult>
              data={searchResults}
              getRowId={(row) => `${getEffectiveType(row)}-${row.id}`}
              columns={searchColumns}
              onRowClick={handleSearchResultClick}
              responsive="table"
              tableClassName="table table-sm table-hover mb-0"
            />
          )}
        </div>
      )}
    </div>
  );
}
