import type {
  CaptureInput,
  Draft,
  Locale,
  PracticeSession,
  ReviewRating,
  Settings,
  Skill,
  StudyState,
  VocabularyCard,
} from '../types';
import {createSchedule, scheduleReview} from './scheduler';

export function createInitialState(): StudyState {
  return {
    schemaVersion: 1,
    settings: {locale: 'en', targetBand: 7, dailyGoal: 20, theme: 'system'},
    cards: [],
    captures: [],
    sessions: [],
    drafts: [],
  };
}

export function makeId(prefix: string, now: Date, seed: string): string {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${now.getTime().toString(36)}-${(hash >>> 0).toString(36)}`;
}

export function addCard(
  state: StudyState,
  values: {
    term: string;
    meaning: string;
    context?: string;
    sourceTitle?: string;
    sourceUrl?: string;
  },
  now: Date,
): StudyState {
  const term = values.term.trim();
  if (!term) return state;
  const existing = state.cards.find(
    (card) => card.term.toLocaleLowerCase() === term.toLocaleLowerCase(),
  );
  if (existing) return state;
  const card: VocabularyCard = {
    id: makeId('card', now, term),
    term,
    meaning: values.meaning.trim(),
    context: values.context?.trim() ?? '',
    sourceTitle: values.sourceTitle?.trim() ?? '',
    sourceUrl: values.sourceUrl?.trim() ?? '',
    createdAt: now.toISOString(),
    schedule: createSchedule(now),
  };
  return {...state, cards: [card, ...state.cards]};
}

export function addCapture(
  state: StudyState,
  input: CaptureInput,
  now: Date,
): StudyState {
  const text = input.text.replace(/\s+/g, ' ').trim();
  if (!text) return state;
  const sourceUrl = input.sourceUrl?.trim() ?? '';
  const duplicate = state.captures.some(
    (capture) => capture.text === text && capture.sourceUrl === sourceUrl,
  );
  if (duplicate) return state;
  const shouldCreateCard = text.length <= 120;
  const withCard = shouldCreateCard
    ? addCard(
        state,
        {
          term: text,
          meaning: '',
          context: text,
          sourceTitle: input.sourceTitle,
          sourceUrl,
        },
        now,
      )
    : state;
  const card = withCard.cards.find(
    (candidate) =>
      candidate.term.toLocaleLowerCase() === text.toLocaleLowerCase(),
  );
  return {
    ...withCard,
    captures: [
      {
        id: makeId('capture', now, `${sourceUrl}:${text}`),
        text,
        sourceTitle: input.sourceTitle?.trim() ?? '',
        sourceUrl,
        createdAt: now.toISOString(),
        ...(card ? {cardId: card.id} : {}),
      },
      ...withCard.captures,
    ],
  };
}

export function updateCardMeaning(
  state: StudyState,
  id: string,
  meaning: string,
): StudyState {
  return {
    ...state,
    cards: state.cards.map((card) =>
      card.id === id ? {...card, meaning: meaning.trim()} : card,
    ),
  };
}

export function reviewCard(
  state: StudyState,
  id: string,
  rating: ReviewRating,
  now: Date,
): StudyState {
  return {
    ...state,
    cards: state.cards.map((card) =>
      card.id === id
        ? {...card, schedule: scheduleReview(card.schedule, rating, now)}
        : card,
    ),
    sessions: [
      ...state.sessions,
      {
        id: makeId('session', now, `${id}:${rating}`),
        skill: 'vocabulary',
        completedAt: now.toISOString(),
        minutes: 1,
        detail: rating,
      },
    ],
  };
}

export function recordSession(
  state: StudyState,
  skill: Skill,
  minutes: number,
  detail: string,
  now: Date,
): StudyState {
  const session: PracticeSession = {
    id: makeId('session', now, `${skill}:${detail}`),
    skill,
    completedAt: now.toISOString(),
    minutes: Math.max(1, Math.round(minutes)),
    detail: detail.trim(),
  };
  return {...state, sessions: [...state.sessions, session]};
}

export function saveDraft(
  state: StudyState,
  taskId: string,
  body: string,
  checkedCriteria: string[],
  now: Date,
): StudyState {
  const draft: Draft = {
    taskId,
    body,
    checkedCriteria,
    updatedAt: now.toISOString(),
  };
  return {
    ...state,
    drafts: [
      ...state.drafts.filter((candidate) => candidate.taskId !== taskId),
      draft,
    ],
  };
}

export function updateSettings(
  state: StudyState,
  patch: Partial<Settings>,
): StudyState {
  return {...state, settings: {...state.settings, ...patch}};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function importState(value: unknown): StudyState {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error('Unsupported Bandcraft backup');
  }
  const baseline = createInitialState();
  const settings = isRecord(value.settings) ? value.settings : {};
  const locale: Locale = settings.locale === 'vi' ? 'vi' : 'en';
  const targetBand =
    typeof settings.targetBand === 'number'
      ? settings.targetBand
      : baseline.settings.targetBand;
  const dailyGoal =
    typeof settings.dailyGoal === 'number'
      ? settings.dailyGoal
      : baseline.settings.dailyGoal;
  const theme =
    settings.theme === 'light' || settings.theme === 'dark'
      ? settings.theme
      : 'system';
  if (
    !Array.isArray(value.cards) ||
    !Array.isArray(value.captures) ||
    !Array.isArray(value.sessions) ||
    !Array.isArray(value.drafts)
  ) {
    throw new Error('Incomplete Bandcraft backup');
  }
  return {
    schemaVersion: 1,
    settings: {locale, targetBand, dailyGoal, theme},
    cards: value.cards as VocabularyCard[],
    captures: value.captures as StudyState['captures'],
    sessions: value.sessions as PracticeSession[],
    drafts: value.drafts as Draft[],
  };
}
