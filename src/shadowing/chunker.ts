import { TranscriptCue } from '../video/videoLesson';

/**
 * Cue-aligned chunking engine for language shadowing.
 *
 * The chunk model follows the shadowing loop popularised by tools such as
 * Shadow Player: listen to a short chunk of natural speech, repeat it aloud,
 * replay and refine, then advance. Unlike a fixed time grid, chunk boundaries
 * snap to caption cue starts so a sentence is never split mid-speech.
 */

export const MIN_CHUNK_SECONDS = 3;
export const MAX_CHUNK_SECONDS = 120;
export const DEFAULT_CHUNK_SECONDS = 10;

/** Playback rates cycled with the `R` shortcut (mirrors Shadow Player). */
export const SPEED_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export interface ShadowChunk {
  index: number;
  /** Seconds into the source where the chunk begins (first cue start). */
  startSeconds: number;
  /** Seconds into the source where the chunk stops; the final chunk keeps a nominal window. */
  endSeconds: number;
  cueIds: string[];
  text: string;
  wordCount: number;
}

export function clampChunkSeconds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CHUNK_SECONDS;
  const rounded = Math.round(value);
  if (rounded < MIN_CHUNK_SECONDS) return MIN_CHUNK_SECONDS;
  if (rounded > MAX_CHUNK_SECONDS) return MAX_CHUNK_SECONDS;
  return rounded;
}

export function nextPlaybackRate(rate: number): number {
  const index = (SPEED_STEPS as readonly number[]).indexOf(rate);
  if (index === -1) return 1;
  return SPEED_STEPS[(index + 1) % SPEED_STEPS.length];
}

export function countWords(text: string): number {
  return (text.toLowerCase().match(/[a-z]+(?:['’-][a-z]+)*/g) ?? []).length;
}

/**
 * Groups caption cues into shadowing chunks whose span meets the requested
 * length, while never splitting a cue across two chunks. Each chunk stops
 * exactly where the next chunk's first cue begins, so replay boundaries land
 * on sentence starts instead of mid-word.
 */
export function buildShadowChunks(
  cues: TranscriptCue[],
  chunkSeconds: number = DEFAULT_CHUNK_SECONDS,
): ShadowChunk[] {
  if (cues.length === 0) return [];

  const size = clampChunkSeconds(chunkSeconds);
  const sorted = [...cues].sort((a, b) => a.startSeconds - b.startSeconds);

  const chunks: ShadowChunk[] = [];
  let group: TranscriptCue[] = [];
  let groupStart = sorted[0].startSeconds;

  const closeGroup = () => {
    const text = group.map(cue => cue.text).join(' ');
    chunks.push({
      index: chunks.length,
      startSeconds: groupStart,
      endSeconds: groupStart + size,
      cueIds: group.map(cue => cue.id),
      text,
      wordCount: countWords(text),
    });
    group = [];
  };

  for (const cue of sorted) {
    if (group.length > 0 && cue.startSeconds - groupStart >= size) {
      closeGroup();
      groupStart = cue.startSeconds;
    }
    if (group.length === 0) groupStart = cue.startSeconds;
    group.push(cue);
  }
  closeGroup();

  for (let i = 0; i < chunks.length - 1; i += 1) {
    chunks[i].endSeconds = chunks[i + 1].startSeconds;
  }
  return chunks;
}

/** Effective stop time, clamped to the real media duration when it is known. */
export function effectiveEndSeconds(chunk: ShadowChunk, mediaDurationSeconds: number | null): number {
  if (mediaDurationSeconds === null || !Number.isFinite(mediaDurationSeconds) || mediaDurationSeconds <= 0) {
    return chunk.endSeconds;
  }
  return Math.min(chunk.endSeconds, mediaDurationSeconds);
}
