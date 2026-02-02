import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { useDebounce } from "../../../shared/hooks/useDebounce";
import { useSearchStore } from "../stores/searchStore";
import { Spinner, Alert, Input, Icon } from "../../../shared/components/ui";
import { formatRelativeTime } from "../../../shared/utils/format/date";
import "../styles/search.css";

/**
 * SearchPage - Search page with API integration
 */
const SearchPage = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { results, isLoading, error, search, globalSearch, searchByBarcode, clearResults, clearError } = useSearchStore();
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState<'standard' | 'global' | 'barcode'>('standard');
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 1) {
      if (searchType === 'barcode') {
        searchByBarcode(debouncedQuery.trim());
      } else if (searchType === 'global') {
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
      if (searchType === 'barcode') {
        searchByBarcode(searchQuery.trim());
      } else if (searchType === 'global') {
        globalSearch({ query: searchQuery.trim(), search_in_content: true, fuzzy: true });
      } else {
        search({ query: searchQuery.trim(), search_in_content: false });
      }
    }
  };

  const handleNavigateToDocument = (documentId: number) => {
    navigate(`${routes.documentDetail.replace(":id", documentId.toString())}`);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1 page-heading">Search</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <Icon name="smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Search
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <div className="ms-2 head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>

        <div className="card search__search-card mb-3">
          <div className="card-body">
            <div className="d-flex gap-2 mb-2">
              <button
                className={`btn btn-sm ${searchType === 'standard' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setSearchType('standard')}
              >
                Standard
              </button>
              <button
                className={`btn btn-sm ${searchType === 'global' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setSearchType('global')}
              >
                Global
              </button>
              <button
                className={`btn btn-sm ${searchType === 'barcode' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setSearchType('barcode')}
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
      </div>
    </div>
  );
};

export default SearchPage;
