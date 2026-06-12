import {
  parseISO,
  format,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  startOfToday,
  compareAsc,
  isToday,
  isYesterday,
} from "date-fns";
import { ZentraDocument } from "@/types";

/**
 * Returns the number of days from today until expiryDate (negative if already expired)
 */
export function daysUntilExpiry(expiryDate: string): number {
  return differenceInCalendarDays(parseISO(expiryDate), startOfToday());
}

/**
 * Returns true if the document has already expired
 */
export function isExpired(expiryDate: string): boolean {
  return daysUntilExpiry(expiryDate) < 0;
}

/**
 * Returns true if the document expires within the given number of days
 */
function isExpiringSoon(expiryDate: string, withinDays: number): boolean {
  const days = daysUntilExpiry(expiryDate);
  return days >= 0 && days <= withinDays;
}

/**
 * Returns a human-readable label for the expiry state:
 * "Expired", "Today", "Tomorrow", "In N days", "In N months", "In N years"
 */
export function expiryLabel(expiryDate: string): string {
  const days = daysUntilExpiry(expiryDate);
  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 30) return `In ${days} days`;

  const expiry = parseISO(expiryDate);
  const today = startOfToday();

  const years = differenceInCalendarYears(expiry, today);
  if (years >= 1) {
    return `In ${years} ${years === 1 ? "year" : "years"}`;
  }

  const months = differenceInCalendarMonths(expiry, today);
  if (months >= 1) {
    return `In ${months} ${months === 1 ? "month" : "months"}`;
  }

  return `In ${days} days`;
}

/**
 * Returns a display-formatted date string, e.g. "10 May 2024"
 */
export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "d MMM yyyy");
}

/**
 * Sorts an array of ZentraDocument by expiryDate ascending (soonest first)
 */
export function sortByExpiry(docs: ZentraDocument[]): ZentraDocument[] {
  return [...docs].sort((a, b) => compareAsc(parseISO(a.expiryDate), parseISO(b.expiryDate)));
}

/**
 * Filters docs to those expiring within withinDays from today (excludes already expired)
 */
export function filterUpcoming(docs: ZentraDocument[], withinDays: number): ZentraDocument[] {
  return docs.filter((doc) => isExpiringSoon(doc.expiryDate, withinDays));
}

/**
 * Returns the urgency level of a document for badge coloring:
 * "expired" | "critical" (≤7 days) | "warning" (≤30 days) | "safe" (>30 days)
 */
export function expiryUrgency(expiryDate: string): "expired" | "critical" | "warning" | "safe" {
  const days = daysUntilExpiry(expiryDate);
  if (days < 0) return "expired";
  if (days <= 7) return "critical";
  if (days <= 30) return "warning";
  return "safe";
}

/**
 * Formats date added relative to today/yesterday or fallback to display format
 */
export function formatAddedDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return formatDate(dateStr);
  } catch {
    return "Recent";
  }
}

/**
 * Formats an ISO date string into a localized date-time string (e.g. "10 May 2024, 09:00 AM")
 */
export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM yyyy, hh:mm a");
}

/**
 * Returns the number of calendar days elapsed since a given date string
 */
export function daysSinceDate(dateStr: string): number {
  try {
    return differenceInCalendarDays(startOfToday(), parseISO(dateStr));
  } catch (error) {
    console.warn(`[date] Failed to parse days since date: ${dateStr}`, error);
    return 0;
  }
}

