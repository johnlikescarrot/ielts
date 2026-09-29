import { describe, expect, it } from 'vitest';
import {
  buildShadowingChunks,
  clampChunkSeconds,
  createShadowingSession,
  cyclePlaybackSpeed,
  DEFAULT_CHUNK_SECONDS,
  isChunkDue,
  isChunkMastered,
  isValidShadowingSession,
  isValidShadowingSessionRecord,
  LAST_CHUNK_TAIL_SECONDS,
  mapShadowingShortcut,
  MAX_STORED_SESSIONS,
  pickNextChunkId,
  rateChunk,
  selectActiveChunk,
  ShadowingChunk,
  ShadowingChunkProgress,
  ShadowingRating,
  ShadowingSession,
  summarizeSession,
  transcriptFingerprint,
} from '../../src/shadowing/shadowingEngine';
import { parseTranscript, TranscriptCue } from '../../src/video/videoLesson';

const cue = (id: string, startSeconds: number, text: string): TranscriptCue => ({ id, startSeconds, text });

const SPACED_CUES: TranscriptCue[] = Array.from({ length: 7 }, (_, index) =>
  cue(`cue-${index + 1}`, index * 8, `Segment ${index + 1} about sustainable cities.`),
);

const NOW = new Date('2026-09-29T10:00:00Z');

const makeProgress = (overrides: Partial<ShadowingChunkProgress> = {}): ShadowingChunkProgress => ({
  chunkId: 'chunk-1',
  attempts: 0,
  lastRating: null,
  interval: 0,
  repetition: 0,
  easeFactor: 2.5,
  nextReviewDate: null,
  history: [],
  ...overrides,
});

describe('clampChunkSeconds', () => {
  it('keeps values inside the 3–120 s chunk window', () => {
    expect(clampChunkSeconds(15)).toBe(15);
    expect(clampChunkSeconds(7.6)).toBe(8);
    expect(clampChunkSeconds(2)).toBe(3);
    expect(clampChunkSeconds(500)).toBe(120);
  });

  it('falls back to the default for non-finite targets', () => {
    expect(clampChunkSeconds(Number.NaN)).toBe(DEFAULT_CHUNK_SECONDS);
    expect(clampChunkSeconds(Number.POSITIVE_INFINITY)).toBe(DEFAULT_CHUNK_SECONDS);
  });
});

describe('buildShadowingChunks', () => {
  it('returns no chunks for an empty transcript', () => {
    expect(buildShadowingChunks([])).toEqual([]);
  });

  it('groups cues that start within the target window', () => {
    const chunks = buildShadowingChunks(SPACED_CUES, 15);
    expect(chunks.map(chunk => chunk.cueIds)).toEqual([
      ['cue-1', 'cue-2'],
      ['cue-3', 'cue-4'],
      ['cue-5', 'cue-6'],
      ['cue-7'],
    ]);
    expect(chunks[0]).toMatchObject({ id: 'chunk-1', index: 0, startSeconds: 0, endSeconds: 15 });
    expect(chunks[3]).toMatchObject({ id: 'chunk-4', index: 3, startSeconds: 48, endSeconds: 48 + LAST_CHUNK_TAIL_SECONDS });
  });

  it('keeps single cues as their own chunk when gaps exceed the target', () => {
    const chunks = buildShadowingChunks(SPACED_CUES, 3);
    expect(chunks).toHaveLength(7);
    expect(chunks[0].cueIds).toEqual(['cue-1']);
  });

  it('normalizes joined chunk text and counts words', () => {
    const chunks = buildShadowingChunks([
      cue('cue-1', 0, 'Hello   world'),
      cue('cue-2', 2, ' again'),
    ], 10);
    expect(chunks[0].text).toBe('Hello world again');
    expect(chunks[0].wordCount).toBe(3);
  });

  it('counts zero words for whitespace-only chunk text', () => {
    const chunks = buildShadowingChunks([cue('cue-1', 0, '   ')], 8);
    expect(chunks[0].text).toBe('');
    expect(chunks[0].wordCount).toBe(0);
  });

  it('builds the same chunks from a real parsed transcript', () => {
    const cues = parseTranscript('[00:00] First line.\n[00:05] Second line.\n[00:40] Much later line.');
    const chunks = buildShadowingChunks(cues, 8);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].text).toBe('First line. Second line.');
    expect(chunks[0].endSeconds).toBe(39);
  });
});

