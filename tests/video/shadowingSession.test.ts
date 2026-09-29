import { describe, it, expect } from 'vitest';
import {
  extractChunkVocabulary,
  createShadowingChunks,
  cyclePlaybackSpeed,
  createShadowingSession,
  nextChunk,
  prevChunk,
  goToChunk,
  incrementRepetition,
  attachChunkRecording,
  calculateShadowingMastery,
} from '../../src/video/shadowingSession';
import { SubtitleCue } from '../../src/video/subtitleParser';

describe('shadowingSession', () => {
  const sampleCues: SubtitleCue[] = [
    { id: 'cue-1', startSeconds: 0, endSeconds: 4, text: 'Researchers analyze sustainable transport systems.' },
    { id: 'cue-2', startSeconds: 4, endSeconds: 8, text: 'The evidence indicates substantial community benefits.' },
    { id: 'cue-3', startSeconds: 8, endSeconds: 12, text: 'Consequently, governments must allocate resources.' },
  ];

  describe('extractChunkVocabulary', () => {
    it('extracts academic words and initial vocabulary bank matches', () => {
      const vocab = extractChunkVocabulary('Researchers analyze sustainable environmental policies and mitigate pollution.');
      expect(vocab.length).toBeGreaterThan(0);
      const words = vocab.map(v => v.word.toLowerCase());
      expect(words).toContain('analyze');
    });

    it('returns empty array when no academic words found', () => {
      const vocab = extractChunkVocabulary('The cat sat on the rug.');
      expect(vocab).toEqual([]);
    });
  });

  describe('createShadowingChunks', () => {
    it('returns empty array for empty cues', () => {
      expect(createShadowingChunks([])).toEqual([]);
    });

    it('creates chunks in cue mode', () => {
      const chunks = createShadowingChunks(sampleCues, 'cue', 8, 3);
      expect(chunks).toHaveLength(3);
      expect(chunks[0].text).toBe(sampleCues[0].text);
      expect(chunks[0].targetRepetitions).toBe(3);
    });

    it('creates chunks in sentence mode', () => {
      const chunks = createShadowingChunks(sampleCues, 'sentence', 8, 3);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('creates chunks in fixed duration mode', () => {
      const chunks = createShadowingChunks(sampleCues, 'fixed', 5, 2);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks[0].targetRepetitions).toBe(2);
    });
  });

  describe('cyclePlaybackSpeed', () => {
    it('cycles sequentially through speeds and wraps around', () => {
      expect(cyclePlaybackSpeed(0.5)).toBe(0.75);
      expect(cyclePlaybackSpeed(0.75)).toBe(0.85);
      expect(cyclePlaybackSpeed(0.85)).toBe(1.0);
      expect(cyclePlaybackSpeed(1.0)).toBe(1.25);
      expect(cyclePlaybackSpeed(1.25)).toBe(1.5);
      expect(cyclePlaybackSpeed(1.5)).toBe(1.75);
      expect(cyclePlaybackSpeed(1.75)).toBe(2.0);
      expect(cyclePlaybackSpeed(2.0)).toBe(0.5);
    });

    it('falls back to 1.0 for unknown speed', () => {
      expect(cyclePlaybackSpeed(3.5 as any)).toBe(1.0);
    });
  });

  describe('createShadowingSession and navigation', () => {
    it('creates session with correct initial state', () => {
      const session = createShadowingSession({
        title: 'Test Session',
        sourceType: 'preset',
        transcriptOrSubtitles: '[00:00] First cue\n[00:05] Second cue',
      });
      expect(session.title).toBe('Test Session');
      expect(session.chunks.length).toBe(2);
      expect(session.activeChunkIndex).toBe(0);
      expect(session.playbackSpeed).toBe(1.0);
    });

    it('navigates next, previous, and directly to chunks safely', () => {
      let session = createShadowingSession({
        title: 'Nav Test',
        sourceType: 'preset',
        transcriptOrSubtitles: '[00:00] Chunk 1\n[00:05] Chunk 2\n[00:10] Chunk 3',
      });

      // Prev on first chunk stays on 0
      session = prevChunk(session);
      expect(session.activeChunkIndex).toBe(0);

      // Next advances
      session = nextChunk(session);
      expect(session.activeChunkIndex).toBe(1);

      session = nextChunk(session);
      expect(session.activeChunkIndex).toBe(2);

      // Next on last chunk stays on 2
      session = nextChunk(session);
      expect(session.activeChunkIndex).toBe(2);

      // Go to chunk directly with boundary protection
      session = goToChunk(session, 1);
      expect(session.activeChunkIndex).toBe(1);

      session = goToChunk(session, 99);
      expect(session.activeChunkIndex).toBe(2);

      session = goToChunk(session, -5);
      expect(session.activeChunkIndex).toBe(0);
    });

    it('handles navigation on empty session gracefully', () => {
      const emptySession = createShadowingSession({
        title: 'Empty',
        sourceType: 'preset',
        transcriptOrSubtitles: '',
      });
      expect(nextChunk(emptySession).activeChunkIndex).toBe(0);
      expect(prevChunk(emptySession).activeChunkIndex).toBe(0);
      expect(goToChunk(emptySession, 2).activeChunkIndex).toBe(0);
    });
  });

  describe('repetition and recording tracking', () => {
    it('increments repetition count on active or specific chunk', () => {
      let session = createShadowingSession({
        title: 'Reps Test',
        sourceType: 'preset',
        transcriptOrSubtitles: '[00:00] Chunk 1\n[00:05] Chunk 2',
      });

      session = incrementRepetition(session);
      expect(session.chunks[0].repetitionCount).toBe(1);

      session = incrementRepetition(session, 1);
      expect(session.chunks[1].repetitionCount).toBe(1);

      // Invalid index does not modify
      const unchanged = incrementRepetition(session, 99);
      expect(unchanged).toEqual(session);
    });

    it('attaches audio recording URL to a chunk', () => {
      let session = createShadowingSession({
        title: 'Audio Test',
        sourceType: 'preset',
        transcriptOrSubtitles: '[00:00] Chunk 1',
      });

      session = attachChunkRecording(session, 0, 'blob:http://localhost/test-audio');
      expect(session.chunks[0].recordedAudioUrl).toBe('blob:http://localhost/test-audio');

      // Invalid index does not crash
      const unchanged = attachChunkRecording(session, 5, 'blob:http://localhost/other');
      expect(unchanged).toEqual(session);
    });

    it('calculates session mastery percentage accurately', () => {
      let session = createShadowingSession({
        title: 'Mastery Test',
        sourceType: 'preset',
        transcriptOrSubtitles: '[00:00] Chunk 1\n[00:05] Chunk 2',
        targetRepetitions: 2,
      });

      let mastery = calculateShadowingMastery(session);
      expect(mastery.masteryPercentage).toBe(0);
      expect(mastery.totalChunks).toBe(2);

      // Finish 1 chunk (2 reps)
      session = incrementRepetition(session, 0);
      session = incrementRepetition(session, 0);
      mastery = calculateShadowingMastery(session);
      expect(mastery.masteredChunks).toBe(1);
      expect(mastery.masteryPercentage).toBe(50);
      expect(mastery.totalRepetitions).toBe(2);

      // Finish second chunk
      session = incrementRepetition(session, 1);
      session = incrementRepetition(session, 1);
      mastery = calculateShadowingMastery(session);
      expect(mastery.masteredChunks).toBe(2);
      expect(mastery.masteryPercentage).toBe(100);
    });

    it('handles calculateShadowingMastery on empty session', () => {
      const empty = createShadowingSession({
        title: 'Empty',
        sourceType: 'preset',
        transcriptOrSubtitles: '',
      });
      const mastery = calculateShadowingMastery(empty);
      expect(mastery.masteryPercentage).toBe(0);
      expect(mastery.totalChunks).toBe(0);
    });
  });
});
