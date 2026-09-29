import { ACADEMIC_WORD_LIST } from '../ast/awlList';
import { INITIAL_VOCABULARY } from '../data/vocabularyBank';

const VOCAB_MAP = new Map(INITIAL_VOCABULARY.map(v => [v.word.toLowerCase(), v]));

export interface TranscriptCue {
  id: string;
  startSeconds: number;
  text: string;
}

export interface VideoVocabulary {
  word: string;
  definitionEn: string;
  definitionVi: string;
  cefr: string;
  band: number;
}

export interface ClozeQuestion {
  id: string;
  cueId: string;
  startSeconds: number;
  prompt: string;
  cueText: string;
  answer: string;
  hint: string;
}

export interface VideoLesson {
  cues: TranscriptCue[];
  questions: ClozeQuestion[];
  vocabulary: VideoVocabulary[];
  wordCount: number;
  durationSeconds: number;
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'because', 'before', 'being', 'between',
  'could', 'during', 'every', 'first', 'from', 'have', 'into', 'other', 'should',
  'their', 'there', 'these', 'those', 'through', 'under', 'very', 'where', 'which',
  'while', 'with', 'would', 'your',
]);

export const MAX_TRANSCRIPT_CHARACTERS = 100_000;

const TIME_PATTERN = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,]\d{1,3})?$/;

export function timestampToSeconds(timestamp: string): number | null {
  const match = timestamp.trim().match(TIME_PATTERN);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function stripAngleMarkup(text: string): string {
  let result = '';
  let insideTag = false;
  for (const character of text) {
    if (character === '<') {
      insideTag = true;
    } else if (character === '>') {
      insideTag = false;
    } else if (!insideTag) {
      result += character;
    }
  }
  return result;
}

function cleanCaption(text: string): string {
  return stripAngleMarkup(text)
    .replace(/\{\\[^}]+}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseTranscript(input: string): TranscriptCue[] {
  const lines = input.slice(0, MAX_TRANSCRIPT_CHARACTERS).replace(/\r/g, '').split('\n');
  const cues: TranscriptCue[] = [];
  let pendingTime: number | null = null;

  const addCue = (startSeconds: number, rawText: string) => {
    const text = cleanCaption(rawText);
    if (!text) return;
    const previous = cues[cues.length - 1];
    if (previous && previous.startSeconds === startSeconds) {
      previous.text = `${previous.text} ${text}`;
      return;
    }
    cues.push({ id: `cue-${cues.length + 1}`, startSeconds, text });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || /^\d+$/.test(line)) continue;

    const srtRange = line.match(/^(\d{1,2}:\d{2}:\d{2}(?:[.,]\d{1,3})?)\s*-->/);
    if (srtRange) {
      pendingTime = timestampToSeconds(srtRange[1]);
      continue;
    }

    const prefixed = line.match(/^\[?((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\]?\s*[-–—]?\s*(.*)$/);
    if (prefixed) {
      const seconds = timestampToSeconds(prefixed[1]);
      if (seconds !== null && prefixed[2]) {
        addCue(seconds, prefixed[2]);
        pendingTime = null;
      } else {
        pendingTime = seconds;
      }
      continue;
    }

    const estimatedTime = pendingTime ?? (cues.length === 0 ? 0 : cues[cues.length - 1].startSeconds + 8);
    addCue(estimatedTime, line);
    pendingTime = null;
  }

  return cues;
}

function wordsIn(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:['’-][a-z]+)*/g) ?? [];
}

export function cefrToBand(cefr: string): number {
  if (cefr === 'C2') return 8.5;
  if (cefr === 'C1') return 7.5;
  return 6.5;
}

function lookupVocabulary(word: string): VideoVocabulary | null {
  const bankEntry = VOCAB_MAP.get(word.toLowerCase());
  if (bankEntry) {
    return {
      word: bankEntry.word,
      definitionEn: bankEntry.definitionEn,
      definitionVi: bankEntry.definitionVi,
      cefr: bankEntry.cefrLevel,
      band: bankEntry.bandScore,
    };
  }

  const academicEntry = ACADEMIC_WORD_LIST[word];
  if (!academicEntry) return null;
  return {
    word,
    definitionEn: academicEntry.definition,
    definitionVi: academicEntry.definitionVi,
    cefr: academicEntry.cefr,
    band: cefrToBand(academicEntry.cefr),
  };
}

function replaceWord(text: string, answer: string): string {
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`\\b${escaped}\\b`, 'i'), '_____');
}

export function createVideoLesson(input: string, questionLimit = 8): VideoLesson {
  const cues = parseTranscript(input);
  const vocabulary: VideoVocabulary[] = [];
  const seenVocabulary = new Set<string>();
  const candidates: { cue: TranscriptCue; answer: string }[] = [];
  let wordCount = 0;

  for (const cue of cues) {
    const words = wordsIn(cue.text);
    wordCount += words.length;

    let bestAnswer = '';
    let hasBestAcademic = false;
    let bestLength = 0;
    const seenInCue = new Set<string>();

    for (const word of words) {
      if (!seenInCue.has(word)) {
        seenInCue.add(word);

        if (vocabulary.length < 10 && !seenVocabulary.has(word)) {
          const entry = lookupVocabulary(word);
          if (entry) {
            vocabulary.push(entry);
            seenVocabulary.add(word);
          }
        }

        if (word.length >= 6 && !STOP_WORDS.has(word)) {
          const isAcademic = Boolean(lookupVocabulary(word));
          if (isAcademic && !hasBestAcademic) {
            bestAnswer = word;
            hasBestAcademic = true;
            bestLength = word.length;
          } else if (isAcademic === hasBestAcademic) {
            if (word.length > bestLength) {
              bestAnswer = word;
              bestLength = word.length;
            }
          }
        }
      }
    }

    if (bestAnswer) {
      candidates.push({ cue, answer: bestAnswer });
    }
  }

  const requestedLimit = Number.isFinite(questionLimit) ? Math.floor(questionLimit) : 8;
  const safeLimit = Math.max(1, Math.min(12, requestedLimit));
  const stride = candidates.length > safeLimit ? candidates.length / safeLimit : 1;
  const selected = Array.from(
    { length: Math.min(safeLimit, candidates.length) },
    (_, index) => candidates[Math.floor(index * stride)],
  );

  const questions = selected.map(({ cue, answer }, index) => ({
    id: `cloze-${index + 1}`,
    cueId: cue.id,
    startSeconds: cue.startSeconds,
    prompt: replaceWord(cue.text, answer),
    cueText: cue.text,
    answer,
    hint: `${answer[0].toUpperCase()} • ${answer.length} letters`,
  }));

  return {
    cues,
    questions,
    vocabulary,
    wordCount,
    durationSeconds: cues.length > 0 ? cues[cues.length - 1].startSeconds : 0,
  };
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/[^a-z0-9'-]/g, '');
}

export function scoreLesson(questions: ClozeQuestion[], answers: Record<string, string>): number {
  return questions.reduce(
    (score, question) => score + Number(normalizeAnswer(answers[question.id] ?? '') === normalizeAnswer(question.answer)),
    0,
  );
}

export function formatTimestamp(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function getYouTubeVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0]?.slice(0, 11) || null;
    if (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
      const pathId = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1];
      return pathId ?? url.searchParams.get('v')?.slice(0, 11) ?? null;
    }
  } catch {
    return null;
  }
  return null;
}
