import { UserSettings, SRSCard, TestAttempt, VideoClip, VocabularyItem } from '../types';

export interface StorageData {
  settings: UserSettings;
  srsCards: SRSCard[];
  customVocabulary: VocabularyItem[];
  testHistory: TestAttempt[];
  bookmarks: {
    id: string;
    type: 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary';
    itemId: string;
    title: string;
    createdAt: string;
  }[];
  videoClips: VideoClip[];
  notes: {
    id: string;
    itemId: string;
    content: string;
    updatedAt: string;
  }[];
}
