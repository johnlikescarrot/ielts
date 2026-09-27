import { applyRating, createSchedule } from './scheduler';
import { cardFingerprint, normalizeText, safeHttpUrl } from './text';
import type {
  AppState,
  CaptureInput,
  Locale,
  PracticeCard,
  ReviewEvent,
  ReviewRating,
  Settings,
} from './types';

export function createInitialState(): AppState {
  return {
    schemaVersion: 1,
    settings: { locale: 'en', dailyGoal: 20 },
    cards: [],
    reviews: [],
  };
}

export function createCard(input: CaptureInput, now: Date, id: string): PracticeCard {
  const prompt = normalizeText(input.prompt, 160);
  if (prompt === '') throw new Error('A word, phrase, or prompt is required.');

  const sourceTitle = normalizeText(input.source?.title ?? '', 160);
  const sourceUrl = safeHttpUrl(input.source?.url ?? '');

  return {
    id,
    prompt,
    answer: normalizeText(input.answer ?? '', 500),
    context: normalizeText(input.context ?? '', 500),
    skill: input.skill ?? 'reading',
    source: sourceTitle === '' && sourceUrl === '' ? null : { title: sourceTitle, url: sourceUrl },
    createdAt: now.toISOString(),
    schedule: createSchedule(now),
  };
}

export interface AddCardResult {
  state: AppState;
  card: PracticeCard;
  added: boolean;
}

export function addCard(state: AppState, card: PracticeCard): AddCardResult {
  const fingerprint = cardFingerprint(card.prompt, card.context, card.source?.url ?? '');
  const existing = state.cards.find(
    (candidate) =>
      cardFingerprint(candidate.prompt, candidate.context, candidate.source?.url ?? '') ===
      fingerprint,
  );

  return existing === undefined
    ? { state: { ...state, cards: [...state.cards, card] }, card, added: true }
    : { state, card: existing, added: false };
}

export function removeCard(state: AppState, cardId: string): AppState {
  return {
    ...state,
    cards: state.cards.filter((card) => card.id !== cardId),
    reviews: state.reviews.filter((review) => review.cardId !== cardId),
  };
}

export function reviewCard(
  state: AppState,
  cardId: string,
  rating: ReviewRating,
  now: Date,
  reviewId: string,
): AppState {
  const card = state.cards.find((candidate) => candidate.id === cardId);
  if (card === undefined) throw new Error('Card not found.');

  const schedule = applyRating(card.schedule, rating, now);
  const review: ReviewEvent = {
    id: reviewId,
    cardId,
    rating,
    reviewedAt: now.toISOString(),
    nextDue: schedule.due,
  };

  return {
    ...state,
    cards: state.cards.map((candidate) =>
      candidate.id === cardId ? { ...candidate, schedule } : candidate,
    ),
    reviews: [...state.reviews, review],
  };
}

export function updateSettings(state: AppState, update: Partial<Settings>): AppState {
  return { ...state, settings: { ...state.settings, ...update } };
}

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'vi';
}
