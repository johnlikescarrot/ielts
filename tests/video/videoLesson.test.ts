import { describe, expect, it } from 'vitest';
import {
  cefrToBand,
  createVideoLesson,
  formatTimestamp,
  getYouTubeVideoId,
  normalizeAnswer,
  parseTranscript,
  scoreLesson,
  timestampToSeconds,
} from '../../src/video/videoLesson';

const TRANSCRIPT = `[00:00] Researchers analyze significant changes in urban transport.
00:08 Sustainable systems benefit communities and reduce pollution.
00:16 However, governments require evidence before they allocate resources.
00:24 The innovative approach could mitigate environmental damage.
00:32 Citizens increasingly support accessible public infrastructure.`;

describe('video lesson engine', () => {
  it('parses timestamp variants and rejects invalid values', () => {
    expect(timestampToSeconds('01:02')).toBe(62);
    expect(timestampToSeconds('1:02:03,500')).toBe(3723);
    expect(timestampToSeconds('62:00')).toBeNull();
    expect(timestampToSeconds('00:99')).toBeNull();
    expect(timestampToSeconds('later')).toBeNull();
  });

  it('parses SRT, time-only, prefixed, duplicate, and untimed captions', () => {
    const cues = parseTranscript(`1
00:00:01,000 --> 00:00:04,000
<i>Academic research matters.</i>
00:05
Sustainable transport works.
[00:12] First caption
00:12 Second caption
An untimed final caption {\\an8}`);

    expect(cues).toEqual([
      { id: 'cue-1', startSeconds: 1, text: 'Academic research matters.' },
      { id: 'cue-2', startSeconds: 5, text: 'Sustainable transport works.' },
      { id: 'cue-3', startSeconds: 12, text: 'First caption Second caption' },
      { id: 'cue-4', startSeconds: 20, text: 'An untimed final caption' },
    ]);
    expect(parseTranscript('')).toEqual([]);
    expect(parseTranscript('00:01\n\n')).toEqual([]);
    expect(parseTranscript('00:99 Invalid timestamp\n00:00 <i></i>\n00:02 !!!')).toEqual([
      { id: 'cue-1', startSeconds: 2, text: '!!!' },
    ]);
  });

  it('maps CEFR levels to estimated IELTS bands', () => {
    expect(cefrToBand('C2')).toBe(8.5);
    expect(cefrToBand('C1')).toBe(7.5);
    expect(cefrToBand('B2')).toBe(6.5);
  });

  it('creates deterministic, distributed cloze questions and known vocabulary', () => {
    const lesson = createVideoLesson(TRANSCRIPT, 3);
    expect(lesson.cues).toHaveLength(5);
    expect(lesson.questions).toHaveLength(3);
    expect(lesson.questions[0]).toMatchObject({
      id: 'cloze-1',
      cueId: 'cue-1',
      startSeconds: 0,
    });
    expect(lesson.questions.every(question => question.prompt.includes('_____'))).toBe(true);
    expect(lesson.questions.every(question => question.hint.includes('letters'))).toBe(true);
    expect(lesson.vocabulary.some(item => item.word.toLowerCase() === 'analyze')).toBe(true);
    const levels = createVideoLesson('00:00 Paradigm ubiquitous allocate benefit paradigm.').vocabulary;
    expect(levels.map(item => item.band)).toEqual([8.5, 8.5, 7.5, 6.5]);
    const cappedVocabulary = createVideoLesson('00:00 Analyze analysis approach area assess assessment assume authority available benefit concept constitute derive.');
    expect(cappedVocabulary.vocabulary).toHaveLength(10);
    expect(lesson.wordCount).toBeGreaterThan(20);
    expect(lesson.durationSeconds).toBe(32);
  });

  it('handles empty lessons, limits, short cues, and fallback long words', () => {
    expect(createVideoLesson('', 0)).toEqual({
      cues: [], questions: [], vocabulary: [], wordCount: 0, durationSeconds: 0,
    });
    expect(createVideoLesson('tiny words are here', 50).questions).toHaveLength(0);
    expect(createVideoLesson('00:00 !!!').wordCount).toBe(0);
    const fallback = createVideoLesson('00:00 Cryptocurrency revolutionaries communicated internationally.', Number.NaN);
    expect(fallback.questions).toHaveLength(1);
    expect(fallback.questions[0].answer).toBe('revolutionaries');
    expect(createVideoLesson(TRANSCRIPT, 99).questions.length).toBeLessThanOrEqual(12);
  });

  it('normalizes and scores answers', () => {
    const questions = createVideoLesson(TRANSCRIPT, 2).questions;
    const answers = {
      [questions[0].id]: ` ${questions[0].answer.toUpperCase()}! `,
      [questions[1].id]: 'incorrect',
    };
    expect(normalizeAnswer("  Learner's! ")).toBe("learner's");
    expect(scoreLesson(questions, answers)).toBe(1);
    expect(scoreLesson(questions, {})).toBe(0);
  });

  it('formats timestamps safely', () => {
    expect(formatTimestamp(-3)).toBe('0:00');
    expect(formatTimestamp(65.9)).toBe('1:05');
    expect(formatTimestamp(3661)).toBe('1:01:01');
  });

  it('extracts supported YouTube IDs without accepting lookalike hosts', () => {
    const id = 'dQw4w9WgXcQ';
    expect(getYouTubeVideoId(id)).toBe(id);
    expect(getYouTubeVideoId(`https://youtu.be/${id}?t=4`)).toBe(id);
    expect(getYouTubeVideoId(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(getYouTubeVideoId(`https://youtube.com/embed/${id}`)).toBe(id);
    expect(getYouTubeVideoId(`https://youtube.com/shorts/${id}`)).toBe(id);
    expect(getYouTubeVideoId('https://youtube.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(getYouTubeVideoId('https://evilyoutube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(getYouTubeVideoId('not a URL')).toBeNull();
    expect(getYouTubeVideoId('https://youtube.com/watch')).toBeNull();
    expect(getYouTubeVideoId('https://youtu.be/')).toBeNull();
  });
});
