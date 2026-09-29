import type { TranscriptCue } from './videoLesson';

export interface ShadowingChunk {
  id: string;
  cueIds: string[];
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  text: string;
}

export interface ShadowingProgress {
  current: number;
  total: number;
  percent: number;
}

const DEFAULT_CHUNK_SECONDS = 8;
const MIN_CHUNK_SECONDS = 3;
const MAX_CHUNK_SECONDS = 120;
const WORDS_PER_SECOND = 2.5;

export function clampChunkSeconds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CHUNK_SECONDS;
  return Math.max(MIN_CHUNK_SECONDS, Math.min(MAX_CHUNK_SECONDS, Math.floor(value)));
}

function estimatedEndSeconds(startSeconds: number, text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.ceil(wordCount / WORDS_PER_SECOND);
  return startSeconds + clampChunkSeconds(estimatedDuration);
}

export function createShadowingChunks(
  cues: TranscriptCue[],
  requestedChunkSeconds = DEFAULT_CHUNK_SECONDS,
): ShadowingChunk[] {
  if (cues.length === 0) return [];

  const targetSeconds = clampChunkSeconds(requestedChunkSeconds);
  const orderedCues = [...cues].sort((left, right) => left.startSeconds - right.startSeconds);
  const chunks: ShadowingChunk[] = [];
  let activeCues: TranscriptCue[] = [];
  let chunkStart = orderedCues[0].startSeconds;

  const finishChunk = (endSeconds?: number) => {
    const text = activeCues.map(cue => cue.text).join(' ');
    const naturalEnd = endSeconds ?? estimatedEndSeconds(chunkStart, text);
    const safeEnd = Math.max(
      chunkStart + MIN_CHUNK_SECONDS,
      Math.min(chunkStart + MAX_CHUNK_SECONDS, naturalEnd),
    );
    chunks.push({
      id: `shadow-${chunks.length + 1}`,
      cueIds: activeCues.map(cue => cue.id),
      startSeconds: chunkStart,
      endSeconds: safeEnd,
      durationSeconds: safeEnd - chunkStart,
      text,
    });
  };

  for (const cue of orderedCues) {
    if (activeCues.length > 0 && cue.startSeconds - chunkStart >= targetSeconds) {
      finishChunk(cue.startSeconds);
      activeCues = [];
      chunkStart = cue.startSeconds;
    }
    activeCues.push(cue);
  }

  finishChunk();
  return chunks;
}

export function getAdjacentChunkIndex(current: number, total: number, direction: -1 | 1): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, current + direction));
}

export function getShadowingProgress(index: number, total: number): ShadowingProgress {
  if (total <= 0) return { current: 0, total: 0, percent: 0 };
  const current = Math.max(1, Math.min(total, Math.floor(index) + 1));
  return { current, total, percent: Math.round((current / total) * 100) };
}
