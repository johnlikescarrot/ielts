import { TestAttempt } from '../types';

/** Returns local calendar-day keys for attempts, newest first and deduplicated. */
export function getStudyDayKeys(attempts: Pick<TestAttempt, 'date'>[], now = new Date()): string[] {
  const today = toDayKey(now);
  return [...new Set(attempts.map((attempt) => toDayKey(new Date(attempt.date))))]
    .filter((day) => day <= today)
    .sort((a, b) => b.localeCompare(a));
}

/** Counts the active streak, allowing a missed current day while the day is still fresh. */
export function calculateStudyStreak(attempts: Pick<TestAttempt, 'date'>[], now = new Date()): number {
  const days = new Set(getStudyDayKeys(attempts, now));
  const cursor = new Date(now);
  if (!days.has(toDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toDayKey(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
