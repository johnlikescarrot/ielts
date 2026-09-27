import { describe, expect, it } from 'vitest';
import {
  detectVideoPlatform,
  extractVideoVocabulary,
  formatTimestamp,
  generateVideoPracticePack,
  normalizeTranscript,
  parseTimestampToSeconds,
  splitTranscriptSegments,
} from '../../src/video/videoPracticeGenerator';

const TRANSCRIPT = `[00:00] Speaker: Today we analyze climate policy and sustainable transport in modern cities.
[00:12] Speaker: Evidence from researchers indicates that public transit can reduce emissions and create community benefits.
[00:25] Speaker: However, limited finance and political resistance remain significant challenges for local authorities.
[00:39] Speaker: Successful programs combine education, technology, and clear policy support for long-term impact.`;

describe('videoPracticeGenerator', () => {
  it('detects supported video platforms', () => {
    expect(detectVideoPlatform('https://www.youtube.com/watch?v=abc')).toBe('youtube');
    expect(detectVideoPlatform('https://youtu.be/abc')).toBe('youtube');
    expect(detectVideoPlatform('https://www.bilibili.com/video/BV1')).toBe('bilibili');
    expect(detectVideoPlatform('https://b23.tv/demo')).toBe('bilibili');
    expect(detectVideoPlatform('https://example.com/video')).toBe('generic');
  });

  it('parses and formats timestamps', () => {
    expect(parseTimestampToSeconds('01:02:03')).toBe(3723);
    expect(parseTimestampToSeconds('02:05')).toBe(125);
    expect(parseTimestampToSeconds('45')).toBe(45);
    expect(parseTimestampToSeconds('bad')).toBe(0);
    expect(formatTimestamp(125)).toBe('02:05');
    expect(formatTimestamp(-4)).toBe('00:00');
  });

  it('normalizes captions and builds segments with speakers', () => {
    expect(normalizeTranscript('[00:00] Speaker: Hello   world.\n[00:05] Another: Policy matters.'))
      .toBe('Hello world. Policy matters.');

    const segments = splitTranscriptSegments(TRANSCRIPT);
    expect(segments).toHaveLength(4);
    expect(segments[1]).toMatchObject({ startSeconds: 12, speaker: 'Speaker' });
    expect(segments[1].text).toContain('Evidence from researchers');
  });

  it('creates estimated segments when timestamps are absent', () => {
    const segments = splitTranscriptSegments('First idea matters. Second idea develops the topic.', 120);
    expect(segments).toHaveLength(2);
    expect(segments[1].startSeconds).toBe(60);
  });

  it('extracts IELTS vocabulary with AWL metadata and fallback definitions', () => {
    const vocabulary = extractVideoVocabulary(`${TRANSCRIPT} innovation innovation`, 20);
    expect(vocabulary.length).toBeGreaterThan(0);
    expect(vocabulary.some(item => item.word === 'policy' && item.isAcademic)).toBe(true);
    expect(vocabulary.some(item => item.word === 'innovation')).toBe(true);
  });

  it('generates a full offline IELTS video practice pack', () => {
    const pack = generateVideoPracticePack({
      title: 'Climate policy video',
      sourceUrl: 'https://www.youtube.com/watch?v=abc',
      transcript: TRANSCRIPT,
    });

    expect(pack.title).toBe('Climate policy video');
    expect(pack.platform).toBe('youtube');
    expect(pack.insights.astryxSource).toBe('https://github.com/facebook/astryx');
    expect(pack.insights.wordCount).toBeGreaterThan(20);
    expect(pack.listeningQuestions).toHaveLength(5);
    expect(pack.readingQuestions.map(question => question.answer)).toEqual(['True', 'False', 'Not Given']);
    expect(pack.speakingPrompts.map(prompt => prompt.part)).toEqual([1, 2, 3]);
    expect(pack.writingTask.prompt).toMatch(/Discuss both views/);
    expect(pack.actionPlan).toHaveLength(4);
  });

  it('uses safe fallbacks for empty transcripts and untitled sources', () => {
    const pack = generateVideoPracticePack({ transcript: '' });
    expect(pack.title).toBe('Untitled IELTS Video Drill');
    expect(pack.platform).toBe('generic');
    expect(pack.normalizedTranscript).toContain('IELTS practice');
    expect(pack.listeningQuestions.length).toBeGreaterThan(0);
  });
});
