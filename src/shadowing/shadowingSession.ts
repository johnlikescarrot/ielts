import { TestAttempt } from '../types';
import { ShadowChunk } from './chunker';

/**
 * Pure, immutable session tracking for a shadowing workout.
 * The reference Shadow Player keeps everything in memory and forgets progress
 * on reload; IELTS Slayer tracks per-chunk replays so learners can review
 * which chunks need more work, and can persist the summary locally.
 */

export interface ShadowingSessionState {
  startedAt: string;
  chunkSeconds: number;
  totalChunks: number;
  replays: number[];
  completedChunks: boolean[];
  currentIndex: number;
}

export interface ShadowingSummary {
  totalChunks: number;
  completedChunks: number;
  replays: number;
  wordsShadowed: number;
  activeSeconds: number;
  coveragePercent: number;
  allCompleted: boolean;
}

export function createSessionState(
  totalChunks: number,
  chunkSeconds: number,
  startedAt: string = new Date().toISOString(),
): ShadowingSessionState {
  const safeTotal = Math.max(0, Math.floor(totalChunks));
  return {
    startedAt,
    chunkSeconds,
    totalChunks: safeTotal,
    replays: new Array(safeTotal).fill(0),
    completedChunks: new Array(safeTotal).fill(false),
    currentIndex: 0,
  };
}

function withState(
  state: ShadowingSessionState | null,
  chunkIndex: number,
  update: (draft: ShadowingSessionState) => void,
): ShadowingSessionState | null {
  if (!state || chunkIndex < 0 || chunkIndex >= state.totalChunks) return state;
  const next: ShadowingSessionState = {
    ...state,
    replays: [...state.replays],
    completedChunks: [...state.completedChunks],
  };
  update(next);
  return next;
}

/**
 * Records one listen/replay of a chunk and moves the cursor onto it.
 * A null session (for example after a reset) passes through unchanged, which
 * lets React state updaters stay branch-free.
 */
export function recordReplay(
  state: ShadowingSessionState | null,
  chunkIndex: number,
): ShadowingSessionState | null {
  return withState(state, chunkIndex, draft => {
    draft.replays[chunkIndex] += 1;
    draft.currentIndex = chunkIndex;
  });
}

/** Marks a chunk as fully shadowed (played through or advanced past after listening). */
export function markChunkCompleted(
  state: ShadowingSessionState | null,
  chunkIndex: number,
): ShadowingSessionState | null {
  return withState(state, chunkIndex, draft => {
    draft.completedChunks[chunkIndex] = true;
  });
}

export function summarizeSession(state: ShadowingSessionState, chunks: ShadowChunk[]): ShadowingSummary {
  const completedChunks = state.completedChunks.reduce((done, flag) => done + Number(flag), 0);
  const replays = state.replays.reduce((sum, count) => sum + count, 0);
  let wordsShadowed = 0;
  let activeSeconds = 0;
  state.completedChunks.forEach((completed, index) => {
    const chunk = chunks[index];
    if (!completed || !chunk) return;
    wordsShadowed += chunk.wordCount;
    activeSeconds += Math.max(0, chunk.endSeconds - chunk.startSeconds);
  });
  return {
    totalChunks: state.totalChunks,
    completedChunks,
    replays,
    wordsShadowed,
    activeSeconds,
    coveragePercent: state.totalChunks === 0 ? 0 : Math.round((completedChunks / state.totalChunks) * 100),
    allCompleted: state.totalChunks > 0 && completedChunks === state.totalChunks,
  };
}

/** Converts a finished session into a local history attempt (no band is claimed for shadowing). */
export function sessionToAttempt(state: ShadowingSessionState, chunks: ShadowChunk[]): Omit<TestAttempt, 'id' | 'date'> {
  const summary = summarizeSession(state, chunks);
  return {
    skill: 'shadowing',
    testId: 'shadowing-studio',
    testTitle: 'Shadowing Studio session',
    rawScore: summary.completedChunks,
    totalQuestions: summary.totalChunks,
    estimatedBand: 0,
    timeSpentSeconds: summary.activeSeconds,
    speakingNotes:
      `Shadowed ${summary.completedChunks}/${summary.totalChunks} chunks · ` +
      `${summary.replays} replays · ${state.chunkSeconds}s chunks · ` +
      `${summary.wordsShadowed} words (no band estimate)`,
  };
}
