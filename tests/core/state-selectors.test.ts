import { describe, expect, it } from 'vitest';

import {
  addCard,
  cardsForSkill,
  createCard,
  createInitialState,
  dayKey,
  dueCards,
  isLocale,
  removeCard,
  reviewCard,
  studyStats,
  updateSettings,
  type AppState,
  type PracticeCard,
  type ReviewEvent,
} from '../../src/core';

const now = new Date(2026, 8, 27, 12);

function makeCard(id: string, overrides: Partial<PracticeCard> = {}): PracticeCard {
  return {
    ...createCard({ prompt: `prompt ${id}` }, now, id),
    ...overrides,
  };
}

describe('application state', () => {
  it('creates the English-first empty state', () => {
    expect(createInitialState()).toEqual({
      schemaVersion: 1,
      settings: { locale: 'en', dailyGoal: 20 },
      cards: [],
      reviews: [],
    });
  });

  it('validates required capture content', () => {
    expect(() => createCard({ prompt: '  ' }, now, 'bad')).toThrow(
      'A word, phrase, or prompt is required.',
    );
  });

  it('creates cards with defaults and no empty source', () => {
    const card = createCard({ prompt: '  focus  ' }, now, 'one');
    expect(card).toMatchObject({
      id: 'one',
      prompt: 'focus',
      answer: '',
      context: '',
      skill: 'reading',
      source: null,
    });
  });

  it('keeps title-only and URL-only source metadata', () => {
    expect(createCard({ prompt: 'one', source: { title: ' Page ' } }, now, 'one').source).toEqual({
      title: 'Page',
      url: '',
    });
    expect(
      createCard(
        {
          prompt: 'two',
          answer: ' note ',
          context: ' sentence ',
          skill: 'speaking',
          source: { url: 'https://example.com' },
        },
        now,
        'two',
      ).source,
    ).toEqual({ title: '', url: 'https://example.com/' });
  });

  it('adds unique cards and returns the existing duplicate', () => {
    const state = createInitialState();
    const first = makeCard('first', {
      prompt: 'Focus',
      context: 'A sentence',
      source: { title: '', url: 'https://example.com' },
    });
    const added = addCard(state, first);
    expect(added.added).toBe(true);

    const duplicate = addCard(
      added.state,
      makeCard('duplicate', {
        prompt: ' focus ',
        context: 'a sentence',
        source: { title: 'Example', url: 'HTTPS://EXAMPLE.COM' },
      }),
    );
    expect(duplicate).toEqual({ state: added.state, card: first, added: false });

    const sourceFree = addCard(added.state, makeCard('source-free'));
    expect(sourceFree.added).toBe(true);
  });

  it('removes a card and its review history', () => {
    const first = makeCard('first');
    const second = makeCard('second');
    const state: AppState = {
      ...createInitialState(),
      cards: [first, second],
      reviews: [
        {
          id: 'r1',
          cardId: 'first',
          rating: 3,
          reviewedAt: now.toISOString(),
          nextDue: now.toISOString(),
        },
        {
          id: 'r2',
          cardId: 'second',
          rating: 3,
          reviewedAt: now.toISOString(),
          nextDue: now.toISOString(),
        },
      ],
    };
    expect(removeCard(state, 'first')).toMatchObject({
      cards: [second],
      reviews: [state.reviews[1]],
    });
  });

  it('reviews one card without changing its neighbours', () => {
    const first = makeCard('first');
    const second = makeCard('second');
    const state = { ...createInitialState(), cards: [first, second] };
    const reviewed = reviewCard(state, 'first', 3, now, 'review');
    expect(reviewed.cards[0]?.schedule.reps).toBe(1);
    expect(reviewed.cards[1]).toEqual(second);
    expect(reviewed.reviews[0]).toMatchObject({
      id: 'review',
      cardId: 'first',
      rating: 3,
      reviewedAt: now.toISOString(),
    });
    expect(() => reviewCard(state, 'missing', 3, now, 'review')).toThrow('Card not found.');
  });

  it('merges settings and identifies supported locales', () => {
    const state = updateSettings(createInitialState(), { locale: 'vi', dailyGoal: 30 });
    expect(state.settings).toEqual({ locale: 'vi', dailyGoal: 30 });
    expect(isLocale('en')).toBe(true);
    expect(isLocale('vi')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });
});

describe('study selectors', () => {
  it('uses local calendar dates', () => {
    expect(dayKey(new Date(2026, 0, 2))).toBe('2026-01-02');
  });

  it('filters and orders due cards and skills', () => {
    const earlier = makeCard('earlier', {
      skill: 'speaking',
      schedule: { ...makeCard('x').schedule, due: new Date(now.getTime() - 2_000).toISOString() },
    });
    const later = makeCard('later', {
      skill: 'reading',
      schedule: { ...makeCard('y').schedule, due: new Date(now.getTime() - 1_000).toISOString() },
    });
    const future = makeCard('future', {
      skill: 'speaking',
      schedule: { ...makeCard('z').schedule, due: new Date(now.getTime() + 1_000).toISOString() },
    });
    expect(dueCards([later, future, earlier], now).map((card) => card.id)).toEqual([
      'earlier',
      'later',
    ]);
    expect(cardsForSkill([earlier, later, future], 'speaking')).toEqual([earlier, future]);
  });

  it("calculates progress, today's reviews, a current streak, and the cap", () => {
    const review = (id: string, date: Date): ReviewEvent => ({
      id,
      cardId: 'card',
      rating: 3,
      reviewedAt: date.toISOString(),
      nextDue: date.toISOString(),
    });
    const yesterday = new Date(2026, 8, 26, 12);
    const old = new Date(2026, 8, 24, 12);
    const card = makeCard('card');
    const state: AppState = {
      ...createInitialState(),
      settings: { locale: 'en', dailyGoal: 1 },
      cards: [card],
      reviews: [review('today', now), review('yesterday', yesterday), review('old', old)],
    };
    expect(studyStats(state, now)).toEqual({
      due: 1,
      learned: 1,
      reviewedToday: 1,
      streak: 2,
      progress: 100,
    });
  });

  it('starts a streak from yesterday and handles no reviews', () => {
    const yesterday = new Date(2026, 8, 26, 12);
    const review: ReviewEvent = {
      id: 'yesterday',
      cardId: 'card',
      rating: 3,
      reviewedAt: yesterday.toISOString(),
      nextDue: yesterday.toISOString(),
    };
    expect(studyStats({ ...createInitialState(), reviews: [review] }, now)).toMatchObject({
      reviewedToday: 0,
      streak: 1,
      progress: 0,
    });
    expect(studyStats(createInitialState(), now).streak).toBe(0);
  });
});
