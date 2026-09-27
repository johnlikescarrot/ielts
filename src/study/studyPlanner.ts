import { SRSCard, SkillType, TestAttempt, UserSettings } from '../types';
import { getDueCards } from '../srs/srsManager';

export const CORE_SKILLS = ['reading', 'listening', 'writing', 'speaking'] as const;
export type CoreSkill = (typeof CORE_SKILLS)[number];

export type StudyTaskReason = 'due-vocabulary' | 'focus-skill' | 'balance';

export interface StudyPlanTask {
  id: string;
  skill: SkillType;
  minutes: number;
  reason: StudyTaskReason;
  dueCardCount?: number;
}

export interface StudyPlan {
  date: string;
  targetMinutes: number;
  tasks: StudyPlanTask[];
}

/** Return a stable local-calendar key for dates used by the offline planner. */
export function getDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Count consecutive active calendar days without requiring an account or telemetry.
 * A streak can continue when the learner has not studied yet today, which avoids
 * showing a broken streak at the start of the day.
 */
export function calculateStudyStreak(history: TestAttempt[], today = new Date()): number {
  const activeDates = new Set(history.map(attempt => getDateKey(attempt.date)).filter(Boolean));
  if (activeDates.size === 0) return 0;

  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  if (!activeDates.has(getDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (activeDates.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function clampDailyMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return 30;
  return Math.min(180, Math.max(15, Math.round(minutes / 5) * 5));
}

function averageScoresBySkill(history: TestAttempt[]): Map<CoreSkill, number> {
  const scores = new Map<CoreSkill, number>();
  CORE_SKILLS.forEach(skill => scores.set(skill, 0));

  CORE_SKILLS.forEach(skill => {
    const attempts = history.filter(attempt => attempt.skill === skill && attempt.estimatedBand > 0);
    if (attempts.length > 0) {
      const average = attempts.reduce((sum, attempt) => sum + attempt.estimatedBand, 0) / attempts.length;
      scores.set(skill, average);
    }
  });
  return scores;
}

/** Select the skill with the most room to improve, rotating untouched skills fairly. */
export function selectFocusSkill(history: TestAttempt[], today = new Date()): CoreSkill {
  const scores = averageScoresBySkill(history);
  const hasPracticeData = CORE_SKILLS.some(skill => scores.get(skill)! > 0);

  if (!hasPracticeData) {
    return CORE_SKILLS[Math.abs(today.getDate() - 1) % CORE_SKILLS.length];
  }

  const lowestScore = Math.min(...CORE_SKILLS.map(skill => scores.get(skill)! || 0));
  const tiedSkills = CORE_SKILLS.filter(skill => (scores.get(skill) || 0) === lowestScore);
  return tiedSkills[Math.abs(today.getDate() - 1) % tiedSkills.length];
}

function nextSkillAfter(skill: CoreSkill): CoreSkill {
  const index = CORE_SKILLS.indexOf(skill);
  return CORE_SKILLS[(index + 1) % CORE_SKILLS.length];
}

function roundedMinutes(minutes: number): number {
  return Math.max(5, Math.round(minutes / 5) * 5);
}

/**
 * Build a small, actionable plan from local progress. The plan deliberately
 * favours review debt and the weakest skill, then protects balanced practice.
 */
export function buildStudyPlan(
  settings: UserSettings,
  history: TestAttempt[],
  cards: SRSCard[],
  today = new Date(),
): StudyPlan {
  const targetMinutes = clampDailyMinutes(settings.dailyGoalMinutes);
  const date = getDateKey(today);
  const dueCardCount = getDueCards(cards, date).length;
  const tasks: StudyPlanTask[] = [];
  let remainingMinutes = targetMinutes;
  let taskIndex = 0;

  if (dueCardCount > 0) {
    const reviewMinutes = Math.min(
      remainingMinutes,
      Math.max(5, Math.min(20, roundedMinutes(targetMinutes * 0.25))),
    );
    tasks.push({
      id: `study-${date}-vocabulary-${taskIndex++}`,
      skill: 'vocabulary',
      minutes: reviewMinutes,
      reason: 'due-vocabulary',
      dueCardCount,
    });
    remainingMinutes -= reviewMinutes;
  }

  const focusSkill = selectFocusSkill(history, today);
  const focusMinutes = Math.min(
    remainingMinutes,
    Math.max(10, Math.min(30, roundedMinutes(remainingMinutes * 0.6))),
  );
  tasks.push({
    id: `study-${date}-${focusSkill}-${taskIndex++}`,
    skill: focusSkill,
    minutes: focusMinutes,
    reason: 'focus-skill',
  });
  remainingMinutes -= focusMinutes;

  if (remainingMinutes >= 5) {
    const balanceSkill = nextSkillAfter(focusSkill);
    tasks.push({
      id: `study-${date}-${balanceSkill}-${taskIndex}`,
      skill: balanceSkill,
      minutes: remainingMinutes,
      reason: 'balance',
    });
  }

  return { date, targetMinutes, tasks };
}
