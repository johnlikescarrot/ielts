import type {PracticeSession, SubtitleCue, VocabularyCard} from '../types';

export function countWords(text: string): number {
  return (
    text.trim().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0
  );
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function dueCards(cards: VocabularyCard[], now: Date): VocabularyCard[] {
  return cards
    .filter((card) => new Date(card.schedule.due).getTime() <= now.getTime())
    .sort((left, right) => left.schedule.due.localeCompare(right.schedule.due));
}

export function practiceStreak(sessions: PracticeSession[], now: Date): number {
  const activeDays = new Set(
    sessions.map((session) => session.completedAt.slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);
  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function compareTempo(
  referenceSeconds: number,
  attemptSeconds: number,
): 'shorter' | 'close' | 'longer' | 'unknown' {
  if (referenceSeconds <= 0 || attemptSeconds <= 0) return 'unknown';
  const ratio = attemptSeconds / referenceSeconds;
  if (ratio < 0.88) return 'shorter';
  if (ratio > 1.12) return 'longer';
  return 'close';
}

function timestampToSeconds(value: string): number | undefined {
  const normalized = value.replace(',', '.');
  const pieces = normalized.split(':').map(Number);
  if (pieces.some(Number.isNaN) || (pieces.length !== 2 && pieces.length !== 3))
    return undefined;
  const [hours, minutes, seconds] =
    pieces.length === 3 ? pieces : [0, ...pieces];
  return hours * 3600 + minutes * 60 + seconds;
}

export function parseSubtitles(raw: string): SubtitleCue[] {
  const normalized = raw.replace(/\r/g, '').trim();
  if (!normalized) return [];
  return normalized
    .replace(/^WEBVTT[^\n]*\n+/, '')
    .split(/\n{2,}/)
    .map((block, index) => {
      const lines = block.split('\n');
      const timingIndex = lines.findIndex((line) => line.includes('-->'));
      if (timingIndex < 0) return undefined;
      const timingParts = lines[timingIndex]
        .split('-->')
        .map((part) => part.trim());
      const startRaw = timingParts[0];
      const endRaw = timingParts[1].split(/\s+/)[0];
      const start = timestampToSeconds(startRaw);
      const end = timestampToSeconds(endRaw);
      const text = lines
        .slice(timingIndex + 1)
        .join(' ')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (start === undefined || end === undefined || end <= start || !text)
        return undefined;
      return {id: `cue-${index + 1}`, start, end, text};
    })
    .filter((cue): cue is SubtitleCue => cue !== undefined);
}

export function cueAt(
  cues: SubtitleCue[],
  seconds: number,
): SubtitleCue | undefined {
  return cues.find((cue) => seconds >= cue.start && seconds < cue.end);
}
