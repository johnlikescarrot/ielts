import { describe, expect, it } from 'vitest';
import {
  buildVideoStudyPlan,
  buildVideoUrlAtTime,
  countWords,
  createClozeQuestions,
  extractAcademicVocabulary,
  formatTimestamp,
  parseTimestamp,
  parseTranscript,
  parseVideoSource,
  validateVideoStudyInput,
} from '../../src/video/transcriptStudio';

const TIMESTAMPED_TRANSCRIPT = `[00:12] Governments must analyze reliable evidence and mitigate congestion through efficient public transport networks.
[00:24] Furthermore, integrated infrastructure can improve access for remote communities.
[01:02] Consequently, policymakers should assess the long-term benefit of this approach.`;

describe('transcriptStudio', () => {
  it('parses supported YouTube and Bilibili URLs into safe canonical sources', () => {
    expect(parseVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share')).toEqual({
      platform: 'youtube',
      originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share',
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
    });
    expect(parseVideoSource('https://youtu.be/dQw4w9WgXcQ')).toMatchObject({
      platform: 'youtube',
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
    expect(parseVideoSource('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toMatchObject({
      platform: 'youtube',
      videoId: 'dQw4w9WgXcQ',
    });
    expect(parseVideoSource('https://www.bilibili.com/video/BV1xx411c7mD')).toMatchObject({
      platform: 'bilibili',
      videoId: 'BV1xx411c7mD',
    });
    expect(parseVideoSource('https://b23.tv/example')).toMatchObject({ platform: 'bilibili' });
  });

  it('rejects unsupported, unsafe, incomplete, and malformed URLs', () => {
    expect(parseVideoSource('')).toBeUndefined();
    expect(parseVideoSource('not-a-url')).toBeUndefined();
    expect(parseVideoSource('ftp://youtube.com/watch?v=dQw4w9WgXcQ')).toBeUndefined();
    expect(parseVideoSource('https://youtube.com/watch?v=short')).toBeUndefined();
    expect(parseVideoSource('https://youtube.com/watch')).toBeUndefined();
    expect(parseVideoSource('https://example.com/video')).toBeUndefined();
  });

  it('validates a supported URL and a meaningful local transcript', () => {
    expect(validateVideoStudyInput('', TIMESTAMPED_TRANSCRIPT).error).toMatch(/YouTube or Bilibili/);
    expect(validateVideoStudyInput('https://youtu.be/dQw4w9WgXcQ', 'too short').error).toMatch(/at least 20 words/);
    expect(validateVideoStudyInput('https://youtu.be/dQw4w9WgXcQ', TIMESTAMPED_TRANSCRIPT).source?.platform).toBe('youtube');
  });

  it('parses, validates, and formats timestamp values', () => {
    expect(parseTimestamp('01:02')).toBe(62);
    expect(parseTimestamp('1:02:03')).toBe(3723);
    expect(parseTimestamp('1:80')).toBeUndefined();
    expect(parseTimestamp('1:61:03')).toBeUndefined();
    expect(parseTimestamp('nope')).toBeUndefined();
    expect(formatTimestamp(-1)).toBe('0:00');
    expect(formatTimestamp(62.8)).toBe('1:02');
    expect(formatTimestamp(3723)).toBe('1:02:03');
  });

  it('turns timestamped and plain captions into reviewable segments', () => {
    expect(parseTranscript('')).toEqual([]);
    expect(parseTranscript('[00:10] First sentence. Second sentence!\nA plain final caption.')).toEqual([
      { id: 'segment-0-0', text: 'First sentence.', startSeconds: 10 },
      { id: 'segment-0-1', text: 'Second sentence!', startSeconds: 22 },
      { id: 'segment-1-0', text: 'A plain final caption.', startSeconds: 34 },
    ]);
  });

  it('counts words, finds AWL vocabulary, and produces distinct cloze questions', () => {
    expect(countWords("A learner's well-planned response.")).toBe(4);
    expect(countWords('!!!')).toBe(0);
    expect(extractAcademicVocabulary('!!!')).toEqual([]);
    expect(extractAcademicVocabulary('Analyze evidence, analyze approach, and assess the approach.', 2)).toEqual([
      expect.objectContaining({ word: 'analyze', occurrences: 2 }),
      expect.objectContaining({ word: 'approach', occurrences: 2 }),
    ]);

    const questions = createClozeQuestions([
      { id: 'one', startSeconds: 12, text: 'Students must analyze reliable data before they respond.' },
      { id: 'two', startSeconds: 24, text: 'Researchers analyze evidence across several communities.' },
      { id: 'three', startSeconds: 36, text: 'Infrastructure improves regional accessibility for everyone.' },
      { id: 'four', startSeconds: 48, text: 'Too short now.' },
    ]);

    expect(questions).toHaveLength(2);
    expect(questions[0]).toMatchObject({ answer: 'analyze', prompt: 'Students must _____ reliable data before they respond.' });
    expect(questions[1]).toMatchObject({ answer: 'infrastructure', prompt: '_____ improves regional accessibility for everyone.' });
  });

  it('builds a complete local plan and timestamp links without network access', () => {
    const plan = buildVideoStudyPlan(TIMESTAMPED_TRANSCRIPT);
    expect(plan.wordCount).toBeGreaterThan(20);
    expect(plan.segments).toHaveLength(3);
    expect(plan.vocabulary.map(item => item.word)).toContain('analyze');
    expect(plan.clozeQuestions.length).toBeGreaterThan(0);
    expect(plan.estimatedStudyMinutes).toBeGreaterThanOrEqual(5);

    const youtube = parseVideoSource('https://youtu.be/dQw4w9WgXcQ')!;
    const bilibili = parseVideoSource('https://www.bilibili.com/video/BV1xx411c7mD')!;
    expect(buildVideoUrlAtTime(youtube, 62.9)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=62s');
    expect(buildVideoUrlAtTime(bilibili, 62.9)).toBe('https://www.bilibili.com/video/BV1xx411c7mD?t=62');
  });
});

describe('transcriptStudio edge cases', () => {
  it('handles unsupported timestamp shapes and blank caption lines', () => {
    expect(parseTimestamp('1:2:3:4')).toBeUndefined();
    expect(parseTranscript('[00:10]\n\n[00:20]   \nNo punctuation caption')).toEqual([
      { id: 'segment-2-0', text: 'No punctuation caption', startSeconds: 0 },
    ]);
    expect(parseTranscript('...')).toEqual([{ id: 'segment-0-0', text: '...', startSeconds: 0 }]);
  });

  it('uses fallback cloze words, honors limits, and skips duplicate or unusable prompts', () => {
    expect(createClozeQuestions([
      { id: 'no-answer', startSeconds: 0, text: '!!!' },
      { id: 'no-choice', startSeconds: 5, text: 'One two three four five.' },
      { id: 'short-answer', startSeconds: 8, text: 'A and the to is.' },
      { id: 'fallback', startSeconds: 10, text: 'Learners discuss collaboration during their seminar session.' },
      { id: 'limited', startSeconds: 20, text: 'Participants organize flexible material for their study group.' },
    ], 1)).toEqual([
      expect.objectContaining({ answer: 'collaboration' }),
    ]);
  });
});
