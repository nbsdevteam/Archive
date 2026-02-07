type FolderDoc = {
  upload_date?: string;
};

export const sortFolderDocumentsByUploadDate = <T extends FolderDoc>(documents: T[]) =>
  [...documents].sort((a, b) => {
    const ta = a.upload_date ? new Date(a.upload_date).getTime() : Number.POSITIVE_INFINITY;
    const tb = b.upload_date ? new Date(b.upload_date).getTime() : Number.POSITIVE_INFINITY;
    return ta - tb;
  });
