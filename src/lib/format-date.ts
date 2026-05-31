import { format } from 'date-fns';

export function formatDate(
  date: Date | string | null | undefined,
  pattern: string,
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  return format(d, pattern);
}
