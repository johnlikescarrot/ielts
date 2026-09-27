export type Locale = 'en' | 'vi';
export type Skill = 'reading' | 'listening' | 'writing' | 'speaking';
export type ReviewRating = 1 | 2 | 3 | 4;

export interface StoredSchedule {
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview?: string;
}

export interface CardSource {
  title: string;
  url: string;
}

export interface PracticeCard {
  id: string;
  prompt: string;
  answer: string;
  context: string;
  skill: Skill;
  source: CardSource | null;
  createdAt: string;
  schedule: StoredSchedule;
}

export interface ReviewEvent {
  id: string;
  cardId: string;
  rating: ReviewRating;
  reviewedAt: string;
  nextDue: string;
}

export interface Settings {
  locale: Locale;
  dailyGoal: number;
}

export interface AppState {
  schemaVersion: 1;
  settings: Settings;
  cards: PracticeCard[];
  reviews: ReviewEvent[];
}

export interface CaptureInput {
  prompt: string;
  answer?: string;
  context?: string;
  skill?: Skill;
  source?: Partial<CardSource> | null;
}