describe('createShadowingSession', () => {
  it('initializes progress for every chunk and activates the first', () => {
    const chunks = buildShadowingChunks(SPACED_CUES, 15);
    const session = createShadowingSession(chunks, NOW);
    expect(session.activeChunkId).toBe('chunk-1');
    expect(Object.keys(session.progress)).toEqual(chunks.map(chunk => chunk.id));
    expect(session.progress['chunk-2']).toEqual(makeProgress({ chunkId: 'chunk-2' }));
    expect(session.createdAt).toBe(NOW.toISOString());
    expect(session.updatedAt).toBe(NOW.toISOString());
  });

  it('leaves the active chunk empty for a session without chunks', () => {
    const session = createShadowingSession([], NOW);
    expect(session.activeChunkId).toBeNull();
    expect(session.chunks).toEqual([]);
  });
});

describe('rateChunk', () => {
  const chunks = buildShadowingChunks([cue('cue-1', 0, 'One'), cue('cue-2', 10, 'Two')], 8);
  const base = createShadowingSession(chunks, NOW);

  it('ignores unknown chunks and invalid ratings', () => {
    expect(rateChunk(base, 'missing', 2, NOW)).toBe(base);
    expect(rateChunk(base, 'chunk-1', 9 as ShadowingRating, NOW)).toBe(base);
  });

  it('schedules an "again" rating as a failed SM-2 review', () => {
    const rated = rateChunk(base, 'chunk-1', 0, NOW);
    const progress = rated.progress['chunk-1'];
    expect(progress.attempts).toBe(1);
    expect(progress.lastRating).toBe(0);
    expect(progress.interval).toBe(1);
    expect(progress.repetition).toBe(0);
    expect(progress.easeFactor).toBe(1.96);
    expect(progress.nextReviewDate).toBe('2026-09-30');
    expect(progress.history).toEqual([{ date: NOW.toISOString(), rating: 0 }]);
    expect(rated.updatedAt).toBe(NOW.toISOString());
  });

  it('schedules pass ratings with growing intervals and stable ease', () => {
    const once = rateChunk(base, 'chunk-1', 2, NOW);
    expect(once.progress['chunk-1'].interval).toBe(1);
    expect(once.progress['chunk-1'].repetition).toBe(1);
    expect(once.progress['chunk-1'].easeFactor).toBe(2.5);

    const twice = rateChunk(once, 'chunk-1', 2, NOW);
    expect(twice.progress['chunk-1'].interval).toBe(6);
    expect(twice.progress['chunk-1'].repetition).toBe(2);
    expect(twice.progress['chunk-1'].nextReviewDate).toBe('2026-10-05');
    expect(twice.progress['chunk-1'].history).toHaveLength(2);

    const easy = rateChunk(base, 'chunk-1', 3, NOW);
    expect(easy.progress['chunk-1'].easeFactor).toBe(2.6);

    const hard = rateChunk(base, 'chunk-1', 1, NOW);
    expect(hard.progress['chunk-1'].easeFactor).toBe(2.36);
    expect(hard.progress['chunk-1'].repetition).toBe(1);
  });

  it('does not mutate the original session', () => {
    const rated = rateChunk(base, 'chunk-1', 2, NOW);
    expect(base.progress['chunk-1'].attempts).toBe(0);
    expect(rated.progress['chunk-1'].attempts).toBe(1);
    expect(rated).not.toBe(base);
  });
});

describe('selectActiveChunk', () => {
  const chunks = buildShadowingChunks(SPACED_CUES, 3);
  const session = createShadowingSession(chunks, NOW);

  it('activates a known chunk', () => {
    const moved = selectActiveChunk(session, 'chunk-3');
    expect(moved.activeChunkId).toBe('chunk-3');
    expect(moved.chunks).toBe(session.chunks);
  });

  it('keeps the session for unknown chunks', () => {
    expect(selectActiveChunk(session, 'nope')).toBe(session);
  });
});

