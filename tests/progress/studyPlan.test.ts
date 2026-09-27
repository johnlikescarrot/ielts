import { describe, expect, it } from 'vitest';
import { buildStudyPlan, calculateStreak, getTodayStudyMinutes, getWeakestSkill, isConsecutiveStudyDay, localDateKey } from '../../src/progress/studyPlan';
import { TestAttempt } from '../../src/types';

const attempt = (date: string, skill: TestAttempt['skill'] = 'reading', band = 7, seconds = 1800): TestAttempt => ({
  id: date + skill, date, skill, testId: 'practice', testTitle: 'Practice', estimatedBand: band, timeSpentSeconds: seconds,
});

describe('adaptive study plan', () => {
  it('formats local calendar dates and checks consecutive days', () => {
    const date = new Date(2026, 8, 27, 23, 30);
    expect(localDateKey(date)).toBe('2026-09-27');
    expect(isConsecutiveStudyDay('2026-09-26', '2026-09-27')).toBe(true);
    expect(isConsecutiveStudyDay('2026-09-25', '2026-09-27')).toBe(false);
  });

  it('counts today and supports a not-yet-started day', () => {
    const today = new Date(2026, 8, 27, 12);
    const history = [attempt('2026-09-27T08:00:00', 'reading', 7, 1200), attempt('2026-09-27T09:00:00', 'writing', 7, 1800), attempt('2026-09-26T09:00:00', 'reading', 7, 60)];
    expect(getTodayStudyMinutes(history, today)).toBe(50);
    expect(calculateStreak(history, today)).toBe(2);
    expect(calculateStreak([attempt('2026-09-26T09:00:00')], today)).toBe(1);
  });

  it('ignores invalid, zero-duration, and future gaps', () => {
    const today = new Date(2026, 8, 27);
    expect(calculateStreak([attempt('not-a-date'), attempt('2026-09-26T09:00:00', 'reading', 7, 0)], today)).toBe(0);
    expect(getTodayStudyMinutes([attempt('2026-09-27T09:00:00', 'reading', 7, -30)], today)).toBe(0);
  });

  it('finds the weakest practiced skill and handles a new learner', () => {
    const history = [attempt('2026-09-27T09:00:00', 'reading', 8), attempt('2026-09-27T10:00:00', 'writing', 6), attempt('2026-09-27T11:00:00', 'writing', 7)];
    expect(getWeakestSkill(history)).toBe('writing');
    expect(getWeakestSkill([])).toBeNull();
  });

  it('builds a capped progress plan with safe goals', () => {
    const today = new Date(2026, 8, 27);
    const plan = buildStudyPlan([attempt('2026-09-27T09:00:00', 'listening', 6, 7200)], 30, today);
    expect(plan).toMatchObject({ minutesToday: 120, goalMinutes: 30, completionPercent: 100, remainingMinutes: 0, weakestSkill: 'listening', recommendedSkill: 'listening' });
    expect(buildStudyPlan([], 0, today)).toMatchObject({ goalMinutes: 1, recommendedSkill: 'reading', streakDays: 0 });
  });
});
