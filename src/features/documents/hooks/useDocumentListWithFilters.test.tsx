import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "../../../app/providers/AppProviders";
import { resetStores } from "../../../test/testUtils/resetStores";
import { useDocumentListWithFilters } from "./useDocumentListWithFilters";

const mockGetDocuments = vi.fn();
const mockGetDepartments = vi.fn();
const mockGetDocumentTypes = vi.fn();

vi.mock("../../../app/adapter/api/documents.api", () => ({
  documentsApi: {
    getDocuments: (...args: unknown[]) => mockGetDocuments(...args),
  },
}));

vi.mock("../../../app/adapter/api/admin.api", () => ({
  adminApi: {
    getDepartments: (...args: unknown[]) => mockGetDepartments(...args),
    getDocumentTypes: (...args: unknown[]) => mockGetDocumentTypes(...args),
  },
}));

vi.mock("../../../shared/stores/companiesStore", () => ({
  useCompaniesStore: () => ({
    companies: [],
    fetchCompanies: vi.fn(),
  }),
}));

const defaultDocumentsResponse = {
  success: true,
  data: [],
  pagination: { total: 0, page: 1, per_page: 20, total_pages: 0 },
};

const defaultDepartmentsResponse = { success: true, data: [{ id: 1, name: "Dept", code: "D1" }] };
const defaultDocumentTypesResponse = { success: true, data: [{ id: 1, name: "Type", code: "T1", department_id: 1, department_name: "Dept" }] };

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <AppProviders>{children}</AppProviders>
    </MemoryRouter>
  );
}

describe("useDocumentListWithFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockGetDocuments.mockResolvedValue(defaultDocumentsResponse);
    mockGetDepartments.mockResolvedValue(defaultDepartmentsResponse);
    mockGetDocumentTypes.mockResolvedValue(defaultDocumentTypesResponse);
  });

  afterEach(() => {
    resetStores();
  });

  it("calls fetchDocuments with getFetchParams on mount", async () => {
    renderHook(() => useDocumentListWithFilters({}), { wrapper });

    await waitFor(() => {
      expect(mockGetDocuments).toHaveBeenCalled();
    });

    const callParams = mockGetDocuments.mock.calls[0][0];
    expect(callParams).toBeDefined();
    expect(typeof callParams).toBe("object");
  });

  it("calls fetchDocuments with search when handleSearchDebounced is called", async () => {
    const { result } = renderHook(() => useDocumentListWithFilters({}), { wrapper });

    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    mockGetDocuments.mockClear();

    result.current.handleSearchDebounced("query");

    await waitFor(() => {
      expect(mockGetDocuments).toHaveBeenCalledWith(expect.objectContaining({ search: "query" }));
    });
  });

  it("calls fetchDocuments with filter params when handleApplyFilter is called", async () => {
    const { result } = renderHook(() => useDocumentListWithFilters({}), { wrapper });

    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    mockGetDocuments.mockClear();

    await act(async () => {
      result.current.handlePrimaryFilterChange(10);
    });
    await act(async () => {
      result.current.handleApplyFilter();
    });

    expect(mockGetDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ department_id: 10 })
    );
  });

  it("calls fetchDocuments without filters when handleClearFilter is called", async () => {
    const { result } = renderHook(() => useDocumentListWithFilters({}), { wrapper });

    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    mockGetDocuments.mockClear();

    result.current.handlePrimaryFilterChange(10);
    result.current.handleApplyFilter();
    await waitFor(() => expect(mockGetDocuments).toHaveBeenCalled());
    mockGetDocuments.mockClear();

    result.current.handleClearFilter();

    await waitFor(() => {
      expect(mockGetDocuments).toHaveBeenCalled();
      const lastCall = mockGetDocuments.mock.calls[mockGetDocuments.mock.calls.length - 1][0];
      expect(lastCall.department_id).toBeUndefined();
      expect(lastCall.document_type_id).toBeUndefined();
    });
  });
});
