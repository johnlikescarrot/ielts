import { describe, expect, it } from 'vitest';
import {
  clampChunkSeconds,
  createShadowingChunks,
  getAdjacentChunkIndex,
  getShadowingProgress,
} from '../../src/video/shadowingSession';
import type { TranscriptCue } from '../../src/video/videoLesson';

const cues: TranscriptCue[] = [
  { id: 'cue-1', startSeconds: 0, text: 'Public transport can transform growing cities.' },
  { id: 'cue-2', startSeconds: 4, text: 'Reliable services improve access to education.' },
  { id: 'cue-3', startSeconds: 9, text: 'Investment must remain sustainable.' },
  { id: 'cue-4', startSeconds: 18, text: 'Communities benefit from careful planning.' },
];

describe('shadowing session engine', () => {
  it('clamps requested chunk length to the safe three-to-120-second range', () => {
    expect(clampChunkSeconds(-1)).toBe(3);
    expect(clampChunkSeconds(8.9)).toBe(8);
    expect(clampChunkSeconds(999)).toBe(120);
    expect(clampChunkSeconds(Number.NaN)).toBe(8);
  });

  it('groups adjacent transcript cues into deterministic practice chunks', () => {
    expect(createShadowingChunks(cues, 8)).toEqual([
      {
        id: 'shadow-1',
        cueIds: ['cue-1', 'cue-2'],
        startSeconds: 0,
        endSeconds: 9,
        durationSeconds: 9,
        text: 'Public transport can transform growing cities. Reliable services improve access to education.',
      },
      {
        id: 'shadow-2',
        cueIds: ['cue-3'],
        startSeconds: 9,
        endSeconds: 18,
        durationSeconds: 9,
        text: 'Investment must remain sustainable.',
      },
      {
        id: 'shadow-3',
        cueIds: ['cue-4'],
        startSeconds: 18,
        endSeconds: 21,
        durationSeconds: 3,
        text: 'Communities benefit from careful planning.',
      },
    ]);
  });

  it('handles empty, out-of-order, silent-gap, and very long final cues safely', () => {
    expect(createShadowingChunks([])).toEqual([]);
    const unusual: TranscriptCue[] = [
      { id: 'later', startSeconds: 10, text: 'One two.' },
      { id: 'earlier', startSeconds: 5, text: 'This final caption contains '.concat('many '.repeat(400)) },
    ];
    const chunks = createShadowingChunks(unusual, 200);
    expect(chunks[0].cueIds).toEqual(['earlier', 'later']);
    expect(chunks[0].startSeconds).toBe(5);
    expect(chunks[0].durationSeconds).toBe(120);
  });

  it('moves between chunks without escaping the session', () => {
    expect(getAdjacentChunkIndex(1, 3, -1)).toBe(0);
    expect(getAdjacentChunkIndex(1, 3, 1)).toBe(2);
    expect(getAdjacentChunkIndex(0, 3, -1)).toBe(0);
    expect(getAdjacentChunkIndex(2, 3, 1)).toBe(2);
    expect(getAdjacentChunkIndex(4, 0, 1)).toBe(0);
  });

  it('reports accessible one-based session progress', () => {
    expect(getShadowingProgress(0, 4)).toEqual({ current: 1, total: 4, percent: 25 });
    expect(getShadowingProgress(20, 4)).toEqual({ current: 4, total: 4, percent: 100 });
    expect(getShadowingProgress(-2, 0)).toEqual({ current: 0, total: 0, percent: 0 });
  });
});
