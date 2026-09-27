import type { AppState, PracticeCard, ReviewEvent, Skill } from './types';

export interface StudyStats {
  due: number;
  learned: number;
  reviewedToday: number;
  streak: number;
  progress: number;
}

export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dueCards(cards: readonly PracticeCard[], now: Date): PracticeCard[] {
  const timestamp = now.getTime();
  return cards
    .filter((card) => new Date(card.schedule.due).getTime() <= timestamp)
    .sort((left, right) => left.schedule.due.localeCompare(right.schedule.due));
}

export function cardsForSkill(cards: readonly PracticeCard[], skill: Skill): PracticeCard[] {
  return cards.filter((card) => card.skill === skill);
}

function calculateStreak(reviews: readonly ReviewEvent[], now: Date): number {
  const reviewDays = new Set(reviews.map((review) => dayKey(new Date(review.reviewedAt))));
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!reviewDays.has(dayKey(cursor))) {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  let streak = 0;
  while (reviewDays.has(dayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  return streak;
}

export function studyStats(state: AppState, now: Date): StudyStats {
  const today = dayKey(now);
  const reviewedToday = state.reviews.filter(
    (review) => dayKey(new Date(review.reviewedAt)) === today,
  ).length;
  return {
    due: dueCards(state.cards, now).length,
    learned: state.cards.length,
    reviewedToday,
    streak: calculateStreak(state.reviews, now),
    progress: Math.min(100, Math.round((reviewedToday / state.settings.dailyGoal) * 100)),
  };
}
