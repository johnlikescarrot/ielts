import { describe, expect, it } from 'vitest';
import {
  buildShadowChunks,
  clampChunkSeconds,
  countWords,
  DEFAULT_CHUNK_SECONDS,
  effectiveEndSeconds,
  MAX_CHUNK_SECONDS,
  MIN_CHUNK_SECONDS,
  nextPlaybackRate,
  SPEED_STEPS,
} from '../../src/shadowing/chunker';
import { TranscriptCue } from '../../src/video/videoLesson';

const cue = (id: string, startSeconds: number, text: string): TranscriptCue => ({
  id,
  startSeconds,
  text,
});

describe('clampChunkSeconds', () => {
  it('clamps into the supported shadowing range', () => {
    expect(clampChunkSeconds(1)).toBe(MIN_CHUNK_SECONDS);
    expect(clampChunkSeconds(2.6)).toBe(MIN_CHUNK_SECONDS);
    expect(clampChunkSeconds(10)).toBe(10);
    expect(clampChunkSeconds(121)).toBe(MAX_CHUNK_SECONDS);
    expect(clampChunkSeconds(500)).toBe(MAX_CHUNK_SECONDS);
  });

  it('falls back to the default for unusable values', () => {
    expect(clampChunkSeconds(Number.NaN)).toBe(DEFAULT_CHUNK_SECONDS);
    expect(clampChunkSeconds(Number.POSITIVE_INFINITY)).toBe(DEFAULT_CHUNK_SECONDS);
  });
});

describe('nextPlaybackRate', () => {
  it('cycles through the Shadow Player speed ladder', () => {
    expect(SPEED_STEPS).toEqual([0.5, 0.75, 1, 1.25, 1.5, 2]);
    expect(nextPlaybackRate(0.5)).toBe(0.75);
    expect(nextPlaybackRate(0.75)).toBe(1);
    expect(nextPlaybackRate(1)).toBe(1.25);
    expect(nextPlaybackRate(1.25)).toBe(1.5);
    expect(nextPlaybackRate(1.5)).toBe(2);
    expect(nextPlaybackRate(2)).toBe(0.5);
  });

  it('resets unknown rates to normal speed', () => {
    expect(nextPlaybackRate(3)).toBe(1);
    expect(nextPlaybackRate(0)).toBe(1);
  });
});

describe('countWords', () => {
  it('counts English words including contractions and hyphenations', () => {
    expect(countWords("It's a well-known co-operative approach")).toBe(5);
    expect(countWords('')).toBe(0);
    expect(countWords('123 !? —')).toBe(0);
  });
});

describe('buildShadowChunks', () => {
  it('returns an empty list for empty captions', () => {
    expect(buildShadowChunks([], DEFAULT_CHUNK_SECONDS)).toEqual([]);
  });

  it('groups cues into chunks that never split a cue', () => {
    const cues = [
      cue('a', 0, 'First sentence here.'),
      cue('b', 6, 'Second sentence follows.'),
      cue('c', 12, 'Third sentence arrives.'),
      cue('d', 18, 'Fourth sentence lands.'),
    ];
    const chunks = buildShadowChunks(cues, 10);
    expect(chunks.map(chunk => chunk.cueIds)).toEqual([['a', 'b'], ['c', 'd']]);
    expect(chunks[0]).toMatchObject({ index: 0, startSeconds: 0, endSeconds: 12 });
    expect(chunks[1]).toMatchObject({ index: 1, startSeconds: 12, endSeconds: 22 });
    expect(chunks[0].text).toBe('First sentence here. Second sentence follows.');
    expect(chunks[0].wordCount).toBe(6);
  });

  it('keeps every cue in a single chunk when gaps stay under the target', () => {
    const cues = [cue('a', 0, 'One.'), cue('b', 4, 'Two.'), cue('c', 7, 'Three.')];
    const chunks = buildShadowChunks(cues, 10);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].cueIds).toEqual(['a', 'b', 'c']);
    expect(chunks[0].endSeconds).toBe(10);
  });

  it('sorts unsorted cues before grouping', () => {
    const cues = [cue('c', 40, 'Last cue.'), cue('b', 20, 'Later cue.'), cue('a', 0, 'Early cue.')];
    const chunks = buildShadowChunks(cues, 10);
    expect(chunks.map(chunk => chunk.cueIds)).toEqual([['a'], ['b'], ['c']]);
    expect(chunks[0]).toMatchObject({ startSeconds: 0, endSeconds: 20 });
    expect(chunks[1]).toMatchObject({ startSeconds: 20, endSeconds: 40 });
    expect(chunks[2]).toMatchObject({ startSeconds: 40, endSeconds: 50 });
  });

  it('produces one open-window chunk for a single cue', () => {
    const chunks = buildShadowChunks([cue('only', 5, 'Just one cue.')], 8);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ startSeconds: 5, endSeconds: 13, wordCount: 3 });
  });

  it('clamps an out-of-range chunk length request', () => {
    const cues = [cue('a', 0, 'One.'), cue('b', 400, 'Two.')];
    const chunks = buildShadowChunks(cues, 999);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].endSeconds).toBe(400);
  });
});

describe('effectiveEndSeconds', () => {
  const chunk = { index: 0, startSeconds: 36, endSeconds: 48, cueIds: [], text: 'x', wordCount: 1 };

  it('returns the chunk end when no reliable duration is known', () => {
    expect(effectiveEndSeconds(chunk, null)).toBe(48);
    expect(effectiveEndSeconds(chunk, Number.NaN)).toBe(48);
    expect(effectiveEndSeconds(chunk, 0)).toBe(48);
  });

  it('clamps the stop time to the real media duration', () => {
    expect(effectiveEndSeconds(chunk, 40)).toBe(40);
    expect(effectiveEndSeconds(chunk, 90)).toBe(48);
  });
});
