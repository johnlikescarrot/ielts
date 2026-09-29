import { TranscriptCue } from '../video/videoLesson';

/**
 * Shadowing converts a transcript into short, repeatable "chunks" that a
 * learner listens to and speaks along with, one at a time. The technique and
 * its default sizes follow the shadowing literature (Hamada, 2016) and the
 * interaction popularised by open-source shadowing players.
 */
export const MIN_CHUNK_SECONDS = 3;
export const MAX_CHUNK_SECONDS = 120;
export const DEFAULT_CHUNK_SECONDS = 10;

/**
 * Estimated length used for the final cue when the transcript carries no
 * explicit timing after it. Matches the per-line estimate used by the parser.
 */
export const UNTIMED_CUE_SECONDS = 8;

/** Playback rates offered while shadowing, mirroring common video players. */
export const SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Small tolerance so a chunk ends just before the next cue starts. */
export const CHUNK_BOUNDARY_EPSILON = 0.05;

export interface ShadowChunk {
  id: string;
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  cueCount: number;
  wordCount: number;
}

export interface ShadowSummary {
  chunkCount: number;
  totalSeconds: number;
  wordCount: number;
  cueCount: number;
}

export function clampChunkSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CHUNK_SECONDS;
  }
  return Math.min(MAX_CHUNK_SECONDS, Math.max(MIN_CHUNK_SECONDS, Math.round(value)));
}

export function cycleSpeed(current: number): number {
  const index = SPEED_STEPS.indexOf(current as (typeof SPEED_STEPS)[number]);
  if (index === -1) {
    return 1;
  }
  return SPEED_STEPS[(index + 1) % SPEED_STEPS.length];
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

/**
 * Groups consecutive cues into chunks of roughly `targetSeconds`.
 *
 * - Cues are grouped while the span from the first cue stays below the target,
 *   so every chunk always contains at least one full cue.
 * - A chunk ends just before the first cue of the following chunk; the final
 *   chunk gets the standard untimed estimate after its last cue.
 * - `cues` must contain at least one cue (validated by the caller).
 */
export function buildShadowChunks(cues: TranscriptCue[], targetSeconds = DEFAULT_CHUNK_SECONDS): ShadowChunk[] {
  const target = clampChunkSeconds(targetSeconds);
  const sorted = [...cues].sort((a, b) => a.startSeconds - b.startSeconds);

  const groups: TranscriptCue[][] = [];
  for (const cue of sorted) {
    const current = groups[groups.length - 1];
    if (!current || cue.startSeconds - current[0].startSeconds >= target) {
      groups.push([cue]);
    } else {
      current.push(cue);
    }
  }

  return groups.map((group, index) => {
    const startSeconds = group[0].startSeconds;
    const endSeconds =
      index + 1 < groups.length
        ? groups[index + 1][0].startSeconds - CHUNK_BOUNDARY_EPSILON
        : group[group.length - 1].startSeconds + UNTIMED_CUE_SECONDS;
    const text = group.map(cue => cue.text).join(' ');
    return {
      id: `chunk_${index + 1}`,
      index,
      startSeconds,
      endSeconds,
      text,
      cueCount: group.length,
      wordCount: countWords(text),
    };
  });
}

/** Progress inside a single chunk, from 0 to 1 (clamped). */
export function chunkProgress(chunk: ShadowChunk, positionSeconds: number): number {
  const span = chunk.endSeconds - chunk.startSeconds;
  if (span <= 0) {
    return 1;
  }
  const ratio = (positionSeconds - chunk.startSeconds) / span;
  return Math.min(1, Math.max(0, ratio));
}

export function summarizeChunks(chunks: ShadowChunk[]): ShadowSummary {
  return {
    chunkCount: chunks.length,
    totalSeconds: chunks.reduce((sum, chunk) => sum + (chunk.endSeconds - chunk.startSeconds), 0),
    wordCount: chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0),
    cueCount: chunks.reduce((sum, chunk) => sum + chunk.cueCount, 0),
  };
}
