import { describe, expect, it } from 'vitest';
import {
  createSessionState,
  markChunkCompleted,
  recordReplay,
  sessionToAttempt,
  ShadowingSessionState,
  summarizeSession,
} from '../../src/shadowing/shadowingSession';
import { buildShadowChunks } from '../../src/shadowing/chunker';

const cues = [
  { id: 'a', startSeconds: 0, text: 'Alpha beta gamma delta.' },
  { id: 'b', startSeconds: 6, text: 'Epsilon zeta eta theta.' },
  { id: 'c', startSeconds: 12, text: 'Iota kappa lambda mu.' },
  { id: 'd', startSeconds: 18, text: 'Nu xi omicron pi.' },
];
const chunks = buildShadowChunks(cues, 10);

describe('createSessionState', () => {
  it('initialises per-chunk tracking arrays', () => {
    const state = createSessionState(3, 10, '2026-09-28T00:00:00.000Z');
    expect(state).toEqual({
      startedAt: '2026-09-28T00:00:00.000Z',
      chunkSeconds: 10,
      totalChunks: 3,
      replays: [0, 0, 0],
      completedChunks: [false, false, false],
      currentIndex: 0,
    });
  });

  it('guards against nonsensical sizes', () => {
    expect(createSessionState(-4, 10).totalChunks).toBe(0);
    expect(createSessionState(2.9, 10).totalChunks).toBe(2);
  });
});

describe('recordReplay and markChunkCompleted', () => {
  it('counts replays and moves the cursor without mutating the input', () => {
    const initial = createSessionState(3, 10);
    const afterReplay = recordReplay(initial, 1);
    expect(initial.replays[1]).toBe(0);
    expect(afterReplay!.replays).toEqual([0, 1, 0]);
    expect(afterReplay!.currentIndex).toBe(1);
    const again = recordReplay(afterReplay, 1);
    expect(again!.replays).toEqual([0, 2, 0]);
  });

  it('passes a null session through unchanged for async-safe state updates', () => {
    expect(recordReplay(null, 0)).toBeNull();
    expect(markChunkCompleted(null, 0)).toBeNull();
  });

  it('ignores indexes outside the session', () => {
    const initial = createSessionState(3, 10);
    expect(recordReplay(initial, 7)).toBe(initial);
    expect(recordReplay(initial, -1)).toBe(initial);
    expect(markChunkCompleted(initial, 9)).toBe(initial);
  });

  it('marks completion independently of replay state', () => {
    const initial = createSessionState(2, 10);
    const completed = markChunkCompleted(initial, 0);
    expect(completed!.completedChunks).toEqual([true, false]);
    expect(initial.completedChunks).toEqual([false, false]);
  });
});

describe('summarizeSession', () => {
  it('summarises an untouched session as empty progress', () => {
    const summary = summarizeSession(createSessionState(4, 10), chunks);
    expect(summary).toMatchObject({
      totalChunks: 4,
      completedChunks: 0,
      replays: 0,
      wordsShadowed: 0,
      activeSeconds: 0,
      coveragePercent: 0,
      allCompleted: false,
    });
  });

  it('aggregates completions, replays, words, and active time', () => {
    let state: ShadowingSessionState | null = createSessionState(4, 10);
    state = recordReplay(state, 0);
    state = recordReplay(state, 0);
    state = recordReplay(state, 1);
    state = markChunkCompleted(state, 0);
    state = markChunkCompleted(state, 1);
    const summary = summarizeSession(state!, chunks);
    expect(summary.completedChunks).toBe(2);
    expect(summary.replays).toBe(3);
    expect(summary.coveragePercent).toBe(50);
    expect(summary.allCompleted).toBe(false);
    expect(summary.wordsShadowed).toBe(chunks[0].wordCount + chunks[1].wordCount);
    expect(summary.activeSeconds).toBe(
      chunks[0].endSeconds - chunks[0].startSeconds + (chunks[1].endSeconds - chunks[1].startSeconds),
    );
  });

  it('recognises a fully completed session and tolerates missing chunks', () => {
    let state: ShadowingSessionState | null = createSessionState(2, 10);
    state = markChunkCompleted(state, 0);
    state = markChunkCompleted(state, 1);
    const summary = summarizeSession(state!, chunks);
    expect(summary.allCompleted).toBe(true);
    expect(summary.coveragePercent).toBe(100);

    const gappy = summarizeSession(state!, [chunks[0]]);
    expect(gappy.completedChunks).toBe(2);
    expect(gappy.wordsShadowed).toBe(chunks[0].wordCount);
  });

  it('reports zero coverage for an empty session', () => {
    expect(summarizeSession(createSessionState(0, 10), []).coveragePercent).toBe(0);
  });
});

describe('sessionToAttempt', () => {
  it('converts the session into a local-history attempt without a band claim', async () => {
    let state: ShadowingSessionState | null = createSessionState(4, 10, '2026-09-28T00:00:00.000Z');
    state = recordReplay(state, 0);
    state = markChunkCompleted(state, 0);
    state = markChunkCompleted(state, 1);
    const attempt = sessionToAttempt(state!, chunks);
    expect(attempt).toMatchObject({
      skill: 'shadowing',
      testId: 'shadowing-studio',
      testTitle: 'Shadowing Studio session',
      rawScore: 2,
      totalQuestions: 4,
      estimatedBand: 0,
    });
    expect(attempt.timeSpentSeconds).toBeGreaterThan(0);
    expect(attempt.speakingNotes).toContain('2/4 chunks');
    expect(attempt.speakingNotes).toContain('no band estimate');
  });
});
