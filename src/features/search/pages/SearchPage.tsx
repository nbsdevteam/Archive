import { useTranslation } from "react-i18next";
import CollapseHeader from "@/app/shell/collapse-header/collapse-header";
import { Spinner, Alert, Input } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { useSearchPageContainer } from "../containers/useSearchPageContainer";
import type { SearchResult } from "../types/search.types";
import "../styles/search.css";

/**
 * SearchPage - Search page with API integration. Uses i18n for all user-facing strings.
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
  const handleResultRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const id = e.currentTarget.dataset.docId;
    if (id != null) handleNavigateToDocument(Number(id));
  };
  const handleResultViewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const id = e.currentTarget.dataset.docId;
    if (id != null) handleNavigateToDocument(Number(id));
  };

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
            {isLoading ? (
              <div className="text-center py-4">
                <Spinner size="md" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-4 text-muted">
                {searchQuery.trim()
                  ? t("search.noResultsFound", { defaultValue: "No results found" })
                  : t("search.enterQueryToBegin", { defaultValue: "Enter a search query to begin" })}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped mb-0">
                  <thead>
                    <tr>
                      <th>{t("documents.name", { defaultValue: "Name" })}</th>
                      <th>{t("documents.barcode", { defaultValue: "Barcode" })}</th>
                      <th>{t("documents.type", { defaultValue: "Type" })}</th>
                      <th>{t("documents.department", { defaultValue: "Department" })}</th>
                      <th>{t("documents.uploadDate", { defaultValue: "Upload Date" })}</th>
                      <th className="text-end">{t("common.actions", { defaultValue: "Actions" })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((doc: SearchResult) => (
                      <tr key={doc.id} style={{ cursor: "pointer" }} data-doc-id={doc.id} onClick={handleResultRowClick}>
                        <td>{doc.name || doc.title || "-"}</td>
                        <td>{doc.barcode || "-"}</td>
                        <td>{doc.document_type_name || doc.document_type?.name || "-"}</td>
                        <td>{doc.department_name || doc.department?.name || "-"}</td>
                        <td>
                          {doc.upload_date ?? doc.created_at ?? "-"}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-light"
                            data-doc-id={doc.id}
                            onClick={handleResultViewClick}
                          >
                            {t("common.view", { defaultValue: "View" })}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
    </PageLayout>
  );
};

export default SearchPage;
