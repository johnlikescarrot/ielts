import { ShadowChunk } from './shadowingSession';

/**
 * Configuration of the shadowing loop. These values can be tuned between
 * chunks; the reducer stores them so every transition stays pure and testable.
 */
export interface ShadowConfig {
  /** Continue to the next chunk automatically when the current one ends. */
  autoAdvance: boolean;
  /** Silent gap between chunks, in seconds, reserved for repeating aloud. */
  pauseBetweenSeconds: number;
  /** How many times each chunk is played before moving on. */
  repeatEachChunk: number;
}

export const DEFAULT_SHADOW_CONFIG: ShadowConfig = {
  autoAdvance: true,
  pauseBetweenSeconds: 3,
  repeatEachChunk: 1,
};

export type ShadowPhase = 'ready' | 'playing' | 'paused' | 'waiting' | 'finished';

/**
 * Side effect the player surface must perform after a transition.
 * `nonce` increments whenever a new command is issued so React effects can
 * detect it reliably without stale-closure issues.
 */
export interface ShadowCommand {
  action: 'play' | 'pause' | 'none';
  nonce: number;
  fromSeconds: number;
}

export interface ShadowState {
  chunks: ShadowChunk[];
  config: ShadowConfig;
  index: number;
  phase: ShadowPhase;
  /** Completed plays of the current chunk inside the current repetition set. */
  repeatDone: number;
  /** Chunks fully practised (repetition set completed) this session. */
  completedChunks: number;
  /** Total chunk plays finished this session, across all chunks. */
  totalReps: number;
  command: ShadowCommand;
}

export type ShadowEvent =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'REPLAY' }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'GOTO'; index: number }
  /** The media reached the end of the chunk (or the speech finished). */
  | { type: 'CHUNK_DONE' }
  /** The repetition-gap timer elapsed. */
  | { type: 'WAIT_DONE' }
  | { type: 'STOP' }
  | { type: 'CONFIG'; config: Partial<ShadowConfig> };

export function createShadowState(
  chunks: ShadowChunk[],
  config: ShadowConfig = DEFAULT_SHADOW_CONFIG
): ShadowState {
  return {
    chunks,
    config,
    index: 0,
    phase: 'ready',
    repeatDone: 0,
    completedChunks: 0,
    totalReps: 0,
    command: { action: 'none', nonce: 0, fromSeconds: 0 },
  };
}

function command(state: ShadowState, action: 'play' | 'pause' | 'none', fromSeconds: number): ShadowCommand {
  return { action, nonce: state.command.nonce + 1, fromSeconds };
}

function moveTo(state: ShadowState, targetIndex: number, autoplay: boolean): ShadowState {
  const chunk = state.chunks[targetIndex];
  if (!chunk) {
    return state;
  }
  if (targetIndex === state.index) {
    if (autoplay) {
      return {
        ...state,
        phase: 'playing',
        repeatDone: 0,
        command: command(state, 'play', chunk.startSeconds),
      };
    }
    return state;
  }
  return {
    ...state,
    index: targetIndex,
    repeatDone: 0,
    phase: autoplay ? 'playing' : 'paused',
    command: command(state, autoplay ? 'play' : 'none', chunk.startSeconds),
  };
}

/** Move on after a chunk (or its whole repetition set) finished. */
function advanceFrom(state: ShadowState): ShadowState {
  if (state.index + 1 < state.chunks.length) {
    const next = state.chunks[state.index + 1];
    return {
      ...state,
      index: state.index + 1,
      repeatDone: 0,
      phase: 'playing',
      command: command(state, 'play', next.startSeconds),
    };
  }
  return {
    ...state,
    repeatDone: 0,
    phase: 'finished',
    command: command(state, 'pause', 0),
  };
}

export function shadowReducer(state: ShadowState, event: ShadowEvent): ShadowState {
  switch (event.type) {
    case 'PLAY': {
      const chunk = state.chunks[state.index];
      return {
        ...state,
        phase: 'playing',
        repeatDone: 0,
        command: command(state, 'play', chunk.startSeconds),
      };
    }
    case 'PAUSE': {
      return {
        ...state,
        phase: 'paused',
        command: command(state, 'pause', 0),
      };
    }
    case 'REPLAY': {
      const chunk = state.chunks[state.index];
      return {
        ...state,
        phase: 'playing',
        repeatDone: 0,
        command: command(state, 'play', chunk.startSeconds),
      };
    }
    case 'NEXT': {
      const resume = state.phase === 'playing' || state.phase === 'waiting';
      if (state.index + 1 >= state.chunks.length) {
        if (!resume) {
          return state;
        }
        return { ...state, repeatDone: 0, phase: 'finished', command: command(state, 'pause', 0) };
      }
      return moveTo(state, state.index + 1, resume);
    }
    case 'PREV': {
      const resume = state.phase === 'playing' || state.phase === 'waiting';
      return moveTo(state, Math.max(state.index - 1, 0), resume);
    }
    case 'GOTO': {
      return moveTo(state, event.index, true);
    }
    case 'CHUNK_DONE': {
      if (state.phase !== 'playing') {
        return state;
      }
      const repeated: ShadowState = {
        ...state,
        totalReps: state.totalReps + 1,
        repeatDone: state.repeatDone + 1,
      };
      if (repeated.repeatDone < state.config.repeatEachChunk) {
        const chunk = state.chunks[state.index];
        return {
          ...repeated,
          phase: 'playing',
          command: command(state, 'play', chunk.startSeconds),
        };
      }
      const completed: ShadowState = { ...repeated, completedChunks: state.completedChunks + 1 };
      if (!state.config.autoAdvance) {
        return { ...completed, phase: 'paused', command: command(state, 'pause', 0) };
      }
      if (state.config.pauseBetweenSeconds > 0) {
        return { ...completed, phase: 'waiting', command: command(state, 'pause', 0) };
      }
      return advanceFrom(completed);
    }
    case 'WAIT_DONE': {
      if (state.phase !== 'waiting') {
        return state;
      }
      return advanceFrom(state);
    }
    case 'STOP': {
      if (state.phase === 'finished') {
        return state;
      }
      return { ...state, phase: 'paused', command: command(state, 'pause', 0) };
    }
    case 'CONFIG': {
      return { ...state, config: { ...state.config, ...event.config } };
    }
  }
}
