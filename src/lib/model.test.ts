import {describe, expect, it} from 'vitest';
import {
  addCapture,
  addCard,
  createInitialState,
  importState,
  makeId,
  recordSession,
  reviewCard,
  saveDraft,
  updateCardMeaning,
  updateSettings,
} from './model';

const now = new Date('2026-09-27T12:00:00.000Z');

describe('study model', () => {
  it('creates stable defaults and IDs', () => {
    expect(createInitialState()).toMatchObject({
      schemaVersion: 1,
      settings: {locale: 'en', targetBand: 7},
    });
    expect(makeId('x', now, '😀')).toMatch(/^x-/);
    expect(makeId('x', now, 'same')).toBe(makeId('x', now, 'same'));
  });

  it('adds unique trimmed cards and ignores blank or duplicate terms', () => {
    const initial = createInitialState();
    expect(addCard(initial, {term: '  ', meaning: ''}, now)).toBe(initial);
    const added = addCard(
      initial,
      {
        term: '  nuance ',
        meaning: ' detail ',
        context: ' context ',
        sourceTitle: ' title ',
        sourceUrl: ' url ',
      },
      now,
    );
    expect(added.cards[0]).toMatchObject({
      term: 'nuance',
      meaning: 'detail',
      context: 'context',
      sourceTitle: 'title',
      sourceUrl: 'url',
    });
    expect(addCard(added, {term: 'NUANCE', meaning: 'other'}, now)).toBe(added);
    expect(
      addCard(initial, {term: 'plain', meaning: ''}, now).cards[0],
    ).toMatchObject({context: '', sourceTitle: '', sourceUrl: ''});
  });

  it('captures selections, deduplicates them, and creates cards only for short text', () => {
    const initial = createInitialState();
    expect(addCapture(initial, {text: '   '}, now)).toBe(initial);
    const short = addCapture(
      initial,
      {text: '  active   recall  ', sourceTitle: ' Page ', sourceUrl: ' url '},
      now,
    );
    expect(short.captures[0]).toMatchObject({
      text: 'active recall',
      sourceTitle: 'Page',
      sourceUrl: 'url',
      cardId: short.cards[0].id,
    });
    expect(
      addCapture(short, {text: 'active recall', sourceUrl: 'url'}, now),
    ).toBe(short);
    const existingCard = addCapture(
      short,
      {text: 'ACTIVE RECALL', sourceUrl: 'another'},
      new Date(now.getTime() + 1),
    );
    expect(existingCard.cards).toHaveLength(1);
    expect(existingCard.captures[0].cardId).toBe(short.cards[0].id);
    const long = addCapture(initial, {text: 'x'.repeat(121)}, now);
    expect(long.cards).toHaveLength(0);
    expect(long.captures[0].cardId).toBeUndefined();
  });

  it('updates meanings, reviews matching cards, and leaves other cards unchanged', () => {
    let state = addCard(createInitialState(), {term: 'one', meaning: ''}, now);
    state = addCard(
      state,
      {term: 'two', meaning: ''},
      new Date(now.getTime() + 1),
    );
    const firstId = state.cards[1].id;
    const updated = updateCardMeaning(state, firstId, ' first ');
    expect(updated.cards[1].meaning).toBe('first');
    expect(updated.cards[0]).toEqual(state.cards[0]);
    const reviewed = reviewCard(updated, firstId, 'good', now);
    expect(reviewed.cards[1].schedule.reps).toBe(1);
    expect(reviewed.cards[0]).toEqual(updated.cards[0]);
    expect(reviewed.sessions.at(-1)).toMatchObject({
      skill: 'vocabulary',
      detail: 'good',
    });
  });

  it('records sessions, drafts, and settings', () => {
    let state = recordSession(
      createInitialState(),
      'writing',
      0.2,
      ' note ',
      now,
    );
    expect(state.sessions[0]).toMatchObject({minutes: 1, detail: 'note'});
    state = recordSession(
      state,
      'speaking',
      1.6,
      'talk',
      new Date(now.getTime() + 1),
    );
    expect(state.sessions[1].minutes).toBe(2);
    state = saveDraft(state, 'task', 'body', ['a'], now);
    state = saveDraft(state, 'task', 'new', ['b'], now);
    expect(state.drafts).toEqual([
      {
        taskId: 'task',
        body: 'new',
        checkedCriteria: ['b'],
        updatedAt: now.toISOString(),
      },
    ]);
    expect(updateSettings(state, {locale: 'vi'}).settings.locale).toBe('vi');
  });

  it('imports valid backups with sanitized settings and rejects invalid ones', () => {
    const base = createInitialState();
    expect(importState(base)).toEqual(base);
    const fallback = importState({
      ...base,
      settings: {
        locale: 'xx',
        targetBand: 'bad',
        dailyGoal: null,
        theme: 'weird',
      },
    });
    expect(fallback.settings).toEqual(base.settings);
    expect(importState({...base, settings: null}).settings).toEqual(
      base.settings,
    );
    expect(
      importState({
        ...base,
        settings: {locale: 'vi', targetBand: 8, dailyGoal: 30, theme: 'light'},
      }).settings,
    ).toEqual({locale: 'vi', targetBand: 8, dailyGoal: 30, theme: 'light'});
    expect(
      importState({...base, settings: {theme: 'dark'}}).settings.theme,
    ).toBe('dark');
    expect(() => importState(null)).toThrow('Unsupported');
    expect(() => importState({schemaVersion: 2})).toThrow('Unsupported');
    expect(() => importState({...base, cards: null})).toThrow('Incomplete');
  });
});
