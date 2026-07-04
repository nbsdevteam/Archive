/**
 * Folders API — re-export from adapter so documents and other features
 * can use adapter path and avoid feature-to-feature cycles.
 */

export {
  listFolders,
  getFolder,
  getFolderDocuments,
  createFolder,
  updateFolder,
  deleteFolder,
  batchDeleteFolders,
} from "@/app/adapter/api/folders.api";

export type {
  CreateFolderParams,
  CreateFolderResponse,
  UpdateFolderParams,
  UpdateFolderResponse,
  DeleteFolderApiResponse,
  BatchDeleteFoldersParams,
  BatchDeleteFoldersSkippedFolder,
  BatchDeleteFoldersResponse,
} from "@/app/adapter/api/folders.api";
