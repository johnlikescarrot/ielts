import { describe, expect, it } from 'vitest';

import {
  createCard,
  createInitialState,
  exportState,
  importState,
  isAppState,
  type PracticeCard,
  type ReviewEvent,
} from '../../src/core';

const now = new Date('2026-09-27T12:00:00.000Z');
const validReview: ReviewEvent = {
  id: 'review',
  cardId: 'card',
  rating: 3,
  reviewedAt: now.toISOString(),
  nextDue: now.toISOString(),
};

function validCard(): PracticeCard {
  return createCard(
    {
      prompt: 'focus',
      answer: 'attention',
      context: 'Keep your focus.',
      skill: 'reading',
      source: { title: 'Example', url: 'https://example.com' },
    },
    now,
    'card',
  );
}

function validState() {
  return {
    ...createInitialState(),
    cards: [validCard()],
    reviews: [validReview],
  };
}

describe('backup transfer', () => {
  it('exports and imports the versioned format', () => {
    const state = validState();
    const serialized = exportState(state, now);
    expect(JSON.parse(serialized)).toMatchObject({
      format: 'ielts-forge',
      version: 1,
      exportedAt: now.toISOString(),
    });
    expect(importState(serialized)).toEqual(state);
  });

  it('rejects malformed JSON and non-backup payloads', () => {
    expect(() => importState('{')).toThrow('This is not valid JSON.');
    expect(() => importState('null')).toThrow('This is not a valid IELTS Forge backup.');
    expect(() => importState('{"format":"other"}')).toThrow(
      'This is not a valid IELTS Forge backup.',
    );
    expect(() => importState('{"format":"ielts-forge","version":2}')).toThrow(
      'This is not a valid IELTS Forge backup.',
    );
    expect(() => importState('{"format":"ielts-forge","version":1,"state":null}')).toThrow(
      'This is not a valid IELTS Forge backup.',
    );
  });

  it.each([
    null,
    'state',
    {},
    { schemaVersion: 2 },
    { schemaVersion: 1, settings: null },
    { schemaVersion: 1, settings: { locale: 'fr', dailyGoal: 20 } },
    { schemaVersion: 1, settings: { locale: 'en', dailyGoal: '20' } },
    { schemaVersion: 1, settings: { locale: 'en', dailyGoal: 20.5 } },
    { schemaVersion: 1, settings: { locale: 'en', dailyGoal: 0 } },
    { schemaVersion: 1, settings: { locale: 'en', dailyGoal: 201 } },
    { schemaVersion: 1, settings: { locale: 'en', dailyGoal: 20 }, cards: null },
    {
      schemaVersion: 1,
      settings: { locale: 'en', dailyGoal: 20 },
      cards: [],
      reviews: null,
    },
  ])('rejects an invalid app state %#', (candidate) => {
    expect(isAppState(candidate)).toBe(false);
  });

  it.each([
    null,
    { ...validCard(), id: 1 },
    { ...validCard(), prompt: 1 },
    { ...validCard(), answer: 1 },
    { ...validCard(), context: 1 },
    { ...validCard(), skill: 'grammar' },
    { ...validCard(), source: 'source' },
    { ...validCard(), source: { title: 1, url: '' } },
    { ...validCard(), source: { title: '', url: 1 } },
    { ...validCard(), source: { title: '', url: 'javascript:alert(1)' } },
    { ...validCard(), createdAt: 1 },
    { ...validCard(), createdAt: 'not-a-date' },
    { ...validCard(), schedule: null },
    { ...validCard(), schedule: { ...validCard().schedule, due: 'not-a-date' } },
    { ...validCard(), schedule: { ...validCard().schedule, reps: 'one' } },
    { ...validCard(), schedule: { ...validCard().schedule, reps: Number.NaN } },
    { ...validCard(), schedule: { ...validCard().schedule, lastReview: 'not-a-date' } },
  ])('rejects a malformed card %#', (card) => {
    expect(isAppState({ ...createInitialState(), cards: [card] })).toBe(false);
  });

  it.each([
    null,
    { ...validReview, id: 1 },
    { ...validReview, cardId: 1 },
    { ...validReview, rating: 5 },
    { ...validReview, reviewedAt: 1 },
    { ...validReview, reviewedAt: 'not-a-date' },
    { ...validReview, nextDue: 1 },
    { ...validReview, nextDue: 'not-a-date' },
  ])('rejects a malformed review %#', (review) => {
    expect(isAppState({ ...createInitialState(), reviews: [review] })).toBe(false);
  });

  it('accepts null or valid source metadata and an optional valid last review', () => {
    const withNullSource = { ...validCard(), source: null };
    const withLastReview = {
      ...validCard(),
      source: { title: 'Title only', url: '' },
      schedule: { ...validCard().schedule, lastReview: now.toISOString() },
    };
    expect(isAppState({ ...createInitialState(), cards: [withNullSource, withLastReview] })).toBe(
      true,
    );
  });

  it('accepts a structurally valid state', () => {
    expect(isAppState(validState())).toBe(true);
  });
});
