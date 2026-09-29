import { TranscriptCue } from './videoLesson';

export const MAX_SUBTITLE_FILE_BYTES = 2 * 1024 * 1024;

const AUDIO_EXTENSIONS = new Set(['aac', 'flac', 'm4a', 'mp3', 'oga', 'ogg', 'opus', 'wav', 'webm']);
const VIDEO_EXTENSIONS = new Set(['m4v', 'mkv', 'mov', 'mp4', 'ogv', 'webm']);

export type LocalMediaKind = 'audio' | 'video';

export interface LocalMediaSource {
  kind: LocalMediaKind;
  name: string;
  url: string;
}

export interface CuePlaybackWindow {
  startSeconds: number;
  endSeconds: number;
}

/** Read a small text subtitle locally. No bytes leave the browser. */
export async function readLocalTranscript(file: Pick<File, 'size' | 'text'>): Promise<string> {
  if (file.size > MAX_SUBTITLE_FILE_BYTES) throw new Error('subtitle-too-large');
  const text = (await file.text()).replace(/^\uFEFF/, '').trim();
  if (!text) throw new Error('subtitle-empty');
  return text;
}

export function detectLocalMediaKind(file: Pick<File, 'name' | 'type'>): LocalMediaKind | null {
  const mimeType = file.type.toLowerCase();
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';

  const extension = file.name.toLowerCase().replace(/^.*\./, '');
  if (AUDIO_EXTENSIONS.has(extension)) return 'audio';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  return null;
}

export function createLocalMediaSource(
  file: File,
  createObjectURL: (value: Blob | MediaSource) => string = URL.createObjectURL,
): LocalMediaSource {
  const kind = detectLocalMediaKind(file);
  if (!kind) throw new Error('unsupported-media');
  return { kind, name: file.name, url: createObjectURL(file) };
}

export function releaseLocalMediaSource(
  source: LocalMediaSource,
  revokeObjectURL: (url: string) => void = URL.revokeObjectURL,
): void {
  revokeObjectURL(source.url);
}

/** Prefer caption boundaries, then the known media duration, then an eight-second practice window. */
export function getCuePlaybackWindow(
  cues: TranscriptCue[],
  cueId: string,
  durationSeconds: number,
): CuePlaybackWindow | null {
  const index = cues.findIndex(cue => cue.id === cueId);
  const cue = cues[index];
  if (!cue || !Number.isFinite(cue.startSeconds)) return null;

  const startSeconds = Math.max(0, cue.startSeconds);
  const nextStart = cues[index + 1]?.startSeconds;
  const endSeconds = Number.isFinite(nextStart) && nextStart > startSeconds
    ? nextStart
    : Number.isFinite(durationSeconds) && durationSeconds > startSeconds
      ? durationSeconds
      : startSeconds + 8;
  return { startSeconds, endSeconds };
}

/** A learner gesture normally permits play; a false result lets UI retain native controls when a browser blocks it. */
export async function playLocalMediaCue(
  media: HTMLMediaElement,
  window: CuePlaybackWindow,
  playbackRate: number,
): Promise<boolean> {
  media.pause();
  media.currentTime = window.startSeconds;
  media.playbackRate = Math.max(0.5, Math.min(2, playbackRate));
  try {
    await media.play();
    return true;
  } catch {
    return false;
  }
}

export function stopAtCueBoundary(media: HTMLMediaElement, endSeconds: number | null): boolean {
  if (endSeconds === null || media.currentTime < endSeconds) return false;
  media.pause();
  return true;
}
