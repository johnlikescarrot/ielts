import { describe, expect, it } from 'vitest';
import {
  calculateLevenshteinDistance,
  calculatePronunciationScore,
  cefrToBand,
  cleanCaption,
  createVideoLesson,
  CURATED_IELTS_LESSONS,
  exportToSRT,
  exportToVTT,
  formatTimestamp,
  getYouTubeVideoId,
  lookupVocabulary,
  normalizeAnswer,
  parseSRT,
  parseTranscript,
  parseVTT,
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
    expect(timestampToSeconds('12:65:00')).toBeNull();
  });

  it('cleans markup and tags from captions', () => {
    expect(cleanCaption('<i><b>Academic</b></i> {\\an8} {color:red} test')).toBe('Academic test');
    expect(cleanCaption('Normal text')).toBe('Normal text');
  });

  it('parses SRT formatted subtitles', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,500
First line of SRT

2
00:00:05,000 --> 00:00:08,000
Second line of SRT`;

    const cues = parseSRT(srt);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({
      id: 'cue-1',
      startSeconds: 1,
      endSeconds: 4,
      text: 'First line of SRT',
    });

    expect(parseSRT('')).toEqual([]);
    expect(parseSRT('invalid text without timestamps')).toEqual([]);
    expect(parseSRT('1\n99:99:99,000 --> 99:99:99,000\nInvalid')).toEqual([]);
    expect(parseSRT('1\n00:00:01,000 --> 99:99:99,000\nValid start invalid end')).toHaveLength(1);
    expect(parseSRT('1\n00:00:01,000 --> 00:00:04,000\n<i></i>')).toHaveLength(0);
  });

  it('parses VTT formatted subtitles', () => {
    const vtt = `WEBVTT - Sample

1
00:01.000 --> 00:04.500
First VTT cue

2
00:05.000 --> 00:08.000
Second VTT cue`;

    const cues = parseVTT(vtt);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({
      id: 'cue-1',
      startSeconds: 1,
      endSeconds: 4,
      text: 'First VTT cue',
    });

    expect(parseVTT('')).toEqual([]);
    expect(parseVTT('WEBVTT\n\nNo timestamps here')).toEqual([]);
    expect(parseVTT('WEBVTT\n\n00:99.000 --> 00:99.000\nInvalid')).toEqual([]);
    expect(parseVTT('WEBVTT\n\n00:01.000 --> 99:99.000\nValid start invalid end')).toHaveLength(1);
    expect(parseVTT('WEBVTT\n\n00:01.000 --> 00:04.000\n<i></i>')).toHaveLength(0);
  });

  it('exports cues to SRT and VTT formats', () => {
    const sampleCues = [
      { id: 'cue-1', startSeconds: 5, endSeconds: 9, text: 'Hello world.' },
      { id: 'cue-2', startSeconds: 3661, text: 'Second cue without end.' },
    ];

    const srtOutput = exportToSRT(sampleCues);
    expect(srtOutput).toContain('00:00:05,000 --> 00:00:09,000');
    expect(srtOutput).toContain('01:01:01,000 --> 01:01:05,000');
    expect(srtOutput).toContain('Hello world.');

    const vttOutput = exportToVTT(sampleCues);
    expect(vttOutput).toContain('WEBVTT');
    expect(vttOutput).toContain('00:00:05.000 --> 00:00:09.000');
    expect(vttOutput).toContain('Hello world.');
  });

  it('parses SRT, time-only, prefixed, duplicate, and untimed captions in parseTranscript', () => {
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
    expect(cefrToBand('A1')).toBe(6.5);
  });

  it('looks up vocabulary correctly in bank and academic list', () => {
    const bankVocab = lookupVocabulary('mitigate');
    expect(bankVocab).not.toBeNull();
    expect(bankVocab?.word.toLowerCase()).toBe('mitigate');

    const awlVocab = lookupVocabulary('analyze');
    expect(awlVocab).not.toBeNull();
    expect(awlVocab?.word.toLowerCase()).toBe('analyze');

    expect(lookupVocabulary('xyzrandomnonexistentword')).toBeNull();
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
    expect(getYouTubeVideoId(`https://youtube.com/live/${id}`)).toBe(id);
    expect(getYouTubeVideoId('https://youtube.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(getYouTubeVideoId('https://evilyoutube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(getYouTubeVideoId('not a URL')).toBeNull();
    expect(getYouTubeVideoId('https://youtube.com/watch')).toBeNull();
    expect(getYouTubeVideoId('https://youtu.be/')).toBeNull();
  });

  it('calculates Levenshtein distance properly', () => {
    expect(calculateLevenshteinDistance('', '')).toBe(0);
    expect(calculateLevenshteinDistance('hello', '')).toBe(5);
    expect(calculateLevenshteinDistance('', 'world')).toBe(5);
    expect(calculateLevenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(calculateLevenshteinDistance('saturday', 'sunday')).toBe(3);
  });

  it('evaluates pronunciation scores across all score and band brackets', () => {
    // Empty target
    const emptyTarget = calculatePronunciationScore('', '');
    expect(emptyTarget.score).toBe(100);
    expect(emptyTarget.band).toBe(9.0);

    // Empty spoken
    const emptySpoken = calculatePronunciationScore('hello world', '');
    expect(emptySpoken.score).toBe(0);
    expect(emptySpoken.band).toBe(5.0);
    expect(emptySpoken.matchedWords.every(w => w.status === 'missing')).toBe(true);

    // Perfect match (Band 9.0 >= 92)
    const perfect = calculatePronunciationScore('mitigate environmental degradation', 'mitigate environmental degradation');
    expect(perfect.score).toBe(100);
    expect(perfect.band).toBe(9.0);

    // Band 8.5 (score >= 82)
    const band85 = calculatePronunciationScore('comprehensive educational workshops augmented citizen participation', 'comprehensive educational workshop augment citizen participation');
    expect(band85.band).toBeGreaterThanOrEqual(8.0);

    // Exact brackets for 8.0, 7.5, 7.0, 6.5, 6.0, 5.5, 5.0
    // Test word matching with short words and long words
    const res80 = calculatePronunciationScore('one two three four five six seven eight nine ten', 'one two three four five six seven eight');
    expect(res80.band).toBe(8.0);

    const res75 = calculatePronunciationScore('one two three four five six seven eight nine ten', 'one two three four five six');
    expect(res75.band).toBe(7.5);

    const res70 = calculatePronunciationScore('one two three four five six seven eight nine ten', 'one two three four five');
    expect(res70.band).toBe(7.0);

    const res65 = calculatePronunciationScore('one two three four five six seven eight nine ten', 'one two three four');
    expect(res65.band).toBe(6.5);

    const res60 = calculatePronunciationScore('one two three four five six seven eight nine ten', 'one two three');
    expect(res60.band).toBe(6.0);

    const res55 = calculatePronunciationScore('one two three four five six seven eight nine ten', 'one two');
    expect(res55.band).toBe(5.5);

    const res50 = calculatePronunciationScore('one two three four five six seven eight nine ten', 'one');
    expect(res50.band).toBe(5.0);

    // Mispronunciation branch with length <= 5 vs length > 5
    const shortMispronounced = calculatePronunciationScore('cats dogs bird fish', 'cot dog bird fish');
    expect(shortMispronounced.matchedWords.some(w => w.status === 'mispronounced' || w.status === 'correct')).toBe(true);

    const longMispronounced = calculatePronunciationScore('sustainable environment degradation', 'sustainble enviroment degradtion');
    expect(longMispronounced.matchedWords.some(w => w.status === 'mispronounced')).toBe(true);
  });

  it('has valid curated lessons in CURATED_IELTS_LESSONS', () => {
    expect(CURATED_IELTS_LESSONS.length).toBeGreaterThanOrEqual(4);
    for (const curated of CURATED_IELTS_LESSONS) {
      expect(curated.id).toBeTruthy();
      expect(curated.title).toBeTruthy();
      expect(curated.transcript.length).toBeGreaterThan(20);
      expect(curated.keyWords.length).toBeGreaterThan(0);
      expect(curated.targetBand).toBeGreaterThanOrEqual(8.0);
    }
  });
});
