import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { Alert, DataTable, Input } from "../../../shared/components/ui";
import type { ColumnDef } from "@/shared/components/ui/DataTable/DataTable.types";
import type { RowAction } from "@/shared/components/ui/DataTable/DataTable.types";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useSearchPageContainer } from "../containers/useSearchPageContainer";
import type { SearchResult } from "../types/search.types";
import "../styles/search.css";

/**
 * SearchPage - Search page with API integration. Uses i18n for all user-facing strings.
 * Results use DataTable with responsive card view on mobile/tablet.
 */
const SearchPage = () => {
  const { t } = useTranslation();
  const {
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
  } = useSearchPageContainer();

  const handleSetSearchTypeStandard = () => setSearchType("standard");
  const handleSetSearchTypeGlobal = () => setSearchType("global");
  const handleSetSearchTypeBarcode = () => setSearchType("barcode");

  const searchColumns: ColumnDef<SearchResult>[] = useMemo(
    () => [
      { id: "name", header: t("documents.name", { defaultValue: "Name" }), render: (row) => row.name || row.title || "–" },
      { id: "barcode", header: t("documents.barcode", { defaultValue: "Barcode" }), render: (row) => row.barcode || "–" },
      { id: "type", header: t("documents.type", { defaultValue: "Type" }), render: (row) => row.document_type_name || (row.document_type as { name?: string })?.name || "–" },
      { id: "department", header: t("documents.department", { defaultValue: "Department" }), render: (row) => row.department_name || (row.department as { name?: string })?.name || "–" },
      { id: "upload_date", header: t("documents.uploadDate", { defaultValue: "Upload Date" }), render: (row) => row.upload_date ?? row.created_at ?? "–" },
    ],
    [t]
  );

  const searchRowActions: RowAction<SearchResult>[] = useMemo(
    () => [
      { id: "view", label: t("common.view", { defaultValue: "View" }), icon: "eye", onClick: (row, e) => { e.stopPropagation(); handleNavigateToDocument(row.id); } },
    ],
    [t, handleNavigateToDocument]
  );

  return (
    <PageLayout
      title={t("search.title", { defaultValue: "Search" })}
      breadcrumbItems={[]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card search__search-card mb-3">
          <div className="card-body">
            <div className="d-flex gap-2 mb-2">
              <button
                type="button"
                className={`btn btn-sm ${searchType === "standard" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={handleSetSearchTypeStandard}
                aria-pressed={searchType === "standard"}
                aria-label={t("search.standardSearch", { defaultValue: "Standard search" })}
              >
                {t("search.standard", { defaultValue: "Standard" })}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${searchType === "global" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={handleSetSearchTypeGlobal}
                aria-pressed={searchType === "global"}
                aria-label={t("search.globalSearch", { defaultValue: "Global search" })}
              >
                {t("search.global", { defaultValue: "Global" })}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${searchType === "barcode" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={handleSetSearchTypeBarcode}
                aria-pressed={searchType === "barcode"}
                aria-label={t("search.barcodeSearch", { defaultValue: "Barcode search" })}
              >
                {t("search.barcode", { defaultValue: "Barcode" })}
              </button>
            </div>
            <Input
              type="text"
              placeholder={
                searchType === "barcode"
                  ? t("search.placeholderBarcode", { defaultValue: "Enter barcode..." })
                  : t("search.placeholderDocuments", { defaultValue: "Search documents..." })
              }
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="search__search-input"
              aria-label={t("search.inputAria", { defaultValue: "Search input" })}
            />
          </div>
        </div>

        <div className="card search__results-card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">{t("search.resultsTitle", { defaultValue: "Search Results" })}</h5>
            <span className="text-muted fs-13">
              {isLoading
                ? t("search.searching", { defaultValue: "Searching..." })
                : `${results?.length ?? 0} ${results?.length === 1 ? t("search.result", { defaultValue: "result" }) : t("search.results", { defaultValue: "results" })}`}
            </span>
          </div>
          <div className="card-body">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary ms-2"
                  onClick={handleRetry}
                >
                  {t("common.retry", { defaultValue: "Retry" })}
                </button>
              </Alert>
            )}
            <DataTable<SearchResult>
              data={results}
              getRowId={(row) => row.id}
              columns={searchColumns}
              loading={isLoading}
              emptyMessage={
                searchQuery.trim()
                  ? t("search.noResultsFound", { defaultValue: "No results found" })
                  : t("search.enterQueryToBegin", { defaultValue: "Enter a search query to begin" })
              }
              onRowClick={(row) => handleNavigateToDocument(row.id)}
              rowActions={searchRowActions}
              actionsColumnHeader={t("common.actions", { defaultValue: "Actions" })}
              responsive="auto"
              cardsBelow="lg"
              actionsStyle="inline"
            />
          </div>
        </div>
    </PageLayout>
  );
};

export default SearchPage;
