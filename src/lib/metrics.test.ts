import {describe, expect, it} from 'vitest';
import {addCard, createInitialState, recordSession} from './model';
import {
  compareTempo,
  countWords,
  cueAt,
  dueCards,
  formatClock,
  parseSubtitles,
  practiceStreak,
} from './metrics';

const now = new Date('2026-09-27T12:00:00.000Z');

describe('metrics', () => {
  it('counts multilingual words and formats safe clocks', () => {
    expect(countWords("well-being isn't 2026 — tốt")).toBe(4);
    expect(countWords('   ')).toBe(0);
    expect(formatClock(125.9)).toBe('02:05');
    expect(formatClock(-5)).toBe('00:00');
  });

  it('sorts only due cards', () => {
    let state = addCard(
      createInitialState(),
      {term: 'later', meaning: ''},
      new Date(now.getTime() + 1000),
    );
    state = addCard(state, {term: 'now', meaning: ''}, now);
    expect(
      dueCards(state.cards, new Date(now.getTime() + 500)).map(
        (card) => card.term,
      ),
    ).toEqual(['now']);
  });

  it('calculates consecutive UTC practice days', () => {
    let state = createInitialState();
    state = recordSession(state, 'writing', 1, '', now);
    state = recordSession(
      state,
      'speaking',
      1,
      '',
      new Date('2026-09-26T12:00:00Z'),
    );
    state = recordSession(
      state,
      'reading',
      1,
      '',
      new Date('2026-09-24T12:00:00Z'),
    );
    expect(practiceStreak(state.sessions, now)).toBe(2);
    expect(practiceStreak([], now)).toBe(0);
  });

  it.each([
    [0, 2, 'unknown'],
    [2, 0, 'unknown'],
    [10, 8, 'shorter'],
    [10, 13, 'longer'],
    [10, 10.5, 'close'],
  ] as const)('compares tempo %s/%s', (reference, attempt, result) => {
    expect(compareTempo(reference, attempt)).toBe(result);
  });

  it('parses VTT and SRT cues while rejecting malformed blocks', () => {
    const raw = `WEBVTT\n\n1\n00:00:01,000 --> 00:00:02,500 position:50%\n<b>Hello</b> world\n\nbad block\n\n00:03.000 --> 00:02.000\nBackwards\n\n00:xx --> 00:04.000\nBad time\n\n-->\nNo end time\n\n00:04.000 --> 00:05.000\n`;
    const cues = parseSubtitles(raw);
    expect(cues).toEqual([
      {id: 'cue-1', start: 1, end: 2.5, text: 'Hello world'},
    ]);
    expect(cueAt(cues, 1.5)?.text).toBe('Hello world');
    expect(cueAt(cues, 3)).toBeUndefined();
    expect(parseSubtitles('  ')).toEqual([]);
  });

  it('parses hour timestamps and rejects unsupported timestamp shapes', () => {
    const cues = parseSubtitles(
      `00:00:01.000 --> 00:00:02.000\nOne\n\n1:2:3:4 --> 00:04.000\nNo\n\n00:05 --> 00:06\nTwo`,
    );
    expect(cues.map((cue) => cue.start)).toEqual([1, 5]);
  });
});
