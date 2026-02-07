import type { Folder } from "../types/folders.types";

export const filterFoldersBySearch = (folders: Folder[], query: string): Folder[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return folders;
  return folders.filter(
    (folder) =>
      (folder.name ?? "").toLowerCase().includes(normalized) ||
      (folder.code ?? "").toLowerCase().includes(normalized)
  );
};
