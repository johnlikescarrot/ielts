import type { AppData, SessionLog, Skill, StudyCard } from "./model";
import { newReviewState } from "./scheduler";

export function createCard(
  input: Pick<
    StudyCard,
    "front" | "back" | "context" | "sourceTitle" | "sourceUrl"
  >,
  now: number,
  id: string,
): StudyCard {
  return { ...input, id, createdAt: now, review: newReviewState(now) };
}

export function normalizeWords(text: string): string[] {
  return text
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function transcriptScore(expected: string, actual: string): number {
  const target = normalizeWords(expected);
  const answer = normalizeWords(actual);
  if (target.length === 0) return 0;
  const remaining = [...answer];
  const matches = target.reduce((count, word) => {
    const index = remaining.indexOf(word);
    if (index === -1) return count;
    remaining.splice(index, 1);
    return count + 1;
  }, 0);
  return Math.round((matches / target.length) * 100);
}

export function cloze(text: string, focus: string): string {
  const escaped = focus.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "gi"), "_____");
}

export function wordCount(text: string): number {
  return normalizeWords(text).length;
}

export function logSession(
  skill: Skill,
  durationMinutes: number,
  completedAt: number,
  id: string,
  score?: number,
): SessionLog {
  return score === undefined
    ? { id, skill, durationMinutes, completedAt }
    : { id, skill, durationMinutes, completedAt, score };
}

export function minutesToday(
  data: AppData,
  dayStart: number,
  dayEnd: number,
): number {
  return data.sessions
    .filter(
      (session) =>
        session.completedAt >= dayStart && session.completedAt < dayEnd,
    )
    .reduce((sum, session) => sum + session.durationMinutes, 0);
}

export function currentStreak(
  streakDates: string[],
  today: string,
  previousDays: string[],
): number {
  const unique = new Set(streakDates);
  if (!unique.has(today)) return 0;
  let streak = 1;
  for (const date of previousDays) {
    if (!unique.has(date)) break;
    streak += 1;
  }
  return streak;
}

export function addStudyDate(dates: string[], date: string): string[] {
  return dates.includes(date) ? dates : [...dates, date].sort();
}
