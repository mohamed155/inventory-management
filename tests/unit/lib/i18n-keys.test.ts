import { describe, expect, it } from 'vitest';
import ar from '../../../src/i18n/locales/ar.ts';
import en from '../../../src/i18n/locales/en.ts';

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.keys(obj).flatMap((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

describe('i18n translation key coverage', () => {
  it('every English key exists in the Arabic locale', () => {
    const enKeys = collectKeys(en as unknown as Record<string, unknown>);
    const arKeys = new Set(
      collectKeys(ar as unknown as Record<string, unknown>),
    );

    const missingKeys = enKeys.filter((key) => !arKeys.has(key));

    expect(missingKeys).toEqual([]);
  });
});
