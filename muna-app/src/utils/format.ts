/** Shared formatting utilities — eliminates duplicated formatTime across 3+ files */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Format a date string as "DD Mon • HH:MM AM/PM"
 */
export const formatDateTime = (dateString: string): string => {
  const d = new Date(dateString);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const dateStr = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `${dateStr} • ${h}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Format a date string as "HH:MM AM/PM"
 */
export const formatTime = (dateString: string): string => {
  const d = new Date(dateString);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Format a Date object as "DD Mon YYYY"
 */
export const formatDate = (d: Date): string => {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Construct a full image URL from a relative or absolute path.
 * Eliminates the repeated `startsWith('http')` check across 6+ files.
 */
export const getImageUrl = (path: string | undefined | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://www.munahut.in${path}`;
};
