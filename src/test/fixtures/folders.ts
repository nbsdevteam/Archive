import type { FolderDetail } from "../../features/folders/types/folders.types";

/**
 * Builds a FolderDetail fixture for tests. Override any fields via partial.
 */
export function makeFolderDetail(overrides: Partial<FolderDetail> = {}): FolderDetail {
  return {
    id: 1,
    name: "Test Folder",
    code: "TF-001",
    description: "Test folder description",
    department_id: 10,
    department_name: "Engineering",
    state: "active",
    ...overrides,
  };
}
