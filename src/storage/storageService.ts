import { StorageData } from './types';
import { UserSettings, SRSCard, TestAttempt, VocabularyItem } from '../types';

export const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  examType: 'academic',
  targetBand: 7.5,
  dailyGoalMinutes: 30,
  theme: 'light',
  srsDailyTarget: 20,
  autoSpeak: true,
};

export const DEFAULT_STORAGE_DATA: StorageData = {
  settings: DEFAULT_SETTINGS,
  srsCards: [],
  customVocabulary: [],
  testHistory: [],
  bookmarks: [],
  notes: [],
};

const STORAGE_KEY = 'ielts_slayer_v1_data';

// Helper to check if Firefox webextension storage is available
function isBrowserStorageAvailable(): boolean {
  try {
    return typeof browser !== 'undefined' && !!browser.storage && !!browser.storage.local;
  } catch {
    return false;
  }
}

export class StorageService {
  private inMemoryCache: StorageData | null = null;

  async getData(): Promise<StorageData> {
    if (this.inMemoryCache) {
      return { ...this.inMemoryCache };
    }

    try {
      if (isBrowserStorageAvailable()) {
        const result = await browser.storage.local.get(STORAGE_KEY);
        if (result && result[STORAGE_KEY]) {
          const parsed = result[STORAGE_KEY];
          const settings: UserSettings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
          this.inMemoryCache = {
            settings,
            srsCards: Array.isArray(parsed.srsCards) ? parsed.srsCards : [],
            customVocabulary: Array.isArray(parsed.customVocabulary) ? parsed.customVocabulary : [],
            testHistory: Array.isArray(parsed.testHistory) ? parsed.testHistory : [],
            bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
            notes: Array.isArray(parsed.notes) ? parsed.notes : [],
          };
          return { ...this.inMemoryCache };
        }
      } else if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const settings: UserSettings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
          this.inMemoryCache = {
            settings,
            srsCards: Array.isArray(parsed.srsCards) ? parsed.srsCards : [],
            customVocabulary: Array.isArray(parsed.customVocabulary) ? parsed.customVocabulary : [],
            testHistory: Array.isArray(parsed.testHistory) ? parsed.testHistory : [],
            bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
            notes: Array.isArray(parsed.notes) ? parsed.notes : [],
          };
          return { ...this.inMemoryCache };
        }
      }
    } catch (e) {
      console.warn('StorageService: error reading storage, falling back to defaults', e);
    }

    this.inMemoryCache = { ...DEFAULT_STORAGE_DATA };
    return { ...this.inMemoryCache };
  }

  async saveData(data: Partial<StorageData>): Promise<StorageData> {
    const current = await this.getData();
    const updated: StorageData = {
      ...current,
      ...data,
      settings: { ...current.settings, ...(data.settings || {}) },
    };

    this.inMemoryCache = updated;

    try {
      if (isBrowserStorageAvailable()) {
        await browser.storage.local.set({ [STORAGE_KEY]: updated });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('StorageService: error writing storage', e);
    }

    return updated;
  }

  async getSettings(): Promise<UserSettings> {
    const data = await this.getData();
    return data.settings;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getData();
    const updatedSettings = { ...current.settings, ...settings };
    await this.saveData({ settings: updatedSettings });
    return updatedSettings;
  }

  async getSRSCards(): Promise<SRSCard[]> {
    const data = await this.getData();
    return data.srsCards || [];
  }

  async saveSRSCards(srsCards: SRSCard[]): Promise<void> {
    await this.saveData({ srsCards });
  }

  async updateSingleSRSCard(updatedCard: SRSCard): Promise<void> {
    const cards = await this.getSRSCards();
    const idx = cards.findIndex(c => c.wordId === updatedCard.wordId);
    let newCards: SRSCard[];
    if (idx >= 0) {
      newCards = [...cards];
      newCards[idx] = updatedCard;
    } else {
      newCards = [...cards, updatedCard];
    }
    await this.saveSRSCards(newCards);
  }

  async getTestHistory(): Promise<TestAttempt[]> {
    const data = await this.getData();
    return data.testHistory || [];
  }

  async addTestAttempt(attempt: Omit<TestAttempt, 'id' | 'date'> & { id?: string; date?: string }): Promise<TestAttempt> {
    const data = await this.getData();
    const newAttempt: TestAttempt = {
      ...attempt,
      id: attempt.id || `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: attempt.date || new Date().toISOString(),
    };

    const updatedHistory = [newAttempt, ...(data.testHistory || [])];
    await this.saveData({ testHistory: updatedHistory });
    return newAttempt;
  }

  async getCustomVocabulary(): Promise<VocabularyItem[]> {
    const data = await this.getData();
    return data.customVocabulary || [];
  }

  async addCustomVocabulary(vocab: VocabularyItem): Promise<void> {
    const data = await this.getData();
    const existing = data.customVocabulary || [];
    const filtered = existing.filter(v => v.id !== vocab.id && v.word.toLowerCase() !== vocab.word.toLowerCase());
    await this.saveData({ customVocabulary: [vocab, ...filtered] });
  }

  async removeCustomVocabulary(vocabId: string): Promise<void> {
    const data = await this.getData();
    const filtered = (data.customVocabulary || []).filter(v => v.id !== vocabId);
    await this.saveData({ customVocabulary: filtered });
  }

  async toggleBookmark(bookmark: {
    type: 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary';
    itemId: string;
    title: string;
  }): Promise<boolean> {
    const data = await this.getData();
    const bookmarks = data.bookmarks || [];
    const exists = bookmarks.some(b => b.type === bookmark.type && b.itemId === bookmark.itemId);

    let updatedBookmarks;
    if (exists) {
      updatedBookmarks = bookmarks.filter(b => !(b.type === bookmark.type && b.itemId === bookmark.itemId));
    } else {
      updatedBookmarks = [
        ...bookmarks,
        {
          id: `bm_${Date.now()}`,
          ...bookmark,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    await this.saveData({ bookmarks: updatedBookmarks });
    return !exists;
  }

  async getBookmarks() {
    const data = await this.getData();
    return data.bookmarks || [];
  }

  async resetAll(): Promise<void> {
    this.inMemoryCache = { ...DEFAULT_STORAGE_DATA };
    try {
      if (isBrowserStorageAvailable()) {
        await browser.storage.local.remove(STORAGE_KEY);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('StorageService: error clearing storage', e);
    }
  }
}

export const storageService = new StorageService();
