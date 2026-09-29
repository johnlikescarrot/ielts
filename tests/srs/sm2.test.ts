import { describe, it, expect } from 'vitest';
import { calculateSM2, createDefaultSRSCard } from '../../src/srs/sm2';

describe('sm2', () => {
  it('creates default card with initial parameters', () => {
    const card = createDefaultSRSCard('word_1');
    expect(card.wordId).toBe('word_1');
    expect(card.interval).toBe(0);
    expect(card.repetition).toBe(0);
    expect(card.easeFactor).toBe(2.5);
    expect(card.history).toEqual([]);
  });

  it('resets repetition and interval on failure grade < 3', () => {
    const card = { interval: 10, repetition: 4, easeFactor: 2.5 };
    const refDate = new Date('2026-09-27');
    const result = calculateSM2(card, 1, refDate);

    expect(result.repetition).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.nextReviewDate).toBe('2026-09-28');
  });

  it('advances repetitions and interval on success grades 3, 4, 5', () => {
    const refDate = new Date('2026-09-27');

    // First repetition (repetition = 0 -> interval = 1)
    const card0 = { interval: 0, repetition: 0, easeFactor: 2.5 };
    const res0 = calculateSM2(card0, 4, refDate);
    expect(res0.repetition).toBe(1);
    expect(res0.interval).toBe(1);

    // Second repetition (repetition = 1 -> interval = 6)
    const card1 = { interval: 1, repetition: 1, easeFactor: 2.5 };
    const res1 = calculateSM2(card1, 5, refDate);
    expect(res1.repetition).toBe(2);
    expect(res1.interval).toBe(6);

    // Third repetition (repetition = 2 -> interval = Math.round(6 * 2.5) = 15)
    const card2 = { interval: 6, repetition: 2, easeFactor: 2.5 };
    const res2 = calculateSM2(card2, 4, refDate);
    expect(res2.repetition).toBe(3);
    expect(res2.interval).toBe(15);
  });

  it('enforces ease factor minimum of 1.3 and defaults missing easeFactor', () => {
    let card = { interval: 1, repetition: 1, easeFactor: 1.3 };
    // Repeated low grades
    for (let i = 0; i < 5; i++) {
      const res = calculateSM2(card, 0);
      card = { interval: res.interval, repetition: res.repetition, easeFactor: res.easeFactor };
    }
    expect(card.easeFactor).toBe(1.3);

    // Default missing/falsy ease factor
    const resDefault = calculateSM2({ interval: 1, repetition: 1, easeFactor: 0 }, 4);
    expect(resDefault.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});
