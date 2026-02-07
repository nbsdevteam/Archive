export const getDocumentStatusBadgeVariant = (status?: string) => {
  if (!status) return "secondary";
  const normalized = status.toLowerCase();
  if (normalized === "active") return "success";
  if (normalized === "failed" || normalized === "error" || normalized === "rejected") return "danger";
  if (normalized === "archived") return "secondary";
  return "info";
};
