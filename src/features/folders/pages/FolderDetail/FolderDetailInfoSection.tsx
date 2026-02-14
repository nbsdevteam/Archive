import type { TFunction } from "i18next";
import { FolderDetailInfoCard } from "../../components/detail";
import { convertToArabianStandardTime } from "../../../../shared/utils/format/date";
import type { FolderDetail } from "../../types/folders.types";

export interface FolderDetailInfoSectionProps {
  t: TFunction;
  folder: FolderDetail;
  folderId: number;
  documentCount: number;
}

/** Renders the folder info card (name, metadata, document count). */
export function FolderDetailInfoSection({
  t,
  folder,
  folderId,
  documentCount,
}: FolderDetailInfoSectionProps) {
  return (
    <FolderDetailInfoCard
      t={t}
      folder={folder}
      folderId={folderId}
      documentCount={documentCount}
      formatUpdated={(date) => convertToArabianStandardTime(date) ?? ""}
    />
  );
}
