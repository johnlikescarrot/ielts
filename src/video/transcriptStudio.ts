import { ACADEMIC_WORD_LIST } from '../ast/awlList';

export type VideoPlatform = 'youtube' | 'bilibili';

export interface VideoSource {
  platform: VideoPlatform;
  originalUrl: string;
  canonicalUrl: string;
  videoId?: string;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  startSeconds: number;
}

export interface TranscriptVocabulary {
  word: string;
  definition: string;
  definitionVi: string;
  cefr: string;
  sublist: number;
  occurrences: number;
}

export interface ClozeQuestion {
  id: string;
  prompt: string;
  answer: string;
  startSeconds: number;
}

export interface VideoStudyPlan {
  segments: TranscriptSegment[];
  vocabulary: TranscriptVocabulary[];
  clozeQuestions: ClozeQuestion[];
  wordCount: number;
  estimatedStudyMinutes: number;
}

export interface VideoStudySession {
  id: string;
  title: string;
  source: VideoSource;
  transcript: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoStudyInputValidation {
  source?: VideoSource;
  error?: string;
}

const TIMESTAMP_PREFIX = /^\s*\[?((?:\d{1,2}:)?\d{1,2}:\d{2})(?:[.,]\d{1,3})?\]?\s*(.*)$/;
const WORD_PATTERN = /[A-Za-z][A-Za-z'-]*/g;
const NON_CLOZE_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'in', 'is',
  'it', 'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to', 'was', 'were', 'will', 'with',
]);

function getYouTubeId(url: URL): string | undefined {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0];
  }

  if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
    if (url.pathname === '/watch') return url.searchParams.get('v') || undefined;
    const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
    return match?.[1];
  }

  return undefined;
}

function isPlausibleVideoId(value: string | undefined): value is string {
  return !!value && /^[A-Za-z0-9_-]{6,}$/.test(value);
}

export function parseVideoSource(rawUrl: string): VideoSource | undefined {
  const candidate = rawUrl.trim();
  if (!candidate) return undefined;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const youTubeId = getYouTubeId(url);
  if (isPlausibleVideoId(youTubeId)) {
    return {
      platform: 'youtube',
      originalUrl: candidate,
      canonicalUrl: `https://www.youtube.com/watch?v=${youTubeId}`,
      videoId: youTubeId,
    };
  }

  if (host === 'bilibili.com' || host.endsWith('.bilibili.com') || host === 'b23.tv') {
    const videoId = url.pathname.match(/\/video\/(BV[\w-]+)/i)?.[1];
    return {
      platform: 'bilibili',
      originalUrl: candidate,
      canonicalUrl: url.toString(),
      videoId,
    };
  }

  return undefined;
}

export function validateVideoStudyInput(sourceUrl: string, transcript: string): VideoStudyInputValidation {
  const source = parseVideoSource(sourceUrl);
  if (!source) {
    return { error: 'Use a valid YouTube or Bilibili video URL.' };
  }

  if (countWords(transcript) < 20) {
    return { error: 'Paste at least 20 words of captions or transcript text.' };
  }

  return { source };
}

export function parseTimestamp(rawTimestamp: string): number | undefined {
  const values = rawTimestamp.split(':').map(Number);
  if (values.some(value => !Number.isInteger(value) || value < 0)) return undefined;
  if (values.length === 2) {
    const [minutes, seconds] = values;
    return seconds < 60 ? minutes * 60 + seconds : undefined;
  }
  if (values.length === 3) {
    const [hours, minutes, seconds] = values;
    return minutes < 60 && seconds < 60 ? hours * 3600 + minutes * 60 + seconds : undefined;
  }
  return undefined;
}

export function formatTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  const minutePart = String(minutes).padStart(2, '0');
  const secondPart = String(remainder).padStart(2, '0');
  return hours > 0 ? `${hours}:${minutePart}:${secondPart}` : `${minutes}:${secondPart}`;
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map(sentence => sentence.trim())
    .filter(Boolean) || [];
}

