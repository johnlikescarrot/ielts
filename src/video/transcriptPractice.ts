import { ACADEMIC_WORD_LIST } from '../ast/awlList';
import { VocabularyItem } from '../types';
import {
  CreateVideoPracticeSessionInput,
  PracticeProgress,
  TranscriptCue,
  VideoPracticeQuestion,
  VideoPracticeSession,
  VideoPracticeStats,
} from './types';

const MAX_TRANSCRIPT_LENGTH = 60_000;
const WORD_PATTERN = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
const TIMECODE_PATTERN = /^(?:(\d{1,2}):)?(\d{2}):(\d{2})(?:[.,](\d{1,3}))?$/;
const TIMELINE_PATTERN = /^(.+?)\s+-->\s+([^\s]+)(?:\s+.*)?$/;
const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'also',
  'although',
  'among',
  'another',
  'because',
  'before',
  'being',
  'between',
  'could',
  'every',
  'first',
  'from',
  'have',
  'into',
  'other',
  'should',
  'that',
  'their',
  'there',
  'these',
  'those',
  'through',
  'under',
  'using',
  'which',
  'while',
  'would',
  'with',
  'where',
  'when',
  'what',
  'will',
  'than',
  'then',
  'they',
  'this',
  'were',
  'your',
  'some',
  'more',
  'such',
]);

interface WordCandidate {
  raw: string;
  normalized: string;
  index: number;
  score: number;
}

function normalizedWord(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/^'+|'+$/g, '');
}

function extractWords(text: string): string[] {
  return Array.from(text.matchAll(WORD_PATTERN), (match) => match[0]);
}

function sentenceCues(text: string): TranscriptCue[] {
  const cleanText = stripCueMarkup(text.replace(/^WEBVTT[^\n]*\n?/im, ''));
  return Array.from(cleanText.matchAll(/[^.!?]+[.!?]+|[^.!?]+$/g), (match) => match[0])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .map((sentence, index) => ({ id: `plain-${index + 1}`, text: sentence }));
}

function hasDuplicateText(cues: TranscriptCue[], text: string): boolean {
  const normalized = text.toLocaleLowerCase();
  return cues.some((cue) => cue.text.toLocaleLowerCase() === normalized);
}

function createStableId(seed: string): string {
  let hash = 5381;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function selectGapWord(text: string): WordCandidate | undefined {
  const matches = Array.from(text.matchAll(WORD_PATTERN));
  const candidates = matches
    .map((match): WordCandidate | undefined => {
      const raw = match[0];
      const normalized = normalizedWord(raw);
      if (normalized.length < 5 || STOP_WORDS.has(normalized)) {
        return undefined;
      }

      const academicEntry = ACADEMIC_WORD_LIST[normalized];
      const score = (academicEntry ? 100 : 0) + Math.min(normalized.length, 15);
      return { raw, normalized, index: match.index, score };
    })
    .filter((candidate): candidate is WordCandidate => candidate !== undefined)
    .sort((left, right) => right.score - left.score || left.index - right.index);

  return candidates[0];
}

function createQuestion(cue: TranscriptCue, number: number): VideoPracticeQuestion | undefined {
  const target = selectGapWord(cue.text);
  if (!target) {
    return undefined;
  }

  const entry = ACADEMIC_WORD_LIST[target.normalized];
  return {
    id: `gap-${number}-${cue.id}`,
    cueId: cue.id,
    sourceText: cue.text,
    clozeText: `${cue.text.slice(0, target.index)}_____${cue.text.slice(target.index + target.raw.length)}`,
    answer: target.raw,
    academicWord: entry
      ? {
          sublist: entry.sublist,
          definitionEn: entry.definition,
          definitionVi: entry.definitionVi,
        }
      : undefined,
    timestampSeconds: cue.startSeconds,
  };
}

function buildStats(cues: TranscriptCue[]): VideoPracticeStats {
  const words = cues.flatMap((cue) => extractWords(cue.text));
  const normalizedWords = words.map(normalizedWord).filter(Boolean);
  return {
    cueCount: cues.length,
    wordCount: words.length,
    uniqueWordCount: new Set(normalizedWords).size,
    academicWordCount: normalizedWords.filter((word) => Boolean(ACADEMIC_WORD_LIST[word])).length,
    estimatedMinutes: words.length === 0 ? 0 : Math.max(1, Math.ceil(words.length / 150)),
  };
}

export function getTranscriptStats(transcript: string): VideoPracticeStats {
  return buildStats(parseTranscript(transcript));
}

export function parseTimestamp(value: string): number | undefined {
  const match = value.trim().match(TIMECODE_PATTERN);
  if (!match) {
    return undefined;
  }

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const milliseconds = Number((match[4] || '').padEnd(3, '0'));
  if (minutes >= 60 || seconds >= 60) {
    return undefined;
  }

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

export function stripCueMarkup(value: string): string {
  let text = '';
  let insideTag = false;

  for (const character of value) {
    if (character === '<') {
      insideTag = true;
    } else if (character === '>') {
      if (insideTag) {
        insideTag = false;
      } else {
        text += character;
      }
    } else if (!insideTag) {
      text += character;
    }
  }

  return text.replace(/\s+/g, ' ').trim();
}

export function parseTranscript(transcript: string): TranscriptCue[] {
  const blocks = transcript.replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  const timedCues: TranscriptCue[] = [];

  blocks.forEach((block) => {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0 || /^(WEBVTT|NOTE|STYLE|REGION)\b/i.test(lines[0])) {
      return;
    }

    const timelineIndex = lines.findIndex((line) => TIMELINE_PATTERN.test(line));
    if (timelineIndex < 0) {
      return;
    }

    const timeline = lines[timelineIndex].match(TIMELINE_PATTERN)!;
    const startSeconds = parseTimestamp(timeline[1]);
    const endSeconds = parseTimestamp(timeline[2]);
    const text = stripCueMarkup(lines.slice(timelineIndex + 1).join(' '));
    if (startSeconds === undefined || endSeconds === undefined || !text || hasDuplicateText(timedCues, text)) {
      return;
    }

    timedCues.push({
      id: `cue-${timedCues.length + 1}`,
      startSeconds,
      endSeconds,
      text,
    });
  });

  return timedCues.length > 0 ? timedCues : sentenceCues(transcript);
}

export function validateTranscriptInput(transcript: string): string | undefined {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return 'Add at least one sentence from a transcript.';
  }
  if (trimmed.length > MAX_TRANSCRIPT_LENGTH) {
    return 'Keep the transcript under 60,000 characters.';
  }
  return undefined;
}

