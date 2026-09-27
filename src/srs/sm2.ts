import { SRSCard } from '../types';

export interface SM2Result {
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReviewDate: string;
}

/**
 * SuperMemo SM-2 Algorithm
 * @param card Current SRS card state
 * @param grade Quality rating from 0 (complete blackout) to 5 (perfect response)
 * @param currentDate Current reference date for calculation
 */
export function calculateSM2(
  card: { interval: number; repetition: number; easeFactor: number },
  grade: number,
  currentDate: Date = new Date(),
): SM2Result {
  const boundedGrade = Math.max(0, Math.min(5, Math.round(grade)));
  let interval: number;
  let repetition: number;
  let easeFactor = card.easeFactor || 2.5;

  if (boundedGrade < 3) {
    // Failure / Reset
    repetition = 0;
    interval = 1;
  } else {
    // Success
    if (card.repetition === 0) {
      interval = 1;
    } else if (card.repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(card.interval * easeFactor);
    }
    repetition = card.repetition + 1;
  }

  // Update Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const qFactor = 5 - boundedGrade;
  easeFactor = easeFactor + (0.1 - qFactor * (0.08 + qFactor * 0.02));
  // EF must never fall below 1.3
  easeFactor = Math.max(1.3, Math.round(easeFactor * 100) / 100);

  // Compute next review date
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    interval,
    repetition,
    easeFactor,
    nextReviewDate: nextDate.toISOString().split('T')[0],
  };
}

export function createDefaultSRSCard(wordId: string): SRSCard {
  const today = new Date().toISOString().split('T')[0];
  return {
    wordId,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReviewDate: today,
    history: [],
  };
}
