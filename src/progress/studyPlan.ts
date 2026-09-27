import { SkillType, TestAttempt } from '../types';

export type PracticeSkill = Exclude<SkillType, 'analytics' | 'mock-test'>;

export interface StudyPlan {
  streakDays: number;
  minutesToday: number;
  goalMinutes: number;
  completionPercent: number;
  weakestSkill: PracticeSkill | null;
  recommendedSkill: PracticeSkill;
  remainingMinutes: number;
}

const PRACTICE_SKILLS: PracticeSkill[] = ['reading', 'listening', 'writing', 'speaking', 'vocabulary'];

/** Returns a stable local-calendar key, avoiding UTC date boundary surprises. */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getStudyDates(history: TestAttempt[]): Set<string> {
  return new Set(history.filter(attempt => attempt.timeSpentSeconds > 0 && !Number.isNaN(Date.parse(attempt.date))).map(attempt => localDateKey(new Date(attempt.date))));
}

export function calculateStreak(history: TestAttempt[], today = new Date()): number {
  const dates = getStudyDates(history);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // A learner can open the dashboard before studying today without losing yesterday's streak.
  if (!dates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (dates.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getTodayStudyMinutes(history: TestAttempt[], today = new Date()): number {
  const todayKey = localDateKey(today);
  return Math.round(history.filter(attempt => localDateKey(new Date(attempt.date)) === todayKey).reduce((total, attempt) => total + Math.max(0, attempt.timeSpentSeconds), 0) / 60);
}

export function getWeakestSkill(history: TestAttempt[]): PracticeSkill | null {
  const scores = new Map<PracticeSkill, number[]>();
  for (const skill of PRACTICE_SKILLS) scores.set(skill, []);
  history.forEach(attempt => {
    if (scores.has(attempt.skill as PracticeSkill) && attempt.estimatedBand > 0) scores.get(attempt.skill as PracticeSkill)!.push(attempt.estimatedBand);
  });

  const practiced = PRACTICE_SKILLS.filter(skill => scores.get(skill)!.length > 0);
  if (practiced.length === 0) return null;
  return practiced.reduce((weakest, skill) => {
    const average = scores.get(skill)!.reduce((sum, score) => sum + score, 0) / scores.get(skill)!.length;
    const weakestAverage = scores.get(weakest)!.reduce((sum, score) => sum + score, 0) / scores.get(weakest)!.length;
    return average < weakestAverage ? skill : weakest;
  });
}

export function buildStudyPlan(history: TestAttempt[], goalMinutes: number, today = new Date()): StudyPlan {
  const safeGoal = Math.max(1, Math.round(goalMinutes));
  const minutesToday = getTodayStudyMinutes(history, today);
  const weakestSkill = getWeakestSkill(history);
  return {
    streakDays: calculateStreak(history, today),
    minutesToday,
    goalMinutes: safeGoal,
    completionPercent: Math.min(100, Math.round((minutesToday / safeGoal) * 100)),
    weakestSkill,
    recommendedSkill: weakestSkill || 'reading',
    remainingMinutes: Math.max(0, safeGoal - minutesToday),
  };
}

export function isConsecutiveStudyDay(previous: string, current: string): boolean {
  const next = dateFromKey(previous);
  next.setDate(next.getDate() + 1);
  return localDateKey(next) === current;
}
