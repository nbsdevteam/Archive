export const getFolderStatusBadgeVariant = (status?: string | null) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "active") return "success";
  if (normalized === "inactive") return "secondary";
  if (normalized === "archived") return "warning";
  if (normalized === "deleted") return "danger";
  return "light";
};
