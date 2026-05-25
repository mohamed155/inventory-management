import { describe, expect, it } from 'vitest';
import { intersectIds } from '@/util/intersect-ids';

describe('intersectIds', () => {
  it('returns intersection of three arrays', () => {
    const result = intersectIds([
      ['a', 'b', 'c'],
      ['b', 'c', 'd'],
      ['c', 'd', 'e'],
    ]);
    expect(result).toEqual(['c']);
  });

  it('ignores undefined entries and intersects the rest', () => {
    const result = intersectIds([['a', 'b'], undefined, ['a', 'c']]);
    expect(result).toEqual(['a']);
  });

  it('returns undefined when all entries are undefined', () => {
    const result = intersectIds([undefined, undefined]);
    expect(result).toBeUndefined();
  });

  it('returns empty array when one array is empty', () => {
    const result = intersectIds([['a', 'b'], [], ['a', 'b']]);
    expect(result).toEqual([]);
  });

  it('returns the full array when two identical arrays are provided', () => {
    const result = intersectIds([
      ['x', 'y'],
      ['x', 'y'],
    ]);
    expect(result).toEqual(['x', 'y']);
  });

  it('returns the single array unchanged when only one is provided', () => {
    const result = intersectIds([['m', 'n']]);
    expect(result).toEqual(['m', 'n']);
  });

  it('returns an empty array when arrays have no common elements', () => {
    const result = intersectIds([
      ['a', 'b'],
      ['c', 'd'],
    ]);
    expect(result).toEqual([]);
  });
});
