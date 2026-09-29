import { describe, expect, it } from 'vitest';
import {
  createShadowingPlan,
  createYouTubeTimestampUrl,
  getShadowingProgress,
  MAX_SHADOWING_CHUNK_SECONDS,
  MIN_SHADOWING_CHUNK_SECONDS,
  moveShadowingIndex,
  normalizeChunkSeconds,
  normalizeReplayCount,
  selectFocusWords,
} from '../../src/video/shadowingCoach';
import { TranscriptCue } from '../../src/video/videoLesson';

const CUES: TranscriptCue[] = [
  { id: 'cue-1', startSeconds: 16, text: 'Innovative commuters integrate cycling with railway stations.' },
  { id: 'cue-0', startSeconds: 0, text: 'Researchers analyze sustainable transport systems.' },
  { id: 'cue-2', startSeconds: 8, text: 'Accessible public transit benefits communities.' },
  { id: 'cue-3', startSeconds: 31, text: 'Careful assessment encourages healthier routines.' },
];

describe('shadowing coach engine', () => {
  it('normalizes chunk and replay settings into safe Firefox-extension limits', () => {
    expect(normalizeChunkSeconds(undefined)).toBe(12);
    expect(normalizeChunkSeconds(Number.NaN)).toBe(12);
    expect(normalizeChunkSeconds(2.8)).toBe(MIN_SHADOWING_CHUNK_SECONDS);
    expect(normalizeChunkSeconds(999)).toBe(MAX_SHADOWING_CHUNK_SECONDS);
    expect(normalizeChunkSeconds(20.9)).toBe(20);

    expect(normalizeReplayCount(undefined)).toBe(2);
    expect(normalizeReplayCount(Number.NaN)).toBe(2);
    expect(normalizeReplayCount(0)).toBe(1);
    expect(normalizeReplayCount(8)).toBe(5);
    expect(normalizeReplayCount(3.7)).toBe(3);
  });

  it('builds deterministic timestamped chunks from unsorted captions', () => {
    const plan = createShadowingPlan(CUES, { chunkSeconds: 12, replayCount: 3 });

    expect(plan.chunkSeconds).toBe(12);
    expect(plan.replayCount).toBe(3);
    expect(plan.segments).toEqual([
      {
        id: 'shadow-1',
        index: 0,
        startSeconds: 0,
        endSeconds: 12,
        durationSeconds: 12,
        cueIds: ['cue-0', 'cue-2'],
        text: 'Researchers analyze sustainable transport systems. Accessible public transit benefits communities.',
        wordCount: 10,
        focusWords: ['researchers', 'analyze', 'sustainable'],
      },
      {
        id: 'shadow-2',
        index: 1,
        startSeconds: 16,
        endSeconds: 28,
        durationSeconds: 12,
        cueIds: ['cue-1'],
        text: 'Innovative commuters integrate cycling with railway stations.',
        wordCount: 7,
        focusWords: ['innovative', 'commuters', 'integrate'],
      },
      {
        id: 'shadow-3',
        index: 2,
        startSeconds: 31,
        endSeconds: 34,
        durationSeconds: 3,
        cueIds: ['cue-3'],
        text: 'Careful assessment encourages healthier routines.',
        wordCount: 5,
        focusWords: ['careful', 'assessment', 'encourages'],
      },
    ]);
    expect(plan.totalWords).toBe(22);
    expect(plan.averageWordsPerSegment).toBe(7.3);
    expect(plan.recommendedPauseSeconds).toBe(4);
    expect(plan.totalDurationSeconds).toBe(34);
  });

  it('handles empty captions, blank cue text, duplicate timestamps, and long final cues', () => {
    const empty = createShadowingPlan([{ id: 'blank', startSeconds: 0, text: '   ' }], { chunkSeconds: 1, replayCount: 0 });
    expect(empty).toMatchObject({
      segments: [],
      chunkSeconds: 3,
      replayCount: 1,
      totalWords: 0,
      totalDurationSeconds: 0,
      averageWordsPerSegment: 0,
      recommendedPauseSeconds: 3,
    });

    const dense = createShadowingPlan([
      { id: 'b', startSeconds: 0, text: 'Infrastructure changes require patient public support.' },
      { id: 'a', startSeconds: 0, text: ' repeated   spacing ' },
      { id: 'c', startSeconds: 4, text: 'International collaboration substantially accelerates implementation across communities worldwide.' },
    ], { chunkSeconds: 120 });

    expect(dense.segments).toHaveLength(1);
    expect(dense.segments[0].cueIds).toEqual(['a', 'b', 'c']);
    expect(dense.segments[0].durationSeconds).toBe(8);
    expect(dense.segments[0].text).toBe('repeated spacing Infrastructure changes require patient public support. International collaboration substantially accelerates implementation across communities worldwide.');
    expect(dense.recommendedPauseSeconds).toBeGreaterThan(3);
  });

  it('selects focus words without stop words or duplicates', () => {
    expect(selectFocusWords('The policy policy should improve accessible transport outcomes everywhere.', 4)).toEqual([
      'policy', 'improve', 'accessible', 'transport',
    ]);
    expect(selectFocusWords('a b c', 2)).toEqual([]);
    expect(selectFocusWords('!!!', 2)).toEqual([]);
    expect(selectFocusWords('analysis benefit concept', 0)).toEqual([]);
  });

  it('reports progress and clamps keyboard-style navigation', () => {
    const plan = createShadowingPlan(CUES, { chunkSeconds: 12 });

    expect(getShadowingProgress(createShadowingPlan([]), [])).toEqual({
      completedCount: 0,
      totalCount: 0,
      percent: 0,
      nextSegmentId: null,
      isFinished: false,
    });
    expect(getShadowingProgress(plan, [])).toEqual({
      completedCount: 0,
      totalCount: 3,
      percent: 0,
      nextSegmentId: 'shadow-1',
      isFinished: false,
    });
    expect(getShadowingProgress(plan, ['shadow-1', 'missing'])).toMatchObject({
      completedCount: 1,
      percent: 33,
      nextSegmentId: 'shadow-2',
      isFinished: false,
    });
    expect(getShadowingProgress(plan, ['shadow-1', 'shadow-2', 'shadow-3'])).toMatchObject({
      completedCount: 3,
      percent: 100,
      nextSegmentId: null,
      isFinished: true,
    });

    expect(moveShadowingIndex(plan, 1, 1)).toBe(2);
    expect(moveShadowingIndex(plan, 99, 1)).toBe(2);
    expect(moveShadowingIndex(plan, -5, -1)).toBe(0);
    expect(moveShadowingIndex(plan, Number.NaN, Number.NaN)).toBe(0);
    expect(moveShadowingIndex(createShadowingPlan([]), 2, 1)).toBe(0);
  });

  it('creates safe YouTube timestamp links only for validated video IDs', () => {
    expect(createYouTubeTimestampUrl('dQw4w9WgXcQ', 12.9)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12s');
    expect(createYouTubeTimestampUrl('dQw4w9WgXcQ', -4)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=0s');
    expect(createYouTubeTimestampUrl('dQw4w9WgXcQ', Number.NaN)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=0s');
    expect(createYouTubeTimestampUrl(null, 3)).toBeNull();
    expect(createYouTubeTimestampUrl('not-valid', 3)).toBeNull();
  });
});
