import { TranscriptCue } from './videoLesson';

export const DEFAULT_SHADOWING_CHUNK_SECONDS = 12;
export const MIN_SHADOWING_CHUNK_SECONDS = 3;
export const MAX_SHADOWING_CHUNK_SECONDS = 120;
export const SHADOWING_CHUNK_PRESETS = [8, 12, 20, 30] as const;
export const SHADOWING_RATE_PRESETS = [0.75, 0.9, 1, 1.15] as const;

interface ShadowingOptions {
  chunkSeconds?: number;
  replayCount?: number;
}

export interface ShadowingSegment {
  id: string;
  index: number;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  cueIds: string[];
  text: string;
  wordCount: number;
  focusWords: string[];
}

export interface ShadowingPlan {
  segments: ShadowingSegment[];
  chunkSeconds: number;
  replayCount: number;
  totalWords: number;
  totalDurationSeconds: number;
  averageWordsPerSegment: number;
  recommendedPauseSeconds: number;
}

export interface ShadowingProgress {
  completedCount: number;
  totalCount: number;
  percent: number;
  nextSegmentId: string | null;
  isFinished: boolean;
}

const SHADOWING_STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'being', 'between', 'during',
  'every', 'first', 'however', 'their', 'there', 'these', 'those', 'through', 'which',
  'while', 'would', 'could', 'should', 'where', 'with', 'from', 'into', 'that', 'this',
]);

function wordsIn(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:['’-][a-z]+)*/g) ?? [];
}

function clampWholeNumber(value: number | undefined, fallback: number, min: number, max: number): number {
  const numericValue = Number.isFinite(value) ? Math.floor(value as number) : fallback;
  return Math.max(min, Math.min(max, numericValue));
}

export function normalizeChunkSeconds(value: number | undefined): number {
  return clampWholeNumber(
    value,
    DEFAULT_SHADOWING_CHUNK_SECONDS,
    MIN_SHADOWING_CHUNK_SECONDS,
    MAX_SHADOWING_CHUNK_SECONDS,
  );
}

export function normalizeReplayCount(value: number | undefined): number {
  return clampWholeNumber(value, 2, 1, 5);
}

function estimateCueDuration(text: string): number {
  const wordCount = wordsIn(text).length;
  return Math.max(3, Math.min(12, Math.ceil(wordCount / 2.5)));
}

function compactSegmentText(cues: TranscriptCue[]): string {
  return cues
    .map(cue => cue.text.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function selectFocusWords(text: string, limit = 3): string[] {
  const selected: string[] = [];
  const seen = new Set<string>();
  for (const word of wordsIn(text)) {
    if (selected.length >= limit) break;
    if (word.length < 6 || SHADOWING_STOP_WORDS.has(word) || seen.has(word)) continue;
    seen.add(word);
    selected.push(word);
  }
  return selected;
}

function createSegment(
  cues: TranscriptCue[],
  index: number,
  nextCueStartSeconds: number | null,
  chunkSeconds: number,
): ShadowingSegment {
  const text = compactSegmentText(cues);
  const firstCue = cues[0];
  const lastCue = cues[cues.length - 1];
  const naturalEnd = nextCueStartSeconds ?? lastCue.startSeconds + estimateCueDuration(lastCue.text);
  const cappedEnd = Math.min(naturalEnd, firstCue.startSeconds + chunkSeconds);
  const endSeconds = Math.max(firstCue.startSeconds + 1, cappedEnd);
  const wordCount = wordsIn(text).length;

  return {
    id: `shadow-${index + 1}`,
    index,
    startSeconds: firstCue.startSeconds,
    endSeconds,
    durationSeconds: endSeconds - firstCue.startSeconds,
    cueIds: cues.map(cue => cue.id),
    text,
    wordCount,
    focusWords: selectFocusWords(text),
  };
}

export function createShadowingPlan(cues: TranscriptCue[], options: ShadowingOptions = {}): ShadowingPlan {
  const chunkSeconds = normalizeChunkSeconds(options.chunkSeconds);
  const replayCount = normalizeReplayCount(options.replayCount);
  const sortedCues = cues
    .filter(cue => cue.text.trim())
    .slice()
    .sort((a, b) => a.startSeconds - b.startSeconds || a.id.localeCompare(b.id));

  if (sortedCues.length === 0) {
    return {
      segments: [],
      chunkSeconds,
      replayCount,
      totalWords: 0,
      totalDurationSeconds: 0,
      averageWordsPerSegment: 0,
      recommendedPauseSeconds: 3,
    };
  }

  const groups: TranscriptCue[][] = [];
  let currentGroup: TranscriptCue[] = [];
  let groupStartSeconds = sortedCues[0].startSeconds;

  for (const cue of sortedCues) {
    const shouldStartNextGroup = currentGroup.length > 0 && cue.startSeconds - groupStartSeconds >= chunkSeconds;
    if (shouldStartNextGroup) {
      groups.push(currentGroup);
      currentGroup = [];
      groupStartSeconds = cue.startSeconds;
    }
    currentGroup.push(cue);
  }

  groups.push(currentGroup);

  const segments = groups.map((group, index) => {
    const nextGroup = groups[index + 1];
    return createSegment(group, index, nextGroup ? nextGroup[0].startSeconds : null, chunkSeconds);
  });
  const totalWords = segments.reduce((sum, segment) => sum + segment.wordCount, 0);
  const averageWordsPerSegment = Math.round((totalWords / segments.length) * 10) / 10;
  const recommendedPauseSeconds = Math.max(3, Math.min(20, Math.ceil(averageWordsPerSegment / 2.4)));

  return {
    segments,
    chunkSeconds,
    replayCount,
    totalWords,
    totalDurationSeconds: segments[segments.length - 1].endSeconds,
    averageWordsPerSegment,
    recommendedPauseSeconds,
  };
}

export function getShadowingProgress(plan: ShadowingPlan, completedSegmentIds: string[]): ShadowingProgress {
  const completed = new Set(completedSegmentIds);
  const completedCount = plan.segments.filter(segment => completed.has(segment.id)).length;
  const totalCount = plan.segments.length;
  const nextSegmentId = plan.segments.find(segment => !completed.has(segment.id))?.id ?? null;
  return {
    completedCount,
    totalCount,
    percent: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
    nextSegmentId,
    isFinished: totalCount > 0 && completedCount === totalCount,
  };
}

export function moveShadowingIndex(plan: ShadowingPlan, currentIndex: number, delta: number): number {
  if (plan.segments.length === 0) return 0;
  const safeCurrent = Number.isFinite(currentIndex) ? Math.floor(currentIndex) : 0;
  const safeDelta = Number.isFinite(delta) ? Math.floor(delta) : 0;
  return Math.max(0, Math.min(plan.segments.length - 1, safeCurrent + safeDelta));
}

export function createYouTubeTimestampUrl(videoId: string | null, seconds: number): string | null {
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `https://www.youtube.com/watch?v=${videoId}&t=${safeSeconds}s`;
}
