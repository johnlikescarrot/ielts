import type { TranscriptCue } from './videoLesson';

export interface ShadowingChunk extends TranscriptCue {
  endSeconds: number;
  repetitions: number;
}

export interface ShadowingSession {
  chunks: ShadowingChunk[];
  activeIndex: number;
  isPlaying: boolean;
  repeatTarget: number;
  completed: Set<string>;
}

/** Build a deterministic practice track from caption cues. The final cue gets a
 * small tail so it remains replayable when a source has no explicit duration. */
export function createShadowingChunks(cues: TranscriptCue[], durationSeconds?: number): ShadowingChunk[] {
  return cues
    .filter(cue => Number.isFinite(cue.startSeconds) && cue.text.trim().length > 0)
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .map((cue, index, sorted) => {
      const nextStart = sorted[index + 1]?.startSeconds;
      const endSeconds = Math.max(cue.startSeconds + 1, nextStart ?? durationSeconds ?? cue.startSeconds + 8);
      return { ...cue, endSeconds, repetitions: 0 };
    });
}

export function createShadowingSession(chunks: ShadowingChunk[], repeatTarget = 2): ShadowingSession {
  return { chunks, activeIndex: 0, isPlaying: false, repeatTarget: Math.max(1, Math.floor(repeatTarget)), completed: new Set() };
}

export function currentChunk(session: ShadowingSession): ShadowingChunk | null {
  return session.chunks[session.activeIndex] ?? null;
}

export function markChunkFinished(session: ShadowingSession): ShadowingSession {
  const chunk = currentChunk(session);
  if (!chunk) return session;
  const repetitions = chunk.repetitions + 1;
  const chunks = session.chunks.map(item => item.id === chunk.id ? { ...item, repetitions } : item);
  const completed = new Set(session.completed);
  if (repetitions >= session.repeatTarget) completed.add(chunk.id);
  const shouldAdvance = repetitions >= session.repeatTarget && session.activeIndex < chunks.length - 1;
  return { ...session, chunks, completed, activeIndex: shouldAdvance ? session.activeIndex + 1 : session.activeIndex, isPlaying: false };
}

export function moveChunk(session: ShadowingSession, direction: -1 | 1): ShadowingSession {
  const activeIndex = Math.min(Math.max(session.activeIndex + direction, 0), Math.max(session.chunks.length - 1, 0));
  return { ...session, activeIndex, isPlaying: false };
}

export function sessionProgress(session: ShadowingSession): number {
  return session.chunks.length === 0 ? 0 : Math.round((session.completed.size / session.chunks.length) * 100);
}
