import type { AppState, Card, CardDraft, Grade, ShadowSession } from './types';

const DAY_MS = 86_400_000;
const MINUTES_10 = 600_000;

export function isGrade(value: number): value is Grade {
  return value >= 1 && value <= 4 && Number.isInteger(value);
}

export function addCard(state: AppState, draft: CardDraft, now: Date): AppState {
  const front = draft.front.trim();
  const back = draft.back.trim();
  if (!front || !back) {
    return state;
  }

  const card: Card = {
    id: createId(front, now),
    front,
    back,
    context: draft.context.trim(),
    tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
    createdAt: now.toISOString(),
    dueAt: now.toISOString(),
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    state: 'new'
  };

  return { ...state, cards: [...state.cards, card] };
}

export function dueCards(cards: Card[], now: Date): Card[] {
  const nowTime = now.getTime();
  return cards
    .filter((card) => new Date(card.dueAt).getTime() <= nowTime)
    .sort((left, right) => {
      const leftTime = new Date(left.dueAt).getTime();
      const rightTime = new Date(right.dueAt).getTime();
      return leftTime - rightTime || left.front.localeCompare(right.front);
    });
}

export function gradeCard(state: AppState, cardId: string, grade: Grade, now: Date): AppState {
  const card = state.cards.find((item) => item.id === cardId);
  if (!card) {
    return state;
  }

  const updated = schedule(card, grade, now);
  return {
    ...state,
    cards: state.cards.map((item) => (item.id === cardId ? updated : item)),
    reviews: [
      ...state.reviews,
      { cardId, grade, reviewedAt: now.toISOString(), nextDueAt: updated.dueAt }
    ]
  };
}

export function schedule(card: Card, grade: Grade, now: Date): Card {
  if (grade === 1) {
    return {
      ...card,
      dueAt: new Date(now.getTime() + MINUTES_10).toISOString(),
      intervalDays: 0,
      repetitions: 0,
      lapses: card.lapses + 1,
      state: 'learning'
    };
  }

  const firstSuccessfulReview = card.repetitions === 0;
  const baseInterval = firstSuccessfulReview ? 1 : Math.max(1, card.intervalDays);
  const multiplier = grade === 2 ? 1.2 : grade === 3 ? 2.5 : 4;
  const intervalDays = Math.max(1, Math.round(baseInterval * multiplier));

  return {
    ...card,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
    intervalDays,
    repetitions: card.repetitions + 1,
    state: 'review'
  };
}

export function markShadowOutcome(
  state: AppState,
  cardId: string,
  outcome: ShadowSession['outcome'],
  now: Date
): AppState {
  if (!state.cards.some((card) => card.id === cardId)) {
    return state;
  }

  const session: ShadowSession = {
    id: `shadow-${now.getTime()}-${cardId}`,
    cardId,
    outcome,
    createdAt: now.toISOString()
  };
  return { ...state, shadowSessions: [...state.shadowSessions, session] };
}

export function updateSettings(state: AppState, update: Partial<AppState['settings']>): AppState {
  const dailyGoal = update.dailyGoal;
  const normalisedGoal =
    typeof dailyGoal === 'number' && Number.isFinite(dailyGoal)
      ? Math.min(100, Math.max(1, Math.round(dailyGoal)))
      : state.settings.dailyGoal;

  return {
    ...state,
    settings: { ...state.settings, ...update, dailyGoal: normalisedGoal }
  };
}

export function todayReviewCount(state: AppState, now: Date): number {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return state.reviews.filter((review) => new Date(review.reviewedAt).getTime() >= dayStart).length;
}

export function progressPercent(state: AppState, now: Date): number {
  return Math.min(100, Math.round((todayReviewCount(state, now) / state.settings.dailyGoal) * 100));
}

function createId(front: string, now: Date): string {
  const cleanFront = front
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${cleanFront || 'card'}-${now.getTime()}`;
}
