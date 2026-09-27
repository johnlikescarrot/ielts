import { UserSettings, SRSCard, TestAttempt, VocabularyItem } from '../types';
import { VideoStudySession } from '../video/transcriptStudio';

export interface StorageData {
  settings: UserSettings;
  srsCards: SRSCard[];
  customVocabulary: VocabularyItem[];
  testHistory: TestAttempt[];
  videoSessions: VideoStudySession[];
  bookmarks: {
    id: string;
    type: 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary';
    itemId: string;
    title: string;
    createdAt: string;
  }[];
  notes: {
    id: string;
    itemId: string;
    content: string;
    updatedAt: string;
  }[];
}
