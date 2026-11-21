import { describe, expect, it } from 'vitest';
import { fullDate } from './dates';

describe('fullDate', () => {
  it('writes the weekday, day, month and year without a comma', () => {
    expect(fullDate(new Date('2026-11-20T12:00:00Z'))).toBe('Friday 20 November 2026');
  });

  it('takes the day in Kigali unless told otherwise', () => {
    // 23:30 UTC is already Saturday in Kigali.
    expect(fullDate(new Date('2026-11-20T23:30:00Z'))).toBe('Saturday 21 November 2026');
    expect(fullDate(new Date('2026-11-20T23:30:00Z'), 'UTC')).toBe('Friday 20 November 2026');
  });
});
