import { SRSCard, VocabularyItem } from '../types';
import { calculateSM2, createDefaultSRSCard } from './sm2';

export interface SRSDeckSummary {
  totalCards: number;
  dueToday: number;
  learning: number; // repetition < 3
  reviewing: number; // repetition 3-5
  mastered: number; // repetition >= 6
}

export function getDueCards(cards: SRSCard[], currentDate: string = new Date().toISOString().split('T')[0]): SRSCard[] {
  return cards.filter((card) => {
    return !card.nextReviewDate || card.nextReviewDate <= currentDate;
  });
}

export function getDeckSummary(
  cards: SRSCard[],
  currentDate: string = new Date().toISOString().split('T')[0],
): SRSDeckSummary {
  let dueToday = 0;
  let learning = 0;
  let reviewing = 0;
  let mastered = 0;

  cards.forEach((card) => {
    if (!card.nextReviewDate || card.nextReviewDate <= currentDate) {
      dueToday++;
    }

    if (card.repetition === 0) {
      learning++;
    } else if (card.repetition < 5) {
      reviewing++;
    } else {
      mastered++;
    }
  });

  return {
    totalCards: cards.length,
    dueToday,
    learning,
    reviewing,
    mastered,
  };
}

export function reviewCard(
  existingCard: SRSCard | undefined,
  wordId: string,
  grade: number,
  reviewDate: Date = new Date(),
): SRSCard {
  const card = existingCard || createDefaultSRSCard(wordId);
  const result = calculateSM2(card, grade, reviewDate);
  const dateStr = reviewDate.toISOString().split('T')[0];

  return {
    wordId,
    interval: result.interval,
    repetition: result.repetition,
    easeFactor: result.easeFactor,
    nextReviewDate: result.nextReviewDate,
    lastReviewedDate: dateStr,
    history: [
      ...card.history,
      {
        date: dateStr,
        grade,
      },
    ],
  };
}

export function initializeDeckWithVocabulary(vocabList: VocabularyItem[], existingCards: SRSCard[] = []): SRSCard[] {
  const cardMap = new Map<string, SRSCard>();
  existingCards.forEach((c) => cardMap.set(c.wordId, c));

  return vocabList.map((item) => {
    if (cardMap.has(item.id)) {
      return cardMap.get(item.id)!;
    }
    return createDefaultSRSCard(item.id);
  });
}
