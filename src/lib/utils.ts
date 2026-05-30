import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get locale string for date formatting based on RTL state
 * Replaces the repeated pattern: isRTL ? 'ar-SA' : 'en-US'
 */
export function getLocale(isRTL: boolean): string {
  return isRTL ? 'ar-SA' : 'en-US';
}

/**
 * Format a date with locale awareness
 * Replaces the repeated pattern: new Date(date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', ...)
 */
export function formatDate(date: string | Date, isRTL: boolean, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString(getLocale(isRTL), options || defaultOptions);
}

/**
 * Format a date with time and locale awareness
 */
export function formatDateTime(date: string | Date, isRTL: boolean, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  };
  return new Date(date).toLocaleDateString(getLocale(isRTL), options || defaultOptions);
}

/**
 * Get relative time string (e.g., "2 days ago", "منذ يومين")
 * Replaces various "X days ago" patterns
 */
export function getRelativeTime(date: string | Date, isRTL: boolean): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return isRTL ? 'الآن' : 'Just now';
  if (diffMins < 60) return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins} min ago`;
  if (diffHours < 24) return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return isRTL ? `منذ ${diffDays} يوم` : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(date, isRTL);
}
