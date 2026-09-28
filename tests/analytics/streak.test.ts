import { describe, expect, it } from 'vitest';
import { calculateStudyStreak, getStudyDayKeys } from '../../src/analytics/streak';

const attempt = (date: string) => ({ date });
const now = new Date(2026, 8, 28, 12, 0, 0);

describe('study streaks', () => {
  it('counts consecutive practice days including today', () => {
    expect(calculateStudyStreak([
      attempt('2026-09-28T08:00:00'),
      attempt('2026-09-27T20:00:00'),
      attempt('2026-09-26T09:00:00'),
      attempt('2026-09-24T09:00:00'),
    ], now)).toBe(3);
  });

  it('keeps yesterday active when today has not been practiced', () => {
    expect(calculateStudyStreak([
      attempt('2026-09-27T20:00:00'),
      attempt('2026-09-26T09:00:00'),
    ], now)).toBe(2);
  });

  it('deduplicates attempts and ignores future dates', () => {
    expect(getStudyDayKeys([
      attempt('2026-09-28T08:00:00'),
      attempt('2026-09-28T09:00:00'),
      attempt('2026-09-29T09:00:00'),
    ], now)).toEqual(['2026-09-28']);
  });

  it('returns zero for no valid practice days', () => {
    expect(calculateStudyStreak([], now)).toBe(0);
    expect(calculateStudyStreak([attempt('not-a-date')], now)).toBe(0);
  });
});
