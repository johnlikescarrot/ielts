import { describe, expect, it } from 'vitest';
import { ShadowChunk } from '../../src/shadowing/shadowingSession';
import { createShadowState } from '../../src/shadowing/shadowReducer';
import { buildShadowingAttempt, summarizeSession } from '../../src/shadowing/shadowingStats';

const chunk = (index: number): ShadowChunk => ({
  id: `chunk_${index + 1}`,
  index,
  startSeconds: index * 10,
  endSeconds: index * 10 + 10,
  text: 'text',
  cueCount: 1,
  wordCount: 1,
});

describe('shadowingStats', () => {
  it('summarises session coverage and reps', () => {
    const state = {
      ...createShadowState([chunk(0), chunk(1), chunk(2), chunk(3)]),
      completedChunks: 3,
      totalReps: 7,
    };
    expect(summarizeSession(state)).toEqual({
      chunksCompleted: 3,
      totalChunks: 4,
      reps: 7,
      coveragePercent: 75,
    });
  });

  it('handles an empty chunk list without dividing by zero', () => {
    const empty = createShadowState([]);
    expect(summarizeSession(empty)).toEqual({
      chunksCompleted: 0,
      totalChunks: 0,
      reps: 0,
      coveragePercent: 0,
    });
    expect(buildShadowingAttempt(empty, 0).timeSpentSeconds).toBe(1);
  });

  it('builds an unscored practice attempt for the progress history', () => {
    const state = {
      ...createShadowState([chunk(0), chunk(1), chunk(2), chunk(3)]),
      completedChunks: 2,
      totalReps: 5,
    };
    expect(buildShadowingAttempt(state, 125.6)).toEqual({
      skill: 'shadowing',
      testId: 'shadowing-studio',
      testTitle: 'Shadowing Studio practice',
      rawScore: 2,
      totalQuestions: 4,
      estimatedBand: 0,
      timeSpentSeconds: 126,
    });
  });
});
