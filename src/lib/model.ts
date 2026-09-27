export type Language = "en" | "vi";
export type Skill = "listening" | "reading" | "writing" | "speaking";
export type Rating = 1 | 2 | 3 | 4;

export interface ReviewState {
  repetitions: number;
  intervalDays: number;
  ease: number;
  dueAt: number;
  lapses: number;
}

export interface StudyCard {
  id: string;
  front: string;
  back: string;
  context: string;
  sourceTitle: string;
  sourceUrl: string;
  createdAt: number;
  review: ReviewState;
}

export interface SessionLog {
  id: string;
  skill: Skill;
  completedAt: number;
  durationMinutes: number;
  score?: number;
}

export interface Settings {
  language: Language;
  dailyGoalMinutes: number;
  targetBand: number;
  examDate: string;
  reduceMotion: boolean;
}

export interface AppData {
  version: 1;
  cards: StudyCard[];
  sessions: SessionLog[];
  settings: Settings;
  streakDates: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  language: "en",
  dailyGoalMinutes: 20,
  targetBand: 7.5,
  examDate: "",
  reduceMotion: false,
};

export const EMPTY_DATA: AppData = {
  version: 1,
  cards: [],
  sessions: [],
  settings: DEFAULT_SETTINGS,
  streakDates: [],
};
