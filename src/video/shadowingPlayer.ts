import { TranscriptCue } from './videoLesson';

export interface ShadowingChunk extends TranscriptCue {
  endSeconds: number;
}

export const SHADOWING_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export function createShadowingChunks(cues: TranscriptCue[], mediaDuration = 0): ShadowingChunk[] {
  return cues.map((cue, index) => ({
    ...cue,
    endSeconds: Math.max(
      cue.startSeconds,
      cues[index + 1]?.startSeconds ?? mediaDuration,
      cue.startSeconds + 3,
    ),
  }));
}

export function findShadowingChunk(chunks: ShadowingChunk[], seconds: number): number {
  if (chunks.length === 0) return -1;
  const active = chunks.findIndex(chunk => seconds >= chunk.startSeconds && seconds < chunk.endSeconds);
  if (active >= 0) return active;
  return seconds < chunks[0].startSeconds ? 0 : chunks.length - 1;
}

export function nextShadowingSpeed(speed: number): number {
  const index = SHADOWING_SPEEDS.indexOf(speed as typeof SHADOWING_SPEEDS[number]);
  return SHADOWING_SPEEDS[(index + 1) % SHADOWING_SPEEDS.length];
}
