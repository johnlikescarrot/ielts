import { describe, expect, it } from 'vitest';
import { State, type Card } from 'ts-fsrs';

import {
  applyRating,
  cardFingerprint,
  createCloze,
  createSchedule,
  deserializeSchedule,
  normalizeText,
  safeHttpUrl,
  serializeSchedule,
} from '../../src/core';

const now = new Date('2026-09-27T12:00:00.000Z');

function fsrsCard(lastReview?: Date): Card {
  return {
    due: now,
    stability: 2,
    difficulty: 3,
    elapsed_days: 4,
    scheduled_days: 5,
    learning_steps: 0,
    reps: 6,
    lapses: 1,
    state: State.Review,
    ...(lastReview === undefined ? {} : { last_review: lastReview }),
  };
}

describe('text utilities', () => {
  it('normalizes whitespace and length', () => {
    expect(normalizeText('  one\n  two  ', 7)).toBe('one two');
    expect(normalizeText('123456', 3)).toBe('123');
  });

  it('builds cloze prompts and handles empty or unmatched text', () => {
    expect(createCloze('', 'focus')).toBe('focus');
    expect(createCloze('A context', '')).toBe('');
    expect(createCloze('Use C++ carefully.', 'C++')).toBe('Use _____ carefully.');
    expect(createCloze('A different sentence.', 'focus')).toBe('focus');
  });

  it('allows only normalized HTTP and HTTPS source URLs', () => {
    expect(safeHttpUrl('')).toBe('');
    expect(safeHttpUrl('not a url')).toBe('');
    expect(safeHttpUrl('javascript:alert(1)')).toBe('');
    expect(safeHttpUrl('ftp://example.com/file')).toBe('');
    expect(safeHttpUrl('http://example.com')).toBe('http://example.com/');
    expect(safeHttpUrl(' https://example.com/path ')).toBe('https://example.com/path');
  });

  it('creates stable case-insensitive fingerprints', () => {
    expect(cardFingerprint(' Focus ', 'IN context', 'HTTPS://EXAMPLE.COM')).toBe(
      'focus|in context|https://example.com',
    );
  });
});

describe('FSRS schedule adapter', () => {
  it('serializes and deserializes schedules without a prior review', () => {
    const serialized = serializeSchedule(fsrsCard());
    expect(serialized.lastReview).toBeUndefined();
    expect(deserializeSchedule(serialized)).toEqual(fsrsCard());
  });

  it('serializes and deserializes schedules with a prior review', () => {
    const reviewedAt = new Date('2026-09-26T12:00:00.000Z');
    const serialized = serializeSchedule(fsrsCard(reviewedAt));
    expect(serialized.lastReview).toBe(reviewedAt.toISOString());
    expect(deserializeSchedule(serialized).last_review).toEqual(reviewedAt);
  });

  it('creates new schedules and applies all supported FSRS ratings', () => {
    const fresh = createSchedule(now);
    expect(fresh.state).toBe(State.New);
    expect(fresh.due).toBe(now.toISOString());

    for (const rating of [1, 2, 3, 4] as const) {
      const next = applyRating(fresh, rating, now);
      expect(next.reps).toBe(1);
      expect(new Date(next.due).getTime()).toBeGreaterThan(now.getTime());
      expect(next.lastReview).toBe(now.toISOString());
    }
  });
});
