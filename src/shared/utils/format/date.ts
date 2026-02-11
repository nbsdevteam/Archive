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

/** Iraq timezone offset in hours (Arabia Standard Time, UTC+3). */
const IRAQ_UTC_OFFSET_HOURS = 3;

/**
 * Formats a UTC (Greenwich) date string to Iraqi time (UTC+3) as date and time with AM/PM.
 * Use for last_modified from API (e.g. folder documents response).
 * @param utcDateString - ISO date string in UTC (e.g. "2026-02-11T14:00:00" or "2026-02-11T14:00:00Z")
 * @returns Formatted string e.g. "11 Feb 2026, 5:00 PM" or empty string if invalid
 */
export const formatDateAndTimeIraqi = (
  utcDateString: string | null | undefined
): string => {
  if (!utcDateString || typeof utcDateString !== "string") return "";

  const normalized = utcDateString.trim().endsWith("Z")
    ? utcDateString.trim()
    : `${utcDateString.trim()}Z`;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "";

  const utcMs = d.getTime();
  const iraqMs = utcMs + IRAQ_UTC_OFFSET_HOURS * 60 * 60 * 1000;
  const iraq = new Date(iraqMs);

  const day = iraq.getUTCDate();
  const month = iraq.getUTCMonth();
  const year = iraq.getUTCFullYear();
  let hours = iraq.getUTCHours();
  const minutes = iraq.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const timePart = `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  return `${day} ${monthNames[month]} ${year}, ${timePart}`;
};
