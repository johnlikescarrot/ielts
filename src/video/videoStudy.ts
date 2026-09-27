export type VideoProvider = 'youtube' | 'bilibili';

export interface VideoPage {
  provider: VideoProvider;
  url: string;
}

export interface VideoLoop {
  startSeconds: number;
  endSeconds: number;
}

export const LOOP_DURATIONS = [5, 10, 20, 30] as const;

const VIDEO_HOSTS: Record<VideoProvider, string[]> = {
  youtube: ['youtube.com', 'youtu.be'],
  bilibili: ['bilibili.com'],
};

function isHostOrSubdomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

/** Identifies the video services that the on-page study panel can control. */
export function getVideoPage(url: string): VideoPage | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    for (const [provider, domains] of Object.entries(VIDEO_HOSTS) as [VideoProvider, string[]][]) {
      if (domains.some(domain => isHostOrSubdomain(hostname, domain))) {
        return { provider, url: parsed.href };
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** Keeps loop lengths predictable for the listening-repeat controls. */
export function normalizeLoopDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return LOOP_DURATIONS[1];

  const rounded = Math.round(seconds);
  return LOOP_DURATIONS.includes(rounded as typeof LOOP_DURATIONS[number])
    ? rounded
    : LOOP_DURATIONS[1];
}

/** Produces a valid finite loop around the current playback position. */
export function createVideoLoop(
  currentSeconds: number,
  requestedDuration: number,
  mediaDuration?: number,
): VideoLoop | null {
  const startSeconds = Math.max(0, Number.isFinite(currentSeconds) ? currentSeconds : 0);
  const loopDuration = normalizeLoopDuration(requestedDuration);
  const hasFiniteDuration = Number.isFinite(mediaDuration) && (mediaDuration ?? 0) > 0;
  const endSeconds = hasFiniteDuration
    ? Math.min(startSeconds + loopDuration, mediaDuration as number)
    : startSeconds + loopDuration;

  if (endSeconds <= startSeconds) return null;

  return { startSeconds, endSeconds };
}

/** Formats playback positions in the familiar media-player notation. */
export function formatVideoTimestamp(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(remainingSeconds).padStart(2, '0');

  return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${minutes}:${paddedSeconds}`;
}

/** Adds a seek timestamp so a saved clip reopens at its practice start point. */
export function createTimestampedVideoUrl(sourceUrl: string, startSeconds: number): string {
  try {
    const parsed = new URL(sourceUrl);
    parsed.searchParams.set('t', String(Math.max(0, Math.floor(startSeconds))));
    return parsed.href;
  } catch {
    return sourceUrl;
  }
}
