import { UserSettings, SRSCard, TestAttempt, VocabularyItem } from '../types';
import { ShadowingSessionRecord } from '../shadowing/shadowingEngine';

export interface StorageData {
  settings: UserSettings;
  srsCards: SRSCard[];
  customVocabulary: VocabularyItem[];
  testHistory: TestAttempt[];
  shadowingSessions: ShadowingSessionRecord[];
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
