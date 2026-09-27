import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/domain/seed';
import {
  addCard,
  dueCards,
  gradeCard,
  isGrade,
  markShadowOutcome,
  progressPercent,
  schedule,
  todayReviewCount,
  updateSettings
} from '../src/domain/scheduler';
import type { Card } from '../src/domain/types';

const now = new Date('2026-09-27T10:00:00.000Z');

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    front: 'focus',
    back: 'attention',
    context: '',
    tags: [],
    createdAt: '2026-09-20T10:00:00.000Z',
    dueAt: '2026-09-27T09:00:00.000Z',
    intervalDays: 2,
    repetitions: 2,
    lapses: 0,
    state: 'review',
    ...overrides
  };
}

describe('scheduler', () => {
  it('recognises only keyboard grades 1 through 4', () => {
    expect(isGrade(1)).toBe(true);
    expect(isGrade(4)).toBe(true);
    expect(isGrade(0)).toBe(false);
    expect(isGrade(4.5)).toBe(false);
  });

  it('adds trimmed cards and refuses incomplete cards', () => {
    const state = createInitialState();
    const incomplete = addCard(state, { front: ' ', back: 'meaning', context: '', tags: [] }, now);
    expect(incomplete).toBe(state);

    const next = addCard(
      state,
      {
        front: '  salient  ',
        back: '  important  ',
        context: '  A salient point. ',
        tags: [' Writing ', '']
      },
      now
    );
    const added = next.cards.at(-1)!;
    expect(added).toMatchObject({
      id: 'salient-1790503200000',
      front: 'salient',
      back: 'important',
      context: 'A salient point.',
      tags: ['Writing'],
      state: 'new',
      dueAt: now.toISOString()
    });
    expect(
      addCard(state, { front: '!!!', back: 'symbol', context: '', tags: [] }, now).cards.at(-1)?.id
    ).toBe('card-1790503200000');
  });

  it('orders due cards by due date and then alphabetically', () => {
    const cards = [
      card({ id: 'late', front: 'zebra', dueAt: '2026-09-27T09:00:00.000Z' }),
      card({ id: 'early-a', front: 'apple', dueAt: '2026-09-27T08:00:00.000Z' }),
      card({ id: 'early-b', front: 'banana', dueAt: '2026-09-27T08:00:00.000Z' }),
      card({ id: 'future', dueAt: '2026-09-27T11:00:00.000Z' })
    ];
    expect(dueCards(cards, now).map((item) => item.id)).toEqual(['early-a', 'early-b', 'late']);
  });

  it('schedules again into learning and counts a lapse', () => {
    const result = schedule(card(), 1, now);
    expect(result).toMatchObject({
      state: 'learning',
      repetitions: 0,
      lapses: 1,
      intervalDays: 0,
      dueAt: '2026-09-27T10:10:00.000Z'
    });
  });

  it.each([
    [2, 2],
    [3, 5],
    [4, 8]
  ] as const)('schedules successful grade %i from an existing interval', (grade, days) => {
    const result = schedule(card(), grade, now);
    expect(result).toMatchObject({
      state: 'review',
      repetitions: 3,
      intervalDays: days,
      lapses: 0
    });
    expect(result.dueAt).toBe(new Date(now.getTime() + days * 86_400_000).toISOString());
  });

  it('uses one day as the first successful review baseline', () => {
    const result = schedule(card({ repetitions: 0, intervalDays: 0, state: 'new' }), 3, now);
    expect(result.intervalDays).toBe(3);
  });

  it('records a grade only for cards that exist', () => {
    const state = { ...createInitialState(), cards: [card(), card({ id: 'untouched' })] };
    expect(gradeCard(state, 'missing', 3, now)).toBe(state);
    const rated = gradeCard(state, 'card-1', 3, now);
    expect(rated.cards[0].intervalDays).toBe(5);
    expect(rated.cards[1]).toBe(state.cards[1]);
    expect(rated.reviews).toEqual([
      { cardId: 'card-1', grade: 3, reviewedAt: now.toISOString(), nextDueAt: rated.cards[0].dueAt }
    ]);
  });

  it('records a shadowing outcome only for known cards', () => {
    const state = { ...createInitialState(), cards: [card()] };
    expect(markShadowOutcome(state, 'missing', 'practice', now)).toBe(state);
    const next = markShadowOutcome(state, 'card-1', 'mastered', now);
    expect(next.shadowSessions[0]).toEqual({
      id: 'shadow-1790503200000-card-1',
      cardId: 'card-1',
      outcome: 'mastered',
      createdAt: now.toISOString()
    });
  });

  it('normalises daily goal updates and keeps settings immutable', () => {
    const state = createInitialState();
    expect(updateSettings(state, { dailyGoal: 0 }).settings.dailyGoal).toBe(1);
    expect(updateSettings(state, { dailyGoal: 500 }).settings.dailyGoal).toBe(100);
    expect(updateSettings(state, { dailyGoal: 6.7, locale: 'vi' }).settings).toMatchObject({
      dailyGoal: 7,
      locale: 'vi'
    });
    expect(updateSettings(state, { dailyGoal: Number.NaN }).settings.dailyGoal).toBe(12);
  });

  it('calculates a local-day review count and caps goal progress', () => {
    const state = createInitialState();
    state.reviews = [
      { cardId: 'a', grade: 3, reviewedAt: '2026-09-27T00:01:00.000Z', nextDueAt: '' },
      { cardId: 'b', grade: 3, reviewedAt: '2026-09-26T23:59:59.000Z', nextDueAt: '' },
      { cardId: 'c', grade: 3, reviewedAt: '2026-09-27T23:00:00.000Z', nextDueAt: '' }
    ];
    state.settings.dailyGoal = 1;
    expect(todayReviewCount(state, now)).toBe(2);
    expect(progressPercent(state, now)).toBe(100);
  });
});
