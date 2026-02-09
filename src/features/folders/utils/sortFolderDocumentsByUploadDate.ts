/** Sorts by upload_date (works with Document[] or any type with upload_date). */
export const sortFolderDocumentsByUploadDate = <T extends { upload_date?: string }>(
  documents: T[]
): T[] =>
  [...documents].sort((a, b) => {
    const ta = a.upload_date ? new Date(a.upload_date).getTime() : Number.POSITIVE_INFINITY;
    const tb = b.upload_date ? new Date(b.upload_date).getTime() : Number.POSITIVE_INFINITY;
    return ta - tb;
  });
