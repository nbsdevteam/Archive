/**
 * useFolders — re-exports from shared/hooks so the Folders feature pages keep
 * working while the canonical implementation lives in shared (where dashboard
 * can import it without pulling the entire feature-folders chunk, which
 * statically depends on feature-documents via FolderDetail side-panels).
 */
export {
  useFolders,
  type Folder,
  type FolderListParams,
  type FolderListResponse,
} from "../../../shared/hooks/useFolders";
