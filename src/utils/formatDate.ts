import { format, formatDistanceToNow } from "date-fns";

/** Formats an ISO 8601 string as a readable calendar date. */
export function formatDisplayDate(isoString: string): string {
  return format(new Date(isoString), "MMM d, yyyy");
}

/** Formats an ISO 8601 string as a readable time value. */
export function formatTime(isoString: string): string {
  return format(new Date(isoString), "h:mm a");
}

/** Formats an ISO 8601 string as a relative time label. */
export function formatRelativeTime(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true });
}
