import { describe, expect, it } from 'vitest';
import { getPracticeStreak } from '../../src/analytics/streak';

const now = new Date(2026, 8, 28, 12, 0, 0);
const attempt = (date: string) => ({ date });

describe('getPracticeStreak', () => {
  it('counts unique consecutive calendar days including today', () => {
    expect(getPracticeStreak([
      attempt('2026-09-28T08:00:00Z'),
      attempt('2026-09-28T10:00:00Z'),
      attempt('2026-09-27T22:00:00Z'),
      attempt('2026-09-26T09:00:00Z'),
    ], now)).toBe(3);
  });

  it('keeps yesterday active when there is no attempt today', () => {
    expect(getPracticeStreak([
      attempt('2026-09-27T09:00:00'),
      attempt('2026-09-26T09:00:00'),
    ], now)).toBe(2);
  });

  it('expires after a missed day and ignores malformed dates', () => {
    expect(getPracticeStreak([
      attempt('not-a-date'),
      attempt('2026-09-25T09:00:00'),
    ], now)).toBe(0);
  });

  it('returns zero for an empty history', () => {
    expect(getPracticeStreak([], now)).toBe(0);
  });
});
