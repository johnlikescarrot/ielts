import {describe, expect, it} from 'vitest';
import {State} from 'ts-fsrs';
import {
  createSchedule,
  deserializeCard,
  scheduleReview,
  serializeCard,
} from './scheduler';
import type {Card} from 'ts-fsrs';

const now = new Date('2026-09-27T12:00:00.000Z');

describe('scheduler', () => {
  it('serializes and deserializes cards with and without a last review', () => {
    const fresh = createSchedule(now);
    expect(fresh).toMatchObject({
      due: now.toISOString(),
      state: State.New,
      reps: 0,
    });
    expect(deserializeCard(fresh).last_review).toBeUndefined();

    const reviewed: Card = {
      ...deserializeCard(fresh),
      last_review: now,
      reps: 1,
    };
    const serialized = serializeCard(reviewed);
    expect(serialized.lastReview).toBe(now.toISOString());
    expect(deserializeCard(serialized).last_review).toEqual(now);
  });

  it.each(['again', 'hard', 'good', 'easy'] as const)(
    'schedules a %s review',
    (rating) => {
      const reviewed = scheduleReview(createSchedule(now), rating, now);
      expect(reviewed.reps).toBe(1);
      expect(new Date(reviewed.due).getTime()).toBeGreaterThan(now.getTime());
    },
  );
});
