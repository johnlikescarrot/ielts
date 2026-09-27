import type {State} from 'ts-fsrs';

export type Locale = 'en' | 'vi';
export type ThemeMode = 'light' | 'dark' | 'system';
export type Skill =
  | 'vocabulary'
  | 'reading'
  | 'writing'
  | 'listening'
  | 'speaking';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
export type Surface = 'dashboard' | 'popup' | 'sidebar';

export interface Settings {
  locale: Locale;
  targetBand: number;
  dailyGoal: number;
  theme: ThemeMode;
}

export interface SerializableCard {
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: State;
  lastReview?: string;
}

export interface VocabularyCard {
  id: string;
  term: string;
  meaning: string;
  context: string;
  sourceTitle: string;
  sourceUrl: string;
  createdAt: string;
  schedule: SerializableCard;
}

export interface Capture {
  id: string;
  text: string;
  sourceTitle: string;
  sourceUrl: string;
  createdAt: string;
  cardId?: string;
}

export interface PracticeSession {
  id: string;
  skill: Skill;
  completedAt: string;
  minutes: number;
  detail: string;
}

export interface Draft {
  taskId: string;
  body: string;
  updatedAt: string;
  checkedCriteria: string[];
}

export interface StudyState {
  schemaVersion: 1;
  settings: Settings;
  cards: VocabularyCard[];
  captures: Capture[];
  sessions: PracticeSession[];
  drafts: Draft[];
}

export interface CaptureInput {
  text: string;
  sourceTitle?: string;
  sourceUrl?: string;
}

export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface WritingPrompt {
  id: string;
  kind: 'academic-1' | 'general-1' | 'task-2';
  title: string;
  prompt: string;
  minutes: number;
  minimumWords: number;
}

export interface SpeakingPrompt {
  id: string;
  topic: string;
  question: string;
  points: string[];
}
