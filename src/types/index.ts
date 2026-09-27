export type Language = "en" | "vi";

export type SkillType =
  | "reading"
  | "listening"
  | "writing"
  | "speaking"
  | "vocabulary"
  | "video"
  | "mock-test"
  | "analytics";

export type ExamType = "academic" | "general";

export interface UserSettings {
  language: Language;
  examType: ExamType;
  targetBand: number;
  dailyGoalMinutes: number;
  theme: "light" | "dark" | "system";
  srsDailyTarget: number;
  autoSpeak: boolean;
}

export interface VocabularyItem {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definitionEn: string;
  definitionVi: string;
  example: string;
  collocations: string[];
  synonyms: string[];
  topic: string;
  bandScore: number;
  cefrLevel: "B2" | "C1" | "C2";
  isAWL?: boolean;
}

export interface SRSCard {
  wordId: string;
  interval: number; // in days
  repetition: number; // number of consecutive successful reviews
  easeFactor: number; // SM-2 ease factor (default 2.5)
  nextReviewDate: string; // ISO date string
  lastReviewedDate?: string;
  history: {
    date: string;
    grade: number; // 0 - 5
  }[];
}

// Reading types
export type ReadingQuestionType =
  | "multiple-choice"
  | "true-false-not-given"
  | "yes-no-not-given"
  | "matching-headings"
  | "sentence-completion"
  | "summary-completion";

export interface ReadingQuestion {
  id: string;
  type: ReadingQuestionType;
  questionNumber: number;
  prompt: string;
  options?: string[]; // for multiple choice or matching headings
  correctAnswer: string;
  explanationEn: string;
  explanationVi: string;
  paragraphRef?: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  examType: ExamType;
  difficulty: "Band 6.0-6.5" | "Band 7.0-7.5" | "Band 8.0-9.0";
  passageText: string;
  timeLimitMinutes: number;
  questions: ReadingQuestion[];
}

// Listening types
export type ListeningQuestionType =
  | "form-completion"
  | "multiple-choice"
  | "matching"
  | "map-labeling"
  | "short-answer"
  | "sentence-completion";

export interface ListeningQuestion {
  id: string;
  type: ListeningQuestionType;
  questionNumber: number;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanationEn: string;
  explanationVi: string;
  timestampSeconds?: number;
}

export interface ListeningSection {
  id: string;
  sectionNumber: 1 | 2 | 3 | 4;
  title: string;
  contextEn: string;
  contextVi: string;
  transcript: string;
  audioDurationSeconds: number;
  audioScript: {
    speaker: string;
    text: string;
    time: number;
  }[];
  questions: ListeningQuestion[];
}

// Writing types
export type WritingTaskType =
  "task1-academic" | "task1-general" | "task2-essay";

export interface WritingPrompt {
  id: string;
  type: WritingTaskType;
  title: string;
  category: string;
  prompt: string;
  chartDescription?: string;
  timeLimitMinutes: number;
  minWordCount: number;
  sampleEssayBand9: string;
  sampleEssayBand7: string;
  sampleAnalysis: {
    taskAchievement: string;
    coherenceCohesion: string;
    lexicalResource: string;
    grammaticalRange: string;
  };
  keyVocabulary: {
    word: string;
    meaning: string;
    usage: string;
  }[];
}

// Speaking types
export type SpeakingPart = 1 | 2 | 3;

export interface SpeakingQuestion {
  id: string;
  part: SpeakingPart;
  topic: string;
  prompt: string;
  cueCardPoints?: string[]; // for Part 2
  followUpQuestions?: string[]; // for Part 3
  modelAnswer: string;
  tipsEn: string[];
  tipsVi: string[];
  recommendedVocab: string[];
}

// Test Result / Analytics
export interface TestAttempt {
  id: string;
  date: string;
  skill: SkillType;
  testId: string;
  testTitle: string;
  rawScore?: number;
  totalQuestions?: number;
  estimatedBand: number;
  timeSpentSeconds: number;
  answers?: Record<string, string>;
  essayText?: string;
  essayAnalysis?: any;
  speakingNotes?: string;
}

export interface UserStats {
  totalStudyTimeMinutes: number;
  testsCompleted: number;
  streakDays: number;
  lastStudyDate: string;
  skillBands: {
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
    overall: number;
  };
  history: TestAttempt[];
}