describe('mastery and due state', () => {
  it('requires a passing self-rating for mastery', () => {
    expect(isChunkMastered(makeProgress())).toBe(false);
    expect(isChunkMastered(makeProgress({ attempts: 2, lastRating: null }))).toBe(false);
    expect(isChunkMastered(makeProgress({ attempts: 1, lastRating: 1 }))).toBe(false);
    expect(isChunkMastered(makeProgress({ attempts: 1, lastRating: 2 }))).toBe(true);
    expect(isChunkMastered(makeProgress({ attempts: 1, lastRating: 3 }))).toBe(true);
  });

  it('treats untried and overdue chunks as due', () => {
    expect(isChunkDue(makeProgress(), '2026-09-29')).toBe(true);
    expect(isChunkDue(makeProgress({ attempts: 1, nextReviewDate: null }), '2026-09-29')).toBe(false);
    expect(isChunkDue(makeProgress({ attempts: 1, nextReviewDate: '2026-09-28' }), '2026-09-29')).toBe(true);
    expect(isChunkDue(makeProgress({ attempts: 1, nextReviewDate: '2026-09-29' }), '2026-09-29')).toBe(true);
    expect(isChunkDue(makeProgress({ attempts: 1, nextReviewDate: '2030-01-01' }), '2026-09-29')).toBe(false);
  });
});

describe('getSessionStats and summarizeSession', () => {
  const chunks = buildShadowingChunks([cue('cue-1', 0, 'One'), cue('cue-2', 10, 'Two'), cue('cue-3', 20, 'Three')], 8);

  it('returns zeroed stats for an empty session', () => {
    expect(summarizeSession(createShadowingSession([], NOW), NOW)).toEqual({
      totalChunks: 0,
      attemptedChunks: 0,
      masteredChunks: 0,
      dueChunks: 0,
      masteryPercent: 0,
      averageRating: 0,
      elapsedSeconds: 0,
    });
  });

  it('skips chunks without progress entries', () => {
    const session = createShadowingSession(chunks, NOW);
    const partial: ShadowingSession = { ...session, progress: { 'chunk-1': session.progress['chunk-1'] } };
    const stats = summarizeSession(partial, NOW);
    expect(stats.totalChunks).toBe(3);
    expect(stats.attemptedChunks).toBe(0);
    expect(stats.averageRating).toBe(0);
  });

  it('counts attempted, mastered, due chunks and averages ratings', () => {
    const fiveChunks = buildShadowingChunks(
      [0, 10, 20, 30, 40].map((start, index) => cue(`cue-${index + 1}`, start, `Line ${index + 1}`)),
      8,
    );
    let session = createShadowingSession(fiveChunks, new Date('2026-09-29T09:00:00Z'));
    session = rateChunk(session, 'chunk-1', 3, NOW);
    session = rateChunk(session, 'chunk-2', 1, NOW);
    session = rateChunk(session, 'chunk-3', 2, NOW);
    session = rateChunk(session, 'chunk-4', 3, NOW);
    session = rateChunk(session, 'chunk-5', 2, NOW);

    const summary = summarizeSession(session, new Date('2026-09-29T09:10:30Z'));
    expect(summary.totalChunks).toBe(5);
    expect(summary.attemptedChunks).toBe(5);
    // Only the "hard" chunk-2 is not mastered.
    expect(summary.masteredChunks).toBe(4);
    // Everything has been attempted and scheduled ahead, so nothing is due.
    expect(summary.dueChunks).toBe(0);
    expect(summary.masteryPercent).toBe(80);
    // Mean of last ratings (3 + 1 + 2 + 3 + 2) / 5.
    expect(summary.averageRating).toBe(2.2);
    expect(summary.elapsedSeconds).toBe(630);
  });

  it('clamps elapsed time and treats invalid timestamps as zero', () => {
    const session = createShadowingSession(chunks, new Date('2026-09-29T09:00:00Z'));
    expect(summarizeSession(session, new Date('2026-09-29T08:00:00Z')).elapsedSeconds).toBe(0);

    const broken: ShadowingSession = { ...session, createdAt: 'not-a-date' };
    expect(summarizeSession(broken, NOW).elapsedSeconds).toBe(0);
  });

  it('treats a missing rating as zero when averaging', () => {
    const session = createShadowingSession(chunks, NOW);
    const partial: ShadowingSession = {
      ...session,
      progress: {
        'chunk-1': makeProgress({ attempts: 1, lastRating: null }),
      },
    };
    expect(summarizeSession(partial, NOW).averageRating).toBe(0);
  });
});

