import { describe, it, expect } from 'vitest';
import { getDueCards, getDeckSummary, reviewCard, initializeDeckWithVocabulary } from '../../src/srs/srsManager';
import { SRSCard, VocabularyItem } from '../../src/types';

describe('srsManager', () => {
  const sampleCards: SRSCard[] = [
    { wordId: 'w1', interval: 1, repetition: 0, easeFactor: 2.5, nextReviewDate: '2026-09-20', history: [] },
    { wordId: 'w2', interval: 6, repetition: 2, easeFactor: 2.5, nextReviewDate: '2026-09-27', history: [] },
    { wordId: 'w3', interval: 20, repetition: 6, easeFactor: 2.6, nextReviewDate: '2026-10-15', history: [] },
  ];

  it('filters due cards based on reference date', () => {
    const due = getDueCards(sampleCards, '2026-09-27');
    expect(due.length).toBe(2);
    expect(due.map((d) => d.wordId)).toContain('w1');
    expect(due.map((d) => d.wordId)).toContain('w2');
  });

  it('generates accurate deck summary', () => {
    const summary = getDeckSummary(sampleCards, '2026-09-27');
    expect(summary.totalCards).toBe(3);
    expect(summary.dueToday).toBe(2);
    expect(summary.learning).toBe(1);
    expect(summary.reviewing).toBe(1);
    expect(summary.mastered).toBe(1);
  });

  it('reviews an existing card and appends history', () => {
    const card = sampleCards[0];
    const reviewDate = new Date('2026-09-27');
    const updated = reviewCard(card, card.wordId, 4, reviewDate);

    expect(updated.wordId).toBe('w1');
    expect(updated.repetition).toBe(1);
    expect(updated.history.length).toBe(1);
    expect(updated.history[0].grade).toBe(4);
    expect(updated.lastReviewedDate).toBe('2026-09-27');
  });

  it('reviews a new undefined card smoothly', () => {
    const updated = reviewCard(undefined, 'w_new', 5);
    expect(updated.wordId).toBe('w_new');
    expect(updated.repetition).toBe(1);
  });

  it('initializes deck merging with existing cards', () => {
    const vocabList: VocabularyItem[] = [
      {
        id: 'w1',
        word: 'mitigate',
        phonetic: '',
        partOfSpeech: 'verb',
        definitionEn: '',
        definitionVi: '',
        example: '',
        collocations: [],
        synonyms: [],
        topic: '',
        bandScore: 8,
        cefrLevel: 'C1',
      },
      {
        id: 'w_brand_new',
        word: 'ubiquitous',
        phonetic: '',
        partOfSpeech: 'adj',
        definitionEn: '',
        definitionVi: '',
        example: '',
        collocations: [],
        synonyms: [],
        topic: '',
        bandScore: 8,
        cefrLevel: 'C2',
      },
    ];

    const deck = initializeDeckWithVocabulary(vocabList, [sampleCards[0]]);
    expect(deck.length).toBe(2);
    expect(deck.find((c) => c.wordId === 'w1')?.repetition).toBe(0);
    expect(deck.find((c) => c.wordId === 'w_brand_new')?.wordId).toBe('w_brand_new');
  });
});
