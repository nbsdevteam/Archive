/**
 * Date formatting utilities
 */

/**
 * Format date to readable string
 * @param date - Date object or string
 * @param format - Format string (default: 'MM/DD/YYYY')
 */
export const formatDate = (
  date: Date | string | null | undefined,
  format: string = "MM/DD/YYYY"
): string => {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  return format
    .replace("MM", month)
    .replace("DD", day)
    .replace("YYYY", year.toString())
    .replace("YY", year.toString().slice(-2));
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (
  date: Date | string | null | undefined
): string => {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "min" : "mins"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hrs"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;

  return formatDate(d);
};
