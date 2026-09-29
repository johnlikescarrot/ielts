import { TranscriptCue } from '../video/videoLesson';
import { calculateSM2 } from '../srs/sm2';

/**
 * Shadowing Studio engine.
 *
 * Deterministic, on-device chunking of a parsed transcript plus an SM-2 backed
 * self-assessment loop, inspired by the workflow of the open-source
 * `Hossein-Mosaffa/shadowing-player` practice player. Everything here is pure:
 * no DOM, no storage, no randomness.
 */

/** Self-assessment rating for one shadowing attempt (0 = again … 3 = easy). */
export type ShadowingRating = 0 | 1 | 2 | 3;

/** Playback speeds, mirroring the 0.5×–2× range of the reference player. */
export const SHADOWING_SPEEDS: readonly number[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

/** Chunk length bounds, mirroring the reference player's 3–120 s segments. */
export const MIN_CHUNK_SECONDS = 3;
export const MAX_CHUNK_SECONDS = 120;
export const DEFAULT_CHUNK_SECONDS = 8;

/** Assumed speaking time for the final cue when no following chunk exists. */
export const LAST_CHUNK_TAIL_SECONDS = 4;

/** How many shadowing sessions are kept in local storage. */
export const MAX_STORED_SESSIONS = 10;

/** SM-2 grade mapping: again fails the card; hard/good/easy pass it. */
const RATING_TO_SM2_GRADE: readonly number[] = [1, 3, 4, 5];

/** Minimum self-rating that counts a chunk as mastered (good or easy). */
const MASTERED_RATING: ShadowingRating = 2;

const VALID_RATINGS: readonly ShadowingRating[] = [0, 1, 2, 3];

export type ShadowingShortcut = 'replay' | 'previous' | 'next' | 'cycleSpeed';

export interface ShadowingChunk {
  id: string;
  index: number;
  startSeconds: number;
  endSeconds: number;
  cueIds: string[];
  text: string;
  wordCount: number;
}

export interface ShadowingReviewEvent {
  date: string;
  rating: ShadowingRating;
}

export interface ShadowingChunkProgress {
  chunkId: string;
  attempts: number;
  lastRating: ShadowingRating | null;
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReviewDate: string | null;
  history: ShadowingReviewEvent[];
}

export interface ShadowingSession {
  chunks: ShadowingChunk[];
  progress: Record<string, ShadowingChunkProgress>;
  activeChunkId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShadowingSessionStats {
  totalChunks: number;
  attemptedChunks: number;
  masteredChunks: number;
  dueChunks: number;
  masteryPercent: number;
}

export interface ShadowingSessionSummary extends ShadowingSessionStats {
  averageRating: number;
  elapsedSeconds: number;
}

/** A shadowing session persisted in local storage so it can be resumed. */
export interface ShadowingSessionRecord {
  id: string;
  session: ShadowingSession;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

const toISODate = (date: Date): string => date.toISOString().split('T')[0];

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

export function clampChunkSeconds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CHUNK_SECONDS;
  return Math.min(MAX_CHUNK_SECONDS, Math.max(MIN_CHUNK_SECONDS, Math.round(value)));
}

/**
 * Groups transcript cues into shadowing chunks of roughly `targetSeconds`.
 * A chunk always contains at least one cue, so sparse transcripts still work.
 */
export function buildShadowingChunks(
  cues: TranscriptCue[],
  targetSeconds: number = DEFAULT_CHUNK_SECONDS,
): ShadowingChunk[] {
  const target = clampChunkSeconds(targetSeconds);
  const groups: TranscriptCue[][] = [];
  let currentGroup: TranscriptCue[] = [];
  let groupStart = 0;

  for (const cue of cues) {
    if (currentGroup.length === 0) {
      currentGroup = [cue];
      groupStart = cue.startSeconds;
    } else if (cue.startSeconds - groupStart < target) {
      currentGroup.push(cue);
    } else {
      groups.push(currentGroup);
      currentGroup = [cue];
      groupStart = cue.startSeconds;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups.map((group, index) => {
    const nextGroup = groups[index + 1];
    const startSeconds = group[0].startSeconds;
    const endSeconds = nextGroup
      ? Math.max(startSeconds + 1, nextGroup[0].startSeconds - 1)
      : group[group.length - 1].startSeconds + LAST_CHUNK_TAIL_SECONDS;
    const text = group.map(cue => cue.text).join(' ').replace(/\s+/g, ' ').trim();
    return {
      id: `chunk-${index + 1}`,
      index,
      startSeconds,
      endSeconds,
      cueIds: group.map(cue => cue.id),
      text,
      wordCount: countWords(text),
    };
  });
}

export function createShadowingSession(
  chunks: ShadowingChunk[],
  now: Date = new Date(),
): ShadowingSession {
  const progress: Record<string, ShadowingChunkProgress> = {};
  for (const chunk of chunks) {
    progress[chunk.id] = {
      chunkId: chunk.id,
      attempts: 0,
      lastRating: null,
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
      nextReviewDate: null,
      history: [],
    };
  }
  const timestamp = now.toISOString();
  return {
    chunks,
    progress,
    activeChunkId: chunks.length > 0 ? chunks[0].id : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Records one self-rating for a chunk and reschedules it with SM-2.
 * Returns the session unchanged when the chunk or rating is invalid.
 */
export function rateChunk(
  session: ShadowingSession,
  chunkId: string,
  rating: ShadowingRating,
  now: Date = new Date(),
): ShadowingSession {
  const previous = session.progress[chunkId];
  if (!previous || !VALID_RATINGS.includes(rating)) {
    return session;
  }

  const scheduled = calculateSM2(
    { interval: previous.interval, repetition: previous.repetition, easeFactor: previous.easeFactor },
    RATING_TO_SM2_GRADE[rating],
    now,
  );

  const progress: ShadowingChunkProgress = {
    ...previous,
    attempts: previous.attempts + 1,
    lastRating: rating,
    interval: scheduled.interval,
    repetition: scheduled.repetition,
    easeFactor: scheduled.easeFactor,
    nextReviewDate: scheduled.nextReviewDate,
    history: [...previous.history, { date: now.toISOString(), rating }],
  };

  return {
    ...session,
    progress: { ...session.progress, [chunkId]: progress },
    updatedAt: now.toISOString(),
  };
}

export function selectActiveChunk(session: ShadowingSession, chunkId: string): ShadowingSession {
  const exists = session.chunks.some(chunk => chunk.id === chunkId);
  if (!exists) return session;
  return { ...session, activeChunkId: chunkId };
}

export function isChunkMastered(progress: ShadowingChunkProgress): boolean {
  return progress.attempts > 0 && progress.lastRating !== null && progress.lastRating >= MASTERED_RATING;
}

export function isChunkDue(progress: ShadowingChunkProgress, today: string = toISODate(new Date())): boolean {
  if (progress.attempts === 0) return true;
  return progress.nextReviewDate !== null && progress.nextReviewDate <= today;
}

export function getSessionStats(
  session: ShadowingSession,
  today: string = toISODate(new Date()),
): ShadowingSessionStats {
  let attemptedChunks = 0;
  let masteredChunks = 0;
  let dueChunks = 0;

  for (const chunk of session.chunks) {
    const progress = session.progress[chunk.id];
    if (!progress) continue;
    if (progress.attempts > 0) attemptedChunks += 1;
    if (isChunkMastered(progress)) masteredChunks += 1;
    if (isChunkDue(progress, today)) dueChunks += 1;
  }

  const totalChunks = session.chunks.length;
  return {
    totalChunks,
    attemptedChunks,
    masteredChunks,
    dueChunks,
    masteryPercent: totalChunks === 0 ? 0 : Math.round((masteredChunks / totalChunks) * 100),
  };
}

export function summarizeSession(session: ShadowingSession, now: Date = new Date()): ShadowingSessionSummary {
  const stats = getSessionStats(session, toISODate(now));
  let ratingTotal = 0;
  for (const chunk of session.chunks) {
    const progress = session.progress[chunk.id];
    if (progress && progress.attempts > 0) {
      ratingTotal += progress.lastRating ?? 0;
    }
  }

  const startMs = new Date(session.createdAt).getTime();
  const elapsedSeconds = Number.isFinite(startMs)
    ? Math.max(0, Math.round((now.getTime() - startMs) / 1000))
    : 0;

  return {
    ...stats,
    averageRating: stats.attemptedChunks === 0
      ? 0
      : Math.round((ratingTotal / stats.attemptedChunks) * 10) / 10,
    elapsedSeconds,
  };
}

/**
 * Picks the next chunk to practise, starting after `fromChunkId`: the next
 * chunk that is due for review (cyclically), or simply the next chunk when
 * nothing is due. Returns null only for an empty session.
 */
export function pickNextChunkId(
  session: ShadowingSession,
  fromChunkId: string | null,
  today: string = toISODate(new Date()),
): string | null {
  const { chunks } = session;
  if (chunks.length === 0) return null;
  const fromIndex = Math.max(0, chunks.findIndex(chunk => chunk.id === fromChunkId));

  for (let offset = 1; offset <= chunks.length; offset += 1) {
    const candidate = chunks[(fromIndex + offset) % chunks.length];
    if (isChunkDue(session.progress[candidate.id], today)) {
      return candidate.id;
    }
  }
  return chunks[(fromIndex + 1) % chunks.length].id;
}

export function cyclePlaybackSpeed(currentSpeed: number): number {
  const index = SHADOWING_SPEEDS.indexOf(currentSpeed);
  if (index === -1) return 1;
  return SHADOWING_SPEEDS[(index + 1) % SHADOWING_SPEEDS.length];
}

/** A minimal target description so the mapper stays DOM-free and testable. */
export interface ShadowingShortcutTarget {
  tagName?: string;
  isContentEditable?: boolean;
}

/** A keyboard event reduced to what the shortcut mapper needs. */
export type ShadowingShortcutEvent = Pick<KeyboardEvent, 'key'> &
  Partial<Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey'>>;

const EDITABLE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

/**
 * Maps a keyboard event to a studio action, mirroring the reference player:
 * Space replays, ← / → move between chunks, R cycles the playback speed.
 * Returns null for modifier combos and while typing in a form control.
 */
export function mapShadowingShortcut(
  event: ShadowingShortcutEvent,
  target: ShadowingShortcutTarget | null = null,
): ShadowingShortcut | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (target && EDITABLE_TAGS.includes(target.tagName ?? '')) return null;
  if (target && target.isContentEditable) return null;

  switch (event.key) {
    case ' ':
      return 'replay';
    case 'ArrowLeft':
      return 'previous';
    case 'ArrowRight':
      return 'next';
    case 'r':
    case 'R':
      return 'cycleSpeed';
    default:
      return null;
  }
}

/** Stable 32-bit FNV-1a fingerprint of a transcript, for session identity. */
export function transcriptFingerprint(cues: TranscriptCue[]): string {
  const input = cues.map(cue => `${cue.id}|${cue.startSeconds}|${cue.text}`).join('\n');
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidChunk(value: unknown): value is ShadowingChunk {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.index === 'number' &&
    typeof value.startSeconds === 'number' &&
    typeof value.endSeconds === 'number' &&
    typeof value.text === 'string' &&
    Array.isArray(value.cueIds) &&
    value.cueIds.every(id => typeof id === 'string') &&
    typeof value.wordCount === 'number'
  );
}

function isValidProgress(value: unknown): value is ShadowingChunkProgress {
  if (!isRecord(value)) return false;
  const lastRatingValid =
    value.lastRating === null ||
    (typeof value.lastRating === 'number' && VALID_RATINGS.includes(value.lastRating as ShadowingRating));
  const nextReviewValid = value.nextReviewDate === null || typeof value.nextReviewDate === 'string';
  return (
    typeof value.chunkId === 'string' &&
    typeof value.attempts === 'number' &&
    lastRatingValid &&
    nextReviewValid &&
    typeof value.interval === 'number' &&
    typeof value.repetition === 'number' &&
    typeof value.easeFactor === 'number' &&
    Array.isArray(value.history)
  );
}

/** Structural guard for sessions restored from local storage. */
export function isValidShadowingSession(value: unknown): value is ShadowingSession {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.chunks) || value.chunks.length === 0) return false;
  if (!value.chunks.every(isValidChunk)) return false;
  if (!isRecord(value.progress)) return false;

  const chunkIds = new Set(value.chunks.map(chunk => (chunk as ShadowingChunk).id));
  for (const chunkId of chunkIds) {
    if (!isValidProgress((value.progress as Record<string, unknown>)[chunkId])) return false;
  }
  if (typeof value.activeChunkId !== 'string' || !chunkIds.has(value.activeChunkId)) return false;
  return typeof value.createdAt === 'string' && typeof value.updatedAt === 'string';
}

/** Structural guard for persisted session records restored from storage. */
export function isValidShadowingSessionRecord(value: unknown): value is ShadowingSessionRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    isValidShadowingSession(value.session) &&
    typeof value.sourceUrl === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    (value.completedAt === null || typeof value.completedAt === 'string')
  );
}
