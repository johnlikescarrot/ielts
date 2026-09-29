import { ShadowState } from './shadowReducer';
import { TestAttempt } from '../types';

export interface ShadowingSessionReport {
  chunksCompleted: number;
  totalChunks: number;
  reps: number;
  coveragePercent: number;
}

export function summarizeSession(state: ShadowState): ShadowingSessionReport {
  const totalChunks = state.chunks.length;
  const coverage = totalChunks > 0 ? Math.round((state.completedChunks / totalChunks) * 100) : 0;
  return {
    chunksCompleted: state.completedChunks,
    totalChunks,
    reps: state.totalReps,
    coveragePercent: coverage,
  };
}

/**
 * Builds a practice attempt for the shared progress history. Shadowing is
 * deliberate practice rather than a scored test, so `estimatedBand` stays 0
 * (which the analytics views already exclude from band averages) and the raw
 * score records completed chunks.
 */
export function buildShadowingAttempt(
  state: ShadowState,
  secondsPracticed: number
): Omit<TestAttempt, 'id' | 'date'> {
  return {
    skill: 'shadowing',
    testId: 'shadowing-studio',
    testTitle: 'Shadowing Studio practice',
    rawScore: state.completedChunks,
    totalQuestions: state.chunks.length,
    estimatedBand: 0,
    timeSpentSeconds: Math.max(1, Math.round(secondsPracticed)),
  };
}
