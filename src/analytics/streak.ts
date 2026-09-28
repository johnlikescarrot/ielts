import { TestAttempt } from '../types';

/**
 * Returns the number of consecutive calendar days with at least one completed
 * practice attempt. A streak is active when the learner practiced today or
 * yesterday; otherwise it has naturally expired.
 */
export function getPracticeStreak(attempts: Pick<TestAttempt, 'date'>[], now = new Date()): number {
  const activeDays = new Set(
    attempts
      .map(({ date }) => new Date(date))
      .filter(date => !Number.isNaN(date.getTime()))
      .map(toDayKey),
  );

  if (activeDays.size === 0) return 0;

  const today = startOfDay(now);
  const todayKey = toDayKey(today);
  const yesterdayKey = toDayKey(addDays(today, -1));
  if (!activeDays.has(todayKey) && !activeDays.has(yesterdayKey)) return 0;

  let streak = 0;
  let cursor = activeDays.has(todayKey) ? today : addDays(today, -1);
  while (activeDays.has(toDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDayKey(date: Date): string {
  const day = startOfDay(date);
  return `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
}
