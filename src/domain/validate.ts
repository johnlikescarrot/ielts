import { createInitialState } from './seed';
import { DEFAULT_SETTINGS, STATE_VERSION, type AppState, type Card } from './types';

function isCard(value: unknown): value is Card {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const card = value as Partial<Card>;
  return (
    typeof card.id === 'string' &&
    typeof card.front === 'string' &&
    typeof card.back === 'string' &&
    typeof card.context === 'string' &&
    Array.isArray(card.tags) &&
    typeof card.createdAt === 'string' &&
    typeof card.dueAt === 'string' &&
    typeof card.intervalDays === 'number' &&
    typeof card.repetitions === 'number' &&
    typeof card.lapses === 'number' &&
    (card.state === 'new' || card.state === 'learning' || card.state === 'review')
  );
}

export function parseState(value: unknown): AppState | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<AppState>;
  if (
    candidate.version !== STATE_VERSION ||
    !Array.isArray(candidate.cards) ||
    !candidate.cards.every(isCard)
  ) {
    return null;
  }

  const fallback = createInitialState();
  return {
    version: STATE_VERSION,
    cards: candidate.cards,
    reviews: Array.isArray(candidate.reviews) ? candidate.reviews : [],
    shadowSessions: Array.isArray(candidate.shadowSessions) ? candidate.shadowSessions : [],
    settings: { ...DEFAULT_SETTINGS, ...fallback.settings, ...candidate.settings }
  };
}
