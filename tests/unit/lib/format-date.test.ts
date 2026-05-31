import { describe, expect, it } from 'vitest';
import { formatDate } from '@/lib/format-date.ts';

describe('formatDate', () => {
  it('formats a Date object with dd/MM/yyyy pattern', () => {
    const date = new Date('2026-03-15');
    const result = formatDate(date, 'dd/MM/yyyy');
    expect(result).toBe('15/03/2026');
  });

  it('formats a valid ISO string with yyyy-MM-dd pattern', () => {
    const result = formatDate('2026-07-04', 'yyyy-MM-dd');
    expect(result).toBe('2026-07-04');
  });

  it('formats a Date object with MM/dd/yyyy pattern', () => {
    const date = new Date('2026-01-20');
    const result = formatDate(date, 'MM/dd/yyyy');
    expect(result).toBe('01/20/2026');
  });

  it('returns empty string for null input', () => {
    const result = formatDate(null, 'dd/MM/yyyy');
    expect(result).toBe('');
  });

  it('returns empty string for undefined input', () => {
    const result = formatDate(undefined, 'dd/MM/yyyy');
    expect(result).toBe('');
  });

  it('returns empty string for an invalid date string', () => {
    const result = formatDate('not-a-date', 'dd/MM/yyyy');
    expect(result).toBe('');
  });

  it('formats epoch zero (Jan 1 1970) without returning empty string', () => {
    const result = formatDate(new Date(0), 'yyyy-MM-dd');
    expect(result).not.toBe('');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