export function normalizeAnswer(answer: string): string {
  return normalizedWord(answer).replace(/[^a-z0-9']/g, '');
}

export function verifyAnswer(expected: string, actual: string): boolean {
  return normalizeAnswer(expected) === normalizeAnswer(actual);
}

export function createVideoPracticeSession(input: CreateVideoPracticeSessionInput): VideoPracticeSession {
  const validationError = validateTranscriptInput(input.transcript);
  if (validationError) {
    throw new Error(validationError);
  }

  const cues = parseTranscript(input.transcript);
  const questionLimit = Math.max(1, Math.floor(input.questionLimit ?? 8));
  const usedAnswers = new Set<string>();
  const questions = cues.flatMap((cue) => {
    const question = createQuestion(cue, usedAnswers.size + 1);
    if (!question || usedAnswers.has(normalizeAnswer(question.answer)) || usedAnswers.size >= questionLimit) {
      return [];
    }
    usedAnswers.add(normalizeAnswer(question.answer));
    return [question];
  });

  if (questions.length === 0) {
    throw new Error('This transcript does not contain enough usable vocabulary for a gap-fill practice set.');
  }

  const title = input.title.trim() || 'Untitled video transcript';
  const sourceUrl = input.sourceUrl?.trim();
  const createdAt = input.createdAt || new Date().toISOString();
  return {
    id: `video-${createStableId(`${title}|${input.transcript}`)}`,
    title,
    sourceUrl: sourceUrl || undefined,
    createdAt,
    cues,
    questions,
    stats: buildStats(cues),
  };
}

export function getPracticeProgress(
  questions: VideoPracticeQuestion[],
  answers: Record<string, string>,
): PracticeProgress {
  const answeredQuestions = questions.filter((question) => answers[question.id]?.trim());
  const correct = answeredQuestions.filter((question) => verifyAnswer(question.answer, answers[question.id])).length;
  return {
    answered: answeredQuestions.length,
    correct,
    total: questions.length,
    accuracyPercent: answeredQuestions.length === 0 ? 0 : Math.round((correct / answeredQuestions.length) * 100),
  };
}

export function createVocabularyFromQuestion(question: VideoPracticeQuestion): VocabularyItem | undefined {
  if (!question.academicWord) {
    return undefined;
  }

  const cefrLevel = question.academicWord.sublist >= 7 ? 'C2' : question.academicWord.sublist >= 4 ? 'C1' : 'B2';
  return {
    id: `video-vocab-${normalizeAnswer(question.answer)}`,
    word: question.answer,
    phonetic: '',
    partOfSpeech: 'Academic vocabulary',
    definitionEn: question.academicWord.definitionEn,
    definitionVi: question.academicWord.definitionVi,
    example: question.sourceText,
    collocations: [],
    synonyms: [],
    topic: 'Video transcript',
    bandScore: question.academicWord.sublist <= 2 ? 7 : question.academicWord.sublist <= 5 ? 7.5 : 8,
    cefrLevel,
    isAWL: true,
  };
}
