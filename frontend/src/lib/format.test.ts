import { toNum } from './format';

describe('toNum', () => {
  it('coerces numeric strings and handles nulls', () => {
    expect(toNum('42')).toBe(42);
    expect(toNum('')).toBe(0);
    expect(toNum(null)).toBe(0);
    expect(toNum(undefined)).toBe(0);
  });
});


