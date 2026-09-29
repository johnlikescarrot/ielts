import { TranscriptCue } from './videoLesson';

export const DEFAULT_CHUNK_SECONDS = 8;
export const MIN_CHUNK_SECONDS = 3;
export const MAX_CHUNK_SECONDS = 120;

export const SHADOWING_RATES = [0.7, 0.85, 1, 1.15] as const;

export interface ShadowingChunk {
  id: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  cueIds: string[];
}

export function clampChunkSeconds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CHUNK_SECONDS;
  return Math.min(MAX_CHUNK_SECONDS, Math.max(MIN_CHUNK_SECONDS, Math.floor(value)));
}

/**
 * Groups neighbouring caption cues into short, repeatable speaking turns.
 * A turn begins at the first cue and grows until the next cue would fall
 * outside the selected time window. The final turn receives a minimum end
 * boundary so it still communicates an intelligible practice window.
 */
export function createShadowingChunks(
  cues: TranscriptCue[],
  requestedChunkSeconds = DEFAULT_CHUNK_SECONDS,
): ShadowingChunk[] {
  if (cues.length === 0) return [];

  const chunkSeconds = clampChunkSeconds(requestedChunkSeconds);
  const chunks: ShadowingChunk[] = [];
  let currentCues: TranscriptCue[] = [];

  const pushCurrent = () => {
    const firstCue = currentCues[0];
    const lastCue = currentCues[currentCues.length - 1];
    chunks.push({
      id: `shadow-${chunks.length + 1}`,
      startSeconds: firstCue.startSeconds,
      endSeconds: Math.max(firstCue.startSeconds + chunkSeconds, lastCue.startSeconds + 2),
      text: currentCues.map(cue => cue.text).join(' '),
      cueIds: currentCues.map(cue => cue.id),
    });
    currentCues = [];
  };

  for (const cue of cues) {
    const firstCue = currentCues[0];
    if (firstCue && cue.startSeconds - firstCue.startSeconds >= chunkSeconds) {
      pushCurrent();
    }
    currentCues.push(cue);
  }
  pushCurrent();

  return chunks.map((chunk, index) => ({
    ...chunk,
    endSeconds: index < chunks.length - 1
      ? Math.max(chunk.endSeconds, chunks[index + 1].startSeconds)
      : chunk.endSeconds,
  }));
}

export function nextShadowingRate(rate: number): number {
  const currentIndex = SHADOWING_RATES.indexOf(rate as typeof SHADOWING_RATES[number]);
  return SHADOWING_RATES[(currentIndex + 1 + SHADOWING_RATES.length) % SHADOWING_RATES.length];
}

export function clampChunkIndex(index: number, chunkCount: number): number {
  if (chunkCount <= 0) return 0;
  return Math.min(chunkCount - 1, Math.max(0, Math.floor(index)));
}
