import { isLocale } from './state';
import { safeHttpUrl } from './text';
import type {
  AppState,
  CardSource,
  PracticeCard,
  ReviewEvent,
  Settings,
  Skill,
  StoredSchedule,
} from './types';

export interface ExportBundle {
  format: 'ielts-forge';
  version: 1;
  exportedAt: string;
  state: AppState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === 'string';
}

function isDateString(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isSkill(value: unknown): value is Skill {
  return ['reading', 'listening', 'writing', 'speaking'].includes(value as string);
}

function isSettings(value: unknown): value is Settings {
  return (
    isRecord(value) &&
    isLocale(value.locale) &&
    typeof value.dailyGoal === 'number' &&
    Number.isInteger(value.dailyGoal) &&
    value.dailyGoal > 0 &&
    value.dailyGoal <= 200
  );
}

function isSource(value: unknown): value is CardSource | null {
  return (
    value === null ||
    (isRecord(value) &&
      hasString(value, 'title') &&
      hasString(value, 'url') &&
      (value.url === '' || safeHttpUrl(value.url as string) !== ''))
  );
}

function isSchedule(value: unknown): value is StoredSchedule {
  if (!isRecord(value) || !isDateString(value.due)) return false;
  const numberKeys = [
    'stability',
    'difficulty',
    'elapsedDays',
    'scheduledDays',
    'learningSteps',
    'reps',
    'lapses',
    'state',
  ] as const;
  const numbersAreValid = numberKeys.every(
    (key) => typeof value[key] === 'number' && Number.isFinite(value[key]),
  );
  const lastReviewIsValid = value.lastReview === undefined || isDateString(value.lastReview);
  return numbersAreValid && lastReviewIsValid;
}

function isCard(value: unknown): value is PracticeCard {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'prompt') &&
    hasString(value, 'answer') &&
    hasString(value, 'context') &&
    isSkill(value.skill) &&
    isSource(value.source) &&
    isDateString(value.createdAt) &&
    isSchedule(value.schedule)
  );
}

function isReview(value: unknown): value is ReviewEvent {
  return (
    isRecord(value) &&
    hasString(value, 'id') &&
    hasString(value, 'cardId') &&
    [1, 2, 3, 4].includes(value.rating as number) &&
    isDateString(value.reviewedAt) &&
    isDateString(value.nextDue)
  );
}

export function isAppState(value: unknown): value is AppState {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    isSettings(value.settings) &&
    Array.isArray(value.cards) &&
    value.cards.every(isCard) &&
    Array.isArray(value.reviews) &&
    value.reviews.every(isReview)
  );
}

export function exportState(state: AppState, now: Date): string {
  const bundle: ExportBundle = {
    format: 'ielts-forge',
    version: 1,
    exportedAt: now.toISOString(),
    state,
  };
  return JSON.stringify(bundle, null, 2);
}

export function importState(serialized: string): AppState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    throw new Error('This is not valid JSON.');
  }

  if (
    !isRecord(parsed) ||
    parsed.format !== 'ielts-forge' ||
    parsed.version !== 1 ||
    !isAppState(parsed.state)
  ) {
    throw new Error('This is not a valid IELTS Forge backup.');
  }
  return parsed.state;
}
