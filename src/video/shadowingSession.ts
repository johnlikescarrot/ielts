import { TranscriptCue } from './videoLesson';

export const SHADOWING_CHUNK_OPTIONS = [5, 10, 15] as const;
export const SHADOWING_SPEED_OPTIONS = [0.5, 0.75, 1, 1.25] as const;

export type ShadowingChunkDuration = typeof SHADOWING_CHUNK_OPTIONS[number];
export type ShadowingSpeed = typeof SHADOWING_SPEED_OPTIONS[number];
export type ShadowingDirection = 'next' | 'previous';

export interface ShadowingChunk {
  id: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  cueCount: number;
}

const MINIMUM_CHUNK_SECONDS = 3;
const MAXIMUM_CHUNK_SECONDS = 120;
const DEFAULT_CHUNK_SECONDS = 10;

export function normalizeChunkDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_CHUNK_SECONDS;
  return Math.min(MAXIMUM_CHUNK_SECONDS, Math.max(MINIMUM_CHUNK_SECONDS, Math.floor(seconds)));
}

export function createShadowingChunks(
  cues: TranscriptCue[],
  requestedDuration = DEFAULT_CHUNK_SECONDS,
): ShadowingChunk[] {
  const duration = normalizeChunkDuration(requestedDuration);
  const buckets = new Map<number, TranscriptCue[]>();
  const validCues = cues
    .filter(cue => Number.isFinite(cue.startSeconds) && cue.text.trim().length > 0)
    .sort((first, second) => first.startSeconds - second.startSeconds);

  for (const cue of validCues) {
    const startSeconds = Math.max(0, Math.floor(cue.startSeconds));
    const bucketStart = Math.floor(startSeconds / duration) * duration;
    const existing = buckets.get(bucketStart) ?? [];
    buckets.set(bucketStart, [...existing, { ...cue, startSeconds }]);
  }

  const starts = [...buckets.keys()].sort((first, second) => first - second);
  return starts.map((startSeconds, index) => {
    const chunkCues = buckets.get(startSeconds)!;
    const nextStart = starts[index + 1];
    return {
      id: `chunk-${index + 1}`,
      startSeconds,
      endSeconds: nextStart ?? startSeconds + duration,
      text: chunkCues.map(cue => cue.text.trim()).join(' '),
      cueCount: chunkCues.length,
    };
  });
}

export function getAdjacentChunkIndex(
  currentIndex: number,
  direction: ShadowingDirection,
  totalChunks: number,
): number {
  if (totalChunks <= 0) return 0;
  const normalizedIndex = Number.isFinite(currentIndex) ? Math.floor(currentIndex) : 0;
  const safeCurrentIndex = Math.min(totalChunks - 1, Math.max(0, normalizedIndex));
  const offset = direction === 'next' ? 1 : -1;
  return Math.min(totalChunks - 1, Math.max(0, safeCurrentIndex + offset));
}

export function calculateShadowingProgress(currentIndex: number, totalChunks: number): number {
  if (totalChunks <= 0) return 0;
  const normalizedIndex = Number.isFinite(currentIndex) ? Math.floor(currentIndex) : 0;
  const safeCurrentIndex = Math.min(totalChunks - 1, Math.max(0, normalizedIndex));
  return Math.round(((safeCurrentIndex + 1) / totalChunks) * 100);
}

export function cycleShadowingSpeed(currentSpeed: number): ShadowingSpeed {
  const currentIndex = SHADOWING_SPEED_OPTIONS.indexOf(currentSpeed as ShadowingSpeed);
  const nextIndex = (currentIndex + 1) % SHADOWING_SPEED_OPTIONS.length;
  return SHADOWING_SPEED_OPTIONS[nextIndex];
}
