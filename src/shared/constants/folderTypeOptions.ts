/**
 * Folder type values used for filtering and forms.
 * Consumers (e.g. Folders, Documents) map these to labels via i18n (e.g. folders.folderTypeOptions.*).
 */
export const FOLDER_TYPE_VALUES = [
  "other",
  "official",
  "invoice",
  "shipment",
  "project",
  "client",
  "contract",
  "inbox",
] as const;

export type FolderTypeValue = (typeof FOLDER_TYPE_VALUES)[number];