export function parseTranscript(transcript: string): TranscriptSegment[] {
  const lines = transcript.replace(/\r\n?/g, '\n').split('\n').map(line => line.trim()).filter(Boolean);
  const segments: TranscriptSegment[] = [];
  let nextStartSeconds = 0;

  lines.forEach((line, lineIndex) => {
    const match = line.match(TIMESTAMP_PREFIX);
    const timestamp = match ? parseTimestamp(match[1]) : undefined;
    const text = (match ? match[2] : line).replace(/\s+/g, ' ').trim();
    if (!text) return;

    const sentenceParts = splitSentences(text);
    const parts = sentenceParts.length > 0 ? sentenceParts : [text];
    const startSeconds = timestamp ?? nextStartSeconds;

    parts.forEach((part, partIndex) => {
      const segmentStart = startSeconds + partIndex * 12;
      segments.push({
        id: `segment-${lineIndex}-${partIndex}`,
        text: part,
        startSeconds: segmentStart,
      });
    });

    nextStartSeconds = startSeconds + Math.max(15, parts.length * 12);
  });

  return segments;
}

export function countWords(text: string): number {
  return text.match(WORD_PATTERN)?.length || 0;
}

function getWordCounts(transcript: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const word of transcript.toLowerCase().match(WORD_PATTERN) || []) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return counts;
}

export function extractAcademicVocabulary(transcript: string, limit = 12): TranscriptVocabulary[] {
  const counts = getWordCounts(transcript);
  return [...counts.entries()]
    .flatMap(([word, occurrences]) => {
      const entry = ACADEMIC_WORD_LIST[word];
      return entry ? [{
        word,
        definition: entry.definition,
        definitionVi: entry.definitionVi,
        cefr: entry.cefr,
        sublist: entry.sublist,
        occurrences,
      }] : [];
    })
    .sort((first, second) => second.occurrences - first.occurrences || first.sublist - second.sublist || first.word.localeCompare(second.word))
    .slice(0, limit);
}

function chooseClozeWord(segment: TranscriptSegment): string | undefined {
  const words = segment.text.toLowerCase().match(WORD_PATTERN) || [];
  const academicWord = words.find(word => !!ACADEMIC_WORD_LIST[word]);
  if (academicWord) return academicWord;

  return words
    .filter(word => word.length >= 6 && !NON_CLOZE_WORDS.has(word))
    .sort((first, second) => second.length - first.length || first.localeCompare(second))[0];
}

function maskWord(text: string, word: string): string {
  return text.replace(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), '_____');
}

export function createClozeQuestions(segments: TranscriptSegment[], limit = 6): ClozeQuestion[] {
  const usedAnswers = new Set<string>();
  const questions: ClozeQuestion[] = [];

  for (const segment of segments) {
    const answer = chooseClozeWord(segment);
    if (countWords(segment.text) < 5 || questions.length >= limit || !answer || usedAnswers.has(answer)) continue;

    usedAnswers.add(answer);
    questions.push({
      id: `cloze-${segment.id}-${answer}`,
      prompt: maskWord(segment.text, answer),
      answer,
      startSeconds: segment.startSeconds,
    });
  }

  return questions;
}

export function buildVideoStudyPlan(transcript: string): VideoStudyPlan {
  const segments = parseTranscript(transcript);
  const wordCount = countWords(transcript);
  return {
    segments,
    vocabulary: extractAcademicVocabulary(transcript),
    clozeQuestions: createClozeQuestions(segments),
    wordCount,
    estimatedStudyMinutes: Math.max(5, Math.ceil(wordCount / 90) + 4),
  };
}

export function buildVideoUrlAtTime(source: VideoSource, seconds: number): string {
  const startSeconds = Math.max(0, Math.floor(seconds));
  const url = new URL(source.canonicalUrl);
  if (source.platform === 'youtube') {
    url.searchParams.set('t', `${startSeconds}s`);
  } else {
    url.searchParams.set('t', String(startSeconds));
  }
  return url.toString();
}
