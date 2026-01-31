/**
 * Group folders by department for chart display.
 * Uses department_name, fallback to "Dept {id}" or "Unknown".
 */

import type { Folder } from "../../folders/types/folders.types";

export interface FoldersByDepartment {
  categories: string[];
  data: number[];
}

export function groupFoldersByDepartment(folders: Folder[]): FoldersByDepartment {
  const map = new Map<string, number>();
  for (const f of folders) {
    const key =
      f.department_name?.trim() ||
      (f.department_id != null ? `Dept ${f.department_id}` : "Unknown");
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const categories = Array.from(map.keys());
  const data = categories.map((k) => map.get(k) ?? 0);
  return { categories, data };
}
