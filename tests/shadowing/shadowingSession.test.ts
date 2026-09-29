import { describe, expect, it } from 'vitest';
import { TranscriptCue } from '../../src/video/videoLesson';
import {
  buildShadowChunks,
  chunkProgress,
  clampChunkSeconds,
  countWords,
  cycleSpeed,
  DEFAULT_CHUNK_SECONDS,
  MAX_CHUNK_SECONDS,
  MIN_CHUNK_SECONDS,
  ShadowChunk,
  summarizeChunks,
} from '../../src/shadowing/shadowingSession';

const cue = (id: string, startSeconds: number, text: string): TranscriptCue => ({
  id,
  startSeconds,
  text,
});

const makeChunk = (index: number, startSeconds: number, endSeconds: number): ShadowChunk => ({
  id: `chunk_${index + 1}`,
  index,
  startSeconds,
  endSeconds,
  text: 'model text',
  cueCount: 1,
  wordCount: 2,
});

describe('shadowingSession', () => {
  it('clamps chunk length into the supported range', () => {
    expect(MIN_CHUNK_SECONDS).toBe(3);
    expect(MAX_CHUNK_SECONDS).toBe(120);
    expect(DEFAULT_CHUNK_SECONDS).toBe(10);
    expect(clampChunkSeconds(Number.NaN)).toBe(10);
    expect(clampChunkSeconds(-5)).toBe(3);
    expect(clampChunkSeconds(1000)).toBe(120);
    expect(clampChunkSeconds(7.6)).toBe(8);
    expect(clampChunkSeconds(30)).toBe(30);
  });

  it('cycles through playback speeds and recovers from unknown values', () => {
    expect(cycleSpeed(1)).toBe(1.25);
    expect(cycleSpeed(1.25)).toBe(1.5);
    expect(cycleSpeed(2)).toBe(0.5);
    expect(cycleSpeed(1.4)).toBe(1);
  });

  it('counts words safely', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords(' one two   three ')).toBe(3);
  });

  it('groups consecutive cues into chunks of roughly the target length', () => {
    const cues = [
      cue('a', 0, 'Hello there'),
      cue('b', 8, 'second line'),
      cue('c', 16, 'third line'),
      cue('d', 24, 'fourth line'),
    ];
    const chunks = buildShadowChunks(cues, 10);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({
      id: 'chunk_1',
      index: 0,
      startSeconds: 0,
      endSeconds: 15.95,
      cueCount: 2,
      wordCount: 4,
    });
    expect(chunks[0].text).toBe('Hello there second line');
    expect(chunks[1]).toMatchObject({ index: 1, startSeconds: 16, endSeconds: 32, cueCount: 2 });
  });

  it('starts a new chunk when the gap to the first cue reaches the target', () => {
    const cues = [cue('a', 0, 'first'), cue('b', 20, 'second')];
    const chunks = buildShadowChunks(cues, 10);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].endSeconds).toBeCloseTo(19.95, 2);
  });

  it('sorts cues before grouping and keeps a single cue as one chunk', () => {
    const cues = [cue('b', 12, 'later cue'), cue('a', 4, 'earlier cue')];
    const chunks = buildShadowChunks(cues, 10);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].startSeconds).toBe(4);
    expect(chunks[0].cueCount).toBe(2);
    expect(chunks[0].endSeconds).toBe(20);

    const single = buildShadowChunks([cue('only', 30, 'one cue')], 10);
    expect(single).toHaveLength(1);
    expect(single[0]).toMatchObject({ startSeconds: 30, endSeconds: 38, cueCount: 1 });
  });

  it('clamps the requested chunk length', () => {
    const cues = [cue('a', 0, 'one'), cue('b', 4, 'two'), cue('c', 8, 'three'), cue('d', 12, 'four')];
    const clamped = buildShadowChunks(cues, 5000);
    expect(clamped).toHaveLength(1);
    expect(clamped[0].cueCount).toBe(4);
  });

  it('computes chunk progress between 0 and 1', () => {
    const chunk = makeChunk(0, 10, 20);
    expect(chunkProgress(chunk, 10)).toBe(0);
    expect(chunkProgress(chunk, 5)).toBe(0);
    expect(chunkProgress(chunk, 15)).toBe(0.5);
    expect(chunkProgress(chunk, 25)).toBe(1);
    expect(chunkProgress(makeChunk(1, 10, 10), 10)).toBe(1);
  });

  it('summarises a chunk list', () => {
    const summary = summarizeChunks([makeChunk(0, 0, 10), makeChunk(1, 10, 25)]);
    expect(summary).toEqual({ chunkCount: 2, totalSeconds: 25, wordCount: 4, cueCount: 2 });
  });
});
