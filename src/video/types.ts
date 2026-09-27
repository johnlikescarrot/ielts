export interface TranscriptCue {
  id: string;
  text: string;
  startSeconds?: number;
  endSeconds?: number;
}

export interface VideoPracticeQuestion {
  id: string;
  cueId: string;
  sourceText: string;
  clozeText: string;
  answer: string;
  academicWord?: {
    sublist: number;
    definitionEn: string;
    definitionVi: string;
  };
  timestampSeconds?: number;
}

export interface VideoPracticeStats {
  cueCount: number;
  wordCount: number;
  uniqueWordCount: number;
  academicWordCount: number;
  estimatedMinutes: number;
}

export interface VideoPracticeSession {
  id: string;
  title: string;
  sourceUrl?: string;
  createdAt: string;
  cues: TranscriptCue[];
  questions: VideoPracticeQuestion[];
  stats: VideoPracticeStats;
}

export interface CreateVideoPracticeSessionInput {
  title: string;
  sourceUrl?: string;
  transcript: string;
  questionLimit?: number;
  createdAt?: string;
}

export interface PracticeProgress {
  answered: number;
  correct: number;
  total: number;
  accuracyPercent: number;
}
