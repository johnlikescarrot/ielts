export const STATE_VERSION = 1 as const;

export type Locale = 'en' | 'vi';
export type ThemeMode = 'light' | 'dark';
export type CardState = 'new' | 'learning' | 'review';
export type Grade = 1 | 2 | 3 | 4;

export interface Card {
  id: string;
  front: string;
  back: string;
  context: string;
  tags: string[];
  createdAt: string;
  dueAt: string;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  state: CardState;
}

export interface ReviewEvent {
  cardId: string;
  grade: Grade;
  reviewedAt: string;
  nextDueAt: string;
}

export interface ShadowSession {
  id: string;
  cardId: string;
  outcome: 'mastered' | 'practice';
  createdAt: string;
}

export interface Settings {
  locale: Locale;
  theme: ThemeMode;
  dailyGoal: number;
}

export interface AppState {
  version: typeof STATE_VERSION;
  cards: Card[];
  reviews: ReviewEvent[];
  shadowSessions: ShadowSession[];
  settings: Settings;
}

export type CardDraft = Pick<Card, 'front' | 'back' | 'context' | 'tags'>;

export const DEFAULT_SETTINGS: Settings = {
  locale: 'en',
  theme: 'light',
  dailyGoal: 12
};
