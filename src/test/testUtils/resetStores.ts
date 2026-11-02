/**
 * Resets Zustand stores to initial state between tests to avoid cross-test pollution.
 * Call in afterEach(() => resetStores()) or at the start of tests that need a clean slate.
 */
import { useDocumentStore } from "../../features/documents/stores/documentStore";
import { useDepartmentsStore } from "../../shared/stores/departmentsStore";

const initialDocumentState = {
  currentDocument: null,
  isLoading: false,
  isDownloading: false,
  error: null,
};

const initialDepartmentsState = {
  departments: [],
  isLoading: false,
  isInitialized: false,
  error: null,
};

export function resetStores(): void {
  useDocumentStore.setState(initialDocumentState);
  useDepartmentsStore.setState(initialDepartmentsState);
}
