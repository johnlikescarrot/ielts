import { describe, expect, it } from 'vitest';
import { ShadowChunk } from '../../src/shadowing/shadowingSession';
import {
  createShadowState,
  DEFAULT_SHADOW_CONFIG,
  shadowReducer,
  ShadowState,
} from '../../src/shadowing/shadowReducer';

const chunk = (index: number, startSeconds: number): ShadowChunk => ({
  id: `chunk_${index + 1}`,
  index,
  startSeconds,
  endSeconds: startSeconds + 10,
  text: `text ${index + 1}`,
  cueCount: 1,
  wordCount: 2,
});

const CHUNKS = [chunk(0, 0), chunk(1, 10), chunk(2, 20)];

const state = (overrides: Partial<ShadowState> = {}): ShadowState => ({
  ...createShadowState(CHUNKS),
  ...overrides,
});

describe('shadowReducer', () => {
  it('creates the initial state', () => {
    expect(createShadowState(CHUNKS)).toEqual({
      chunks: CHUNKS,
      config: DEFAULT_SHADOW_CONFIG,
      index: 0,
      phase: 'ready',
      repeatDone: 0,
      completedChunks: 0,
      totalReps: 0,
      command: { action: 'none', nonce: 0, fromSeconds: 0 },
    });
    expect(DEFAULT_SHADOW_CONFIG).toEqual({ autoAdvance: true, pauseBetweenSeconds: 3, repeatEachChunk: 1 });
  });

  it('plays, pauses and replays the current chunk', () => {
    const played = shadowReducer(state(), { type: 'PLAY' });
    expect(played.phase).toBe('playing');
    expect(played.command).toEqual({ action: 'play', nonce: 1, fromSeconds: 0 });

    const paused = shadowReducer(played, { type: 'PAUSE' });
    expect(paused.phase).toBe('paused');
    expect(paused.command).toEqual({ action: 'pause', nonce: 2, fromSeconds: 0 });

    const replayed = shadowReducer(paused, { type: 'REPLAY' });
    expect(replayed.phase).toBe('playing');
    expect(replayed.repeatDone).toBe(0);
    expect(replayed.command).toEqual({ action: 'play', nonce: 3, fromSeconds: 0 });
  });

  it('moves next and previous, keeping the playback intent', () => {
    const playing = state({ phase: 'playing' });
    const next = shadowReducer(playing, { type: 'NEXT' });
    expect(next.index).toBe(1);
    expect(next.phase).toBe('playing');
    expect(next.command).toEqual({ action: 'play', nonce: 1, fromSeconds: 10 });

    const pausedNext = shadowReducer(state({ index: 1, phase: 'paused' }), { type: 'NEXT' });
    expect(pausedNext.index).toBe(2);
    expect(pausedNext.phase).toBe('paused');
    expect(pausedNext.command.action).toBe('none');

    const prev = shadowReducer(state({ index: 2, phase: 'playing' }), { type: 'PREV' });
    expect(prev.index).toBe(1);
    expect(prev.command.action).toBe('play');

    const pausedPrev = shadowReducer(state({ index: 2, phase: 'paused' }), { type: 'PREV' });
    expect(pausedPrev.index).toBe(1);
    expect(pausedPrev.phase).toBe('paused');
    expect(pausedPrev.command.action).toBe('none');
  });

  it('resumes playback when navigating away from the repeat gap', () => {
    const waiting = state({ index: 1, phase: 'waiting' });
    const next = shadowReducer(waiting, { type: 'NEXT' });
    expect(next.index).toBe(2);
    expect(next.phase).toBe('playing');
    expect(next.command.action).toBe('play');

    const prev = shadowReducer(waiting, { type: 'PREV' });
    expect(prev.index).toBe(0);
    expect(prev.phase).toBe('playing');
    expect(prev.command.action).toBe('play');
  });

  it('replays the first chunk on previous while playing, and ignores it while paused', () => {
    const playing = state({ phase: 'playing' });
    const prev = shadowReducer(playing, { type: 'PREV' });
    expect(prev.index).toBe(0);
    expect(prev.phase).toBe('playing');
    expect(prev.command.action).toBe('play');

    const paused = state({ phase: 'paused' });
    expect(shadowReducer(paused, { type: 'PREV' })).toBe(paused);
  });

  it('finishes on next past the last chunk while playing and ignores it while paused', () => {
    const playing = state({ index: 2, phase: 'playing' });
    const finished = shadowReducer(playing, { type: 'NEXT' });
    expect(finished.phase).toBe('finished');
    expect(finished.command.action).toBe('pause');

    const paused = state({ index: 2, phase: 'paused' });
    expect(shadowReducer(paused, { type: 'NEXT' })).toBe(paused);
  });

  it('jumps to any chunk and starts playing it', () => {
    const jumped = shadowReducer(state({ phase: 'paused', index: 0 }), { type: 'GOTO', index: 2 });
    expect(jumped.index).toBe(2);
    expect(jumped.phase).toBe('playing');
    expect(jumped.command).toEqual({ action: 'play', nonce: 1, fromSeconds: 20 });

    const same = state({ index: 1, phase: 'playing' });
    const restarted = shadowReducer(same, { type: 'GOTO', index: 1 });
    expect(restarted.index).toBe(1);
    expect(restarted.command.action).toBe('play');

    const invalid = state({ index: 1 });
    expect(shadowReducer(invalid, { type: 'GOTO', index: 9 })).toBe(invalid);
    expect(shadowReducer(invalid, { type: 'GOTO', index: -1 })).toBe(invalid);
  });

  it('ignores chunk completion unless playing', () => {
    const paused = state({ phase: 'paused' });
    expect(shadowReducer(paused, { type: 'CHUNK_DONE' })).toBe(paused);
  });

  it('repeats the chunk until the repetition set completes', () => {
    const config = { autoAdvance: false, pauseBetweenSeconds: 0, repeatEachChunk: 2 };
    const playing = state({ config, phase: 'playing' });

    const first = shadowReducer(playing, { type: 'CHUNK_DONE' });
    expect(first.repeatDone).toBe(1);
    expect(first.totalReps).toBe(1);
    expect(first.completedChunks).toBe(0);
    expect(first.phase).toBe('playing');
    expect(first.command.action).toBe('play');

    const second = shadowReducer(first, { type: 'CHUNK_DONE' });
    expect(second.repeatDone).toBe(2);
    expect(second.totalReps).toBe(2);
    expect(second.completedChunks).toBe(1);
    expect(second.phase).toBe('paused');
    expect(second.command.action).toBe('pause');
  });

  it('waits between chunks when a repeat gap is configured', () => {
    const playing = state({ phase: 'playing', config: { ...DEFAULT_SHADOW_CONFIG, pauseBetweenSeconds: 3 } });
    const waiting = shadowReducer(playing, { type: 'CHUNK_DONE' });
    expect(waiting.phase).toBe('waiting');
    expect(waiting.completedChunks).toBe(1);
    expect(waiting.command.action).toBe('pause');

    expect(shadowReducer(state({ phase: 'playing' }), { type: 'WAIT_DONE' }).phase).toBe('playing');

    const advanced = shadowReducer(waiting, { type: 'WAIT_DONE' });
    expect(advanced.index).toBe(1);
    expect(advanced.phase).toBe('playing');
    expect(advanced.command).toEqual({ action: 'play', nonce: 2, fromSeconds: 10 });
  });

  it('advances immediately without a repeat gap', () => {
    const playing = state({
      phase: 'playing',
      config: { autoAdvance: true, pauseBetweenSeconds: 0, repeatEachChunk: 1 },
    });
    const advanced = shadowReducer(playing, { type: 'CHUNK_DONE' });
    expect(advanced.index).toBe(1);
    expect(advanced.phase).toBe('playing');
    expect(advanced.command.action).toBe('play');
  });

  it('finishes after the last chunk completes', () => {
    const playing = state({
      index: 2,
      phase: 'playing',
      config: { autoAdvance: true, pauseBetweenSeconds: 0, repeatEachChunk: 1 },
    });
    const finished = shadowReducer(playing, { type: 'CHUNK_DONE' });
    expect(finished.phase).toBe('finished');
    expect(finished.command.action).toBe('pause');
    expect(finished.completedChunks).toBe(1);

    const waitingLast = state({ index: 2, phase: 'waiting' });
    expect(shadowReducer(waitingLast, { type: 'WAIT_DONE' }).phase).toBe('finished');
  });

  it('stops playback unless already finished', () => {
    const stopped = shadowReducer(state({ phase: 'waiting' }), { type: 'STOP' });
    expect(stopped.phase).toBe('paused');
    expect(stopped.command.action).toBe('pause');

    const finished = state({ phase: 'finished' });
    expect(shadowReducer(finished, { type: 'STOP' })).toBe(finished);
  });

  it('merges configuration changes without issuing a command', () => {
    const updated = shadowReducer(state(), { type: 'CONFIG', config: { autoAdvance: false, repeatEachChunk: 3 } });
    expect(updated.config).toEqual({ autoAdvance: false, pauseBetweenSeconds: 3, repeatEachChunk: 3 });
    expect(updated.command).toEqual({ action: 'none', nonce: 0, fromSeconds: 0 });
  });
});
