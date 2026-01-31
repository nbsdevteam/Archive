// index.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Table, Skeleton } from "antd";
import type { DatatableProps } from "../../data/types";

// Skeleton row component for loading state
const SkeletonRow = React.memo(({ columns }: { columns: number }) => (
  <tr className="skeleton-row">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} style={{ padding: "12px 16px" }}>
        <Skeleton.Input
          active
          size="small"
          style={{ width: "100%", minWidth: 60 }}
        />
      </td>
    ))}
  </tr>
));

SkeletonRow.displayName = "SkeletonRow";

// Skeleton table component
const TableSkeleton = React.memo(
  ({ columns, rows = 10 }: { columns: number; rows?: number }) => (
    <div className="table-skeleton">
      <table
        className="table datanew dataTable no-footer"
        style={{ width: "100%" }}
      >
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} style={{ padding: "12px 16px" }}>
                <Skeleton.Input active size="small" style={{ width: 80 }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonRow key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
);

TableSkeleton.displayName = "TableSkeleton";

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function Datatable<T extends object = object>({
  columns,
  dataSource,
  Selection,
  loading: externalLoading = false,
  skeletonRows = 10,
}: DatatableProps<T>) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [Selections, setSelections] = useState<boolean>(true);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search text for better performance with large datasets
  const debouncedSearchText = useDebounce(searchText, 300);

  // Handle initial load - show skeleton immediately, hide once data is ready
  useEffect(() => {
    if (dataSource && dataSource.length >= 0) {
      // Use requestAnimationFrame for smoother transition
      const rafId = requestAnimationFrame(() => {
        setIsInitialLoad(false);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [dataSource]);

  // Show loading state - prioritize initial load, then external loading, then filtering
  const isLoading = isInitialLoad || externalLoading || isFiltering;

  // Memoize the filtered data with optimized search
  const filteredData = useMemo(() => {
    if (!debouncedSearchText) return dataSource;

    const searchLower = debouncedSearchText.toLowerCase();
    return dataSource.filter((record: T) => {
      const values = Object.values(record);
      for (let i = 0; i < values.length; i++) {
        if (String(values[i]).toLowerCase().includes(searchLower)) {
          return true;
        }
      }
      return false;
    });
  }, [dataSource, debouncedSearchText]);

  // Track filtering state
  useEffect(() => {
    if (searchText !== debouncedSearchText) {
      setIsFiltering(true);
    } else {
      // Small delay to show skeleton smoothly
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      filterTimeoutRef.current = setTimeout(() => {
        setIsFiltering(false);
      }, 100);
    }

    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [searchText, debouncedSearchText]);

  // Memoize the row selection configuration
  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: setSelectedRowKeys,
      preserveSelectedRowKeys: true, // Preserve selection across pagination
    }),
    [selectedRowKeys]
  );

  // Memoize pagination configuration with performance optimizations
  const paginationConfig = useMemo(
    () => ({
      locale: { items_per_page: "" },
      nextIcon: <i className="ti ti-chevron-right" />,
      prevIcon: <i className="ti ti-chevron-left" />,
      defaultPageSize: 10,
      showSizeChanger: true,
      pageSizeOptions: ["10", "20", "30", "50", "100"],
      showQuickJumper: dataSource.length > 100, // Show quick jumper for large datasets
    }),
    [dataSource.length]
  );

  // Memoize pagination config with selection
  const paginationConfigWithSelection = useMemo(
    () => ({
      ...paginationConfig,
      showTotal: (total: number, range: [number, number]) =>
        `Showing ${range[0]} - ${range[1]} of ${total} entries`,
    }),
    [paginationConfig]
  );

  // Memoize the search input change handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    []
  );

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchText("");
  }, []);

  useEffect(() => {
    setSelections(Selection ?? true);
  }, [Selection]);

  // Memoize columns with stable reference
  const memoizedColumns = useMemo(() => columns, [columns]);

  // Calculate number of visible columns for skeleton
  const visibleColumnsCount = useMemo(() => {
    return (Selections ? 1 : 0) + (memoizedColumns?.length || 5);
  }, [Selections, memoizedColumns]);

  // Common table props for performance
  const tableProps = useMemo(
    () => ({
      className: "table datanew dataTable no-footer",
      columns: memoizedColumns,
      rowHoverable: false,
      dataSource: filteredData,
      loading: false, // We handle loading ourselves with skeleton
      // Enable virtual scrolling for large datasets (more than 100 rows)
      virtual: filteredData.length > 100,
      scroll: filteredData.length > 100 ? { y: 500 } : undefined,
    }),
    [memoizedColumns, filteredData]
  );

  return (
    <>
      <div className="table-top-data">
        <div className="row p-3">
          <div className="col-sm-12 col-md-6">
            <div
              className="dataTables_length"
              id="DataTables_Table_0_length"
            ></div>
          </div>
          <div className="col-sm-12 col-md-6">
            <div
              id="DataTables_Table_0_filter"
              className="dataTables_filter text-end mb-0  d-flex align-items-center justify-content-end gap-2"
            >
              <label className="d-flex align-items-center justify-content-end gap-2">
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Search"
                  aria-controls="DataTables_Table_0"
                  value={searchText}
                  onChange={handleSearchChange}
                />
                {searchText && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleClearSearch}
                    title="Clear search"
                  >
                    <i className="ti ti-x" />
                  </button>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={visibleColumnsCount} rows={skeletonRows} />
      ) : !Selections ? (
        <Table {...tableProps} pagination={paginationConfig} />
      ) : (
        <Table
          {...tableProps}
          rowSelection={rowSelection}
          pagination={paginationConfigWithSelection}
        />
      )}
    </>
  );
}

export default React.memo(Datatable) as typeof Datatable;