describe('pickNextChunkId', () => {
  it('returns null for an empty session', () => {
    expect(pickNextChunkId(createShadowingSession([], NOW), null)).toBeNull();
  });

  it('prefers the next due chunk, searching cyclically', () => {
    const threeChunks: ShadowingChunk[] = buildShadowingChunks(
      [cue('cue-1', 0, 'One'), cue('cue-2', 10, 'Two'), cue('cue-3', 40, 'Three')],
      8,
    );
    const session: ShadowingSession = {
      ...createShadowingSession(threeChunks, NOW),
      progress: {
        // Rated yesterday, so it is due again today.
        'chunk-1': makeProgress({ chunkId: 'chunk-1', attempts: 1, lastRating: 2, nextReviewDate: '2026-09-28' }),
        // Rated and scheduled far ahead.
        'chunk-2': makeProgress({ chunkId: 'chunk-2', attempts: 1, lastRating: 3, nextReviewDate: '2030-01-01' }),
        // Untouched, so it is due.
        'chunk-3': makeProgress({ chunkId: 'chunk-3' }),
      },
    };
    expect(pickNextChunkId(session, 'chunk-1', '2026-09-29')).toBe('chunk-3');
    // From the last chunk the search wraps around to the first due chunk.
    expect(pickNextChunkId(session, 'chunk-3', '2026-09-29')).toBe('chunk-1');
    // Unknown starting point scans from the first chunk onwards.
    expect(pickNextChunkId(session, 'unknown', '2026-09-29')).toBe('chunk-3');
    expect(pickNextChunkId(session, null, '2026-09-29')).toBe('chunk-3');
  });

  it('falls back to the next chunk when nothing is due', () => {
    const chunks = buildShadowingChunks([cue('cue-1', 0, 'One'), cue('cue-2', 10, 'Two')], 8);
    let session = createShadowingSession(chunks, NOW);
    session = rateChunk(session, 'chunk-1', 2, NOW);
    session = rateChunk(session, 'chunk-2', 2, NOW);
    expect(pickNextChunkId(session, 'chunk-1', '2026-09-29')).toBe('chunk-2');
    expect(pickNextChunkId(session, 'chunk-2', '2026-09-29')).toBe('chunk-1');
  });
});

describe('cyclePlaybackSpeed', () => {
  it('steps through the speed ladder and wraps around', () => {
    expect(cyclePlaybackSpeed(0.5)).toBe(0.75);
    expect(cyclePlaybackSpeed(1)).toBe(1.25);
    expect(cyclePlaybackSpeed(2)).toBe(0.5);
  });

  it('resets unknown speeds to normal', () => {
    expect(cyclePlaybackSpeed(3)).toBe(1);
  });
});

describe('mapShadowingShortcut', () => {
  it('maps the reference player shortcuts', () => {
    expect(mapShadowingShortcut({ key: ' ' })).toBe('replay');
    expect(mapShadowingShortcut({ key: 'ArrowLeft' })).toBe('previous');
    expect(mapShadowingShortcut({ key: 'ArrowRight' })).toBe('next');
    expect(mapShadowingShortcut({ key: 'r' })).toBe('cycleSpeed');
    expect(mapShadowingShortcut({ key: 'R' })).toBe('cycleSpeed');
    expect(mapShadowingShortcut({ key: 'x' })).toBeNull();
  });

  it('ignores shortcuts with modifier keys', () => {
    const base = { key: ' ' };
    expect(mapShadowingShortcut({ ...base, ctrlKey: true })).toBeNull();
    expect(mapShadowingShortcut({ ...base, metaKey: true })).toBeNull();
    expect(mapShadowingShortcut({ ...base, altKey: true })).toBeNull();
  });

  it('ignores shortcuts while a form control is focused', () => {
    expect(mapShadowingShortcut({ key: ' ' }, { tagName: 'INPUT' })).toBeNull();
    expect(mapShadowingShortcut({ key: ' ' }, { tagName: 'TEXTAREA' })).toBeNull();
    expect(mapShadowingShortcut({ key: ' ' }, { tagName: 'SELECT' })).toBeNull();
    expect(mapShadowingShortcut({ key: ' ' }, { isContentEditable: true })).toBeNull();
    expect(mapShadowingShortcut({ key: ' ' }, { tagName: 'BUTTON' })).toBe('replay');
    expect(mapShadowingShortcut({ key: ' ' }, {})).toBe('replay');
    expect(mapShadowingShortcut({ key: 'ArrowRight' }, null)).toBe('next');
  });
});

