import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/domain/seed';
import { parseState } from '../src/domain/validate';

describe('state validation', () => {
  it.each([null, 'state', 12, []])('rejects non-state values: %p', (value) => {
    expect(parseState(value)).toBeNull();
  });

  it('rejects incompatible state version and absent or invalid card collection', () => {
    const state = createInitialState();
    expect(parseState({ ...state, version: 2 })).toBeNull();
    expect(parseState({ version: 1 })).toBeNull();
    expect(parseState({ ...state, cards: [{}] })).toBeNull();
    expect(parseState({ ...state, cards: [null] })).toBeNull();
  });

  it.each([
    'id',
    'front',
    'back',
    'context',
    'createdAt',
    'dueAt',
    'intervalDays',
    'repetitions',
    'lapses',
    'state'
  ])('rejects a card with invalid %s', (field) => {
    const state = createInitialState();
    const broken = { ...state.cards[0], [field]: null };
    expect(parseState({ ...state, cards: [broken] })).toBeNull();
  });

  it('rejects malformed tag arrays and card states', () => {
    const state = createInitialState();
    expect(parseState({ ...state, cards: [{ ...state.cards[0], tags: 'nope' }] })).toBeNull();
    expect(parseState({ ...state, cards: [{ ...state.cards[0], state: 'bad' }] })).toBeNull();
  });

  it('accepts a state, preserving valid data and filling optional collections/settings', () => {
    const state = createInitialState();
    const restored = parseState({ version: 1, cards: state.cards, settings: { locale: 'vi' } });
    expect(restored).toMatchObject({
      version: 1,
      cards: state.cards,
      reviews: [],
      shadowSessions: [],
      settings: { locale: 'vi', theme: 'light', dailyGoal: 12 }
    });
  });
});
