import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { Spinner, Alert, Input } from "../../../shared/components/ui";
import { PageLayout } from "../../../shared/layout/PageLayout";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import { useSearchPageContainer } from "../containers/useSearchPageContainer";
import "../styles/search.css";

/**
 * SearchPage - Search page with API integration
 */
const SearchPage = () => {
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

  return (
    <PageLayout
      title="Search"
      breadcrumbItems={[]}
      homeTo={routes.adminDashboard}
      rightContent={<CollapseHeader />}
    >
        <div className="card search__search-card mb-3">
          <div className="card-body">
            <div className="d-flex gap-2 mb-2">
              <button
                className={`btn btn-sm ${searchType === 'standard' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setSearchType("standard")}
              >
                Standard
              </button>
              <button
                className={`btn btn-sm ${searchType === 'global' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setSearchType("global")}
              >
                Global
              </button>
              <button
                className={`btn btn-sm ${searchType === 'barcode' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setSearchType("barcode")}
              >
                Barcode
              </button>
            </div>
            <Input
              type="text"
              placeholder={searchType === 'barcode' ? "Enter barcode..." : "Search documents..."}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="search__search-input"
            />
          </div>
        </div>

        <div className="card search__results-card">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">Search Results</h5>
            <span className="text-muted fs-13">
              {isLoading ? "Searching..." : `${results?.length ?? 0} ${results?.length === 1 ? "result" : "results"}`}
            </span>
          </div>
          <div className="card-body">
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
                <button
                  className="btn btn-sm btn-outline-secondary ms-2"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              </Alert>
            )}
            {isLoading ? (
              <div className="text-center py-4">
                <Spinner size="md" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-4 text-muted">
                {searchQuery.trim() ? "No results found" : "Enter a search query to begin"}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Barcode</th>
                      <th>Type</th>
                      <th>Department</th>
                      <th>Upload Date</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((doc: any) => (
                      <tr key={doc.id} style={{ cursor: "pointer" }} onClick={() => handleNavigateToDocument(doc.id)}>
                        <td>{doc.name || doc.title || "-"}</td>
                        <td>{doc.barcode || "-"}</td>
                        <td>{doc.document_type_name || doc.document_type?.name || "-"}</td>
                        <td>{doc.department_name || doc.department?.name || "-"}</td>
                        <td>
                          {doc.upload_date
                            ? formatRelativeTime(new Date(doc.upload_date))
                            : doc.created_at
                            ? formatRelativeTime(new Date(doc.created_at))
                            : "-"}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-light"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateToDocument(doc.id);
                            }}
                          >
                            View
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
