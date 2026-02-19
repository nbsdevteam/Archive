/**
 * Maps document status to Bootstrap badge background variant (e.g. bg-success, bg-danger).
 * Trash/deleted use danger-transparent (soft red) to match delete actions without being too strong.
 */
export const getDocumentStatusBadgeVariant = (status?: string) => {
  if (!status) return "secondary";
  const normalized = status.toLowerCase();
  if (normalized === "active") return "success";
  if (normalized === "failed" || normalized === "error" || normalized === "rejected") return "danger";
  if (normalized === "archived") return "secondary";
  if (normalized === "trash" || normalized === "trashed" || normalized === "deleted") return "danger-transparent";
  return "info";
};
