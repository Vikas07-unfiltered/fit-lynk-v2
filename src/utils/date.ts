import { format } from 'date-fns';

/**
 * Format a date value (string or Date) to DD-MM-YYYY.
 * Returns empty string if value is falsy or invalid.
 */
/** Parse a variety of date string formats (ISO yyyy-mm-dd, dd-mm-yyyy) into a Date object.
 * Returns null if invalid.
 */
export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  // Try native parse first
  let d = new Date(value);
  if (!isNaN(d.getTime())) return d;
  // Handle dd-MM-yyyy or d-M-yy like formats
  const parts = value.split('-');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    if (yyyy.length === 4) {
      const isoStr = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}T00:00:00`;
      d = new Date(isoStr);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = parseDate(value);
  if (!date) return '';
  return format(date, 'dd-MM-yyyy');
}