describe('transcriptFingerprint', () => {
  it('is stable, content-dependent, and empty-safe', () => {
    expect(transcriptFingerprint([])).toBe('811c9dc5');
    expect(transcriptFingerprint(SPACED_CUES)).toBe(transcriptFingerprint(SPACED_CUES));
    expect(transcriptFingerprint(SPACED_CUES)).not.toBe(transcriptFingerprint(SPACED_CUES.slice(0, 6)));
    expect(transcriptFingerprint(SPACED_CUES)).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('session validation guards', () => {
  const chunks = buildShadowingChunks([cue('cue-1', 0, 'One'), cue('cue-2', 10, 'Two')], 8);
  const validSession = rateChunk(createShadowingSession(chunks, NOW), 'chunk-1', 2, NOW);

  const validRecord = {
    id: 'shadow-1',
    session: validSession,
    sourceUrl: 'https://www.youtube.com/watch?v=abc',
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    completedAt: null,
  };

  it('accepts sessions produced by the engine', () => {
    expect(isValidShadowingSession(validSession)).toBe(true);
    expect(isValidShadowingSessionRecord(validRecord)).toBe(true);
    expect(isValidShadowingSessionRecord({ ...validRecord, completedAt: NOW.toISOString() })).toBe(true);
  });

  it('rejects malformed sessions', () => {
    const invalid: unknown[] = [
      null,
      'session',
      42,
      { ...validSession, chunks: [] },
      { ...validSession, chunks: 'nope' },
      { ...validSession, chunks: [{ ...chunks[0], id: 7 }] },
      { ...validSession, chunks: [{ ...chunks[0], index: '0' }] },
      { ...validSession, chunks: [{ ...chunks[0], startSeconds: '0' }] },
      { ...validSession, chunks: [{ ...chunks[0], endSeconds: null }] },
      { ...validSession, chunks: [{ ...chunks[0], text: 3 }] },
      { ...validSession, chunks: [{ ...chunks[0], cueIds: 'cue-1' }] },
      { ...validSession, chunks: [{ ...chunks[0], cueIds: [1] }] },
      { ...validSession, chunks: [{ ...chunks[0], wordCount: '2' }] },
      { ...validSession, chunks: [null] },
      { ...validSession, progress: null },
      { ...validSession, progress: { 'chunk-1': null } },
      { ...validSession, progress: { ...validSession.progress, 'chunk-2': { ...validSession.progress['chunk-2'], chunkId: 1 } } },
      { ...validSession, progress: { ...validSession.progress, 'chunk-2': { ...validSession.progress['chunk-2'], attempts: '1' } } },
      { ...validSession, progress: { ...validSession.progress, 'chunk-2': { ...validSession.progress['chunk-2'], lastRating: 7 } } },
      { ...validSession, progress: { ...validSession.progress, 'chunk-2': { ...validSession.progress['chunk-2'], lastRating: '2' } } },
      { ...validSession, progress: { ...validSession.progress, 'chunk-2': { ...validSession.progress['chunk-2'], nextReviewDate: 5 } } },
      { ...validSession, progress: { ...validSession.progress, 'chunk-2': { ...validSession.progress['chunk-2'], interval: '1' } } },
      { ...validSession, progress: { ...validSession.progress, 'chunk-2': { ...validSession.progress['chunk-2'], repetition: null } } },
      { ...validSession, progress: { ...validSession.progress, 'chunk-2': { ...validSession.progress['chunk-2'], easeFactor: false } } },
      { ...validSession, progress: { ...validSession.progress, 'chunk-2': { ...validSession.progress['chunk-2'], history: 'x' } } },
      { ...validSession, activeChunkId: null },
      { ...validSession, activeChunkId: 12 },
      { ...validSession, activeChunkId: 'chunk-999' },
      { ...validSession, createdAt: 5 },
      { ...validSession, updatedAt: null },
    ];
    for (const candidate of invalid) {
      expect(isValidShadowingSession(candidate)).toBe(false);
    }
  });

  it('rejects malformed session records', () => {
    const invalid: unknown[] = [
      null,
      'record',
      { ...validRecord, id: 7 },
      { ...validRecord, session: { ...validSession, chunks: [] } },
      { ...validRecord, sourceUrl: 4 },
      { ...validRecord, createdAt: true },
      { ...validRecord, updatedAt: 9 },
      { ...validRecord, completedAt: 3 },
    ];
    for (const candidate of invalid) {
      expect(isValidShadowingSessionRecord(candidate)).toBe(false);
    }
  });

  it('exposes the storage cap as a constant', () => {
    expect(MAX_STORED_SESSIONS).toBeGreaterThan(0);
  });
});
