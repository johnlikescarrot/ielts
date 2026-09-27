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

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneData(data: StorageData): StorageData {
  return {
    settings: { ...data.settings },
    srsCards: data.srsCards.map(card => ({
      ...card,
      history: Array.isArray(card.history) ? card.history.map(entry => ({ ...entry })) : [],
    })),
    customVocabulary: data.customVocabulary.map(item => ({
      ...item,
      collocations: Array.isArray(item.collocations) ? [...item.collocations] : [],
      synonyms: Array.isArray(item.synonyms) ? [...item.synonyms] : [],
    })),
    testHistory: data.testHistory.map(attempt => ({
      ...attempt,
      answers: isRecord(attempt.answers) ? { ...attempt.answers } : undefined,
    })),
    bookmarks: data.bookmarks.map(bookmark => ({ ...bookmark })),
    notes: data.notes.map(note => ({ ...note })),
  };
}

function boundedNumber(value: unknown, fallback: number, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeSettings(value: unknown): UserSettings {
  const settings = isRecord(value) ? value : {};
  return {
    language: settings.language === 'vi' ? 'vi' : 'en',
    examType: settings.examType === 'general' ? 'general' : 'academic',
    targetBand: boundedNumber(settings.targetBand, DEFAULT_SETTINGS.targetBand, 5, 9),
    dailyGoalMinutes: boundedNumber(settings.dailyGoalMinutes, DEFAULT_SETTINGS.dailyGoalMinutes, 5, 240),
    theme: settings.theme === 'dark' || settings.theme === 'system' ? settings.theme : 'light',
    srsDailyTarget: boundedNumber(settings.srsDailyTarget, DEFAULT_SETTINGS.srsDailyTarget, 1, 100),
    autoSpeak: typeof settings.autoSpeak === 'boolean' ? settings.autoSpeak : DEFAULT_SETTINGS.autoSpeak,
  };
}

function normalizeData(value: unknown): StorageData {
  const parsed = isRecord(value) ? value : {};

  return {
    settings: normalizeSettings(parsed.settings),
    srsCards: Array.isArray(parsed.srsCards) ? parsed.srsCards as SRSCard[] : [],
    customVocabulary: Array.isArray(parsed.customVocabulary) ? parsed.customVocabulary as VocabularyItem[] : [],
    testHistory: Array.isArray(parsed.testHistory) ? parsed.testHistory as TestAttempt[] : [],
    bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks as StorageData['bookmarks'] : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes as StorageData['notes'] : [],
  };
}

// Helper to check if Firefox webextension storage is available.
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
      return cloneData(this.inMemoryCache);
    }

    try {
      let persisted: unknown;
      if (isBrowserStorageAvailable()) {
        const result = await browser.storage.local.get(STORAGE_KEY);
        persisted = result?.[STORAGE_KEY];
      } else if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        persisted = raw ? JSON.parse(raw) : undefined;
      }

      if (persisted !== undefined && persisted !== null) {
        this.inMemoryCache = normalizeData(persisted);
        return cloneData(this.inMemoryCache);
      }
    } catch (error) {
      console.warn('StorageService: error reading storage, falling back to defaults', error);
    }

    this.inMemoryCache = cloneData(DEFAULT_STORAGE_DATA);
    return cloneData(this.inMemoryCache);
  }

  async saveData(data: Partial<StorageData>): Promise<StorageData> {
    const current = await this.getData();
    const updated = normalizeData({ ...current, ...data, settings: { ...current.settings, ...(data.settings || {}) } });
    this.inMemoryCache = updated;

    try {
      if (isBrowserStorageAvailable()) {
        await browser.storage.local.set({ [STORAGE_KEY]: updated });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('StorageService: error writing storage', error);
    }

    return cloneData(updated);
  }

  async getSettings(): Promise<UserSettings> {
    const data = await this.getData();
    return { ...data.settings };
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getData();
    const updatedSettings = { ...current.settings, ...settings };
    await this.saveData({ settings: updatedSettings });
    return updatedSettings;
  }

  async getSRSCards(): Promise<SRSCard[]> {
    const data = await this.getData();
    return data.srsCards;
  }

  async saveSRSCards(srsCards: SRSCard[]): Promise<void> {
    await this.saveData({ srsCards });
  }

  async updateSingleSRSCard(updatedCard: SRSCard): Promise<void> {
    const cards = await this.getSRSCards();
    const idx = cards.findIndex(card => card.wordId === updatedCard.wordId);
    const newCards = idx >= 0
      ? cards.map((card, cardIndex) => cardIndex === idx ? updatedCard : card)
      : [...cards, updatedCard];
    await this.saveSRSCards(newCards);
  }

  async getTestHistory(): Promise<TestAttempt[]> {
    const data = await this.getData();
    return data.testHistory;
  }

  async addTestAttempt(attempt: Omit<TestAttempt, 'id' | 'date'> & { id?: string; date?: string }): Promise<TestAttempt> {
    const data = await this.getData();
    const newAttempt: TestAttempt = {
      ...attempt,
      id: attempt.id || `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: attempt.date || new Date().toISOString(),
    };

    await this.saveData({ testHistory: [newAttempt, ...data.testHistory] });
    return newAttempt;
  }

  async getCustomVocabulary(): Promise<VocabularyItem[]> {
    const data = await this.getData();
    return data.customVocabulary;
  }

  async addCustomVocabulary(vocab: VocabularyItem): Promise<void> {
    const data = await this.getData();
    const filtered = data.customVocabulary.filter(item => (
      item.id !== vocab.id && item.word.toLowerCase() !== vocab.word.toLowerCase()
    ));
    await this.saveData({ customVocabulary: [vocab, ...filtered] });
  }

  async removeCustomVocabulary(vocabId: string): Promise<void> {
    const data = await this.getData();
    await this.saveData({ customVocabulary: data.customVocabulary.filter(item => item.id !== vocabId) });
  }

  async toggleBookmark(bookmark: {
    type: 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary';
    itemId: string;
    title: string;
  }): Promise<boolean> {
    const data = await this.getData();
    const exists = data.bookmarks.some(item => item.type === bookmark.type && item.itemId === bookmark.itemId);
    const bookmarks = exists
      ? data.bookmarks.filter(item => !(item.type === bookmark.type && item.itemId === bookmark.itemId))
      : [...data.bookmarks, {
        id: `bm_${Date.now()}`,
        ...bookmark,
        createdAt: new Date().toISOString(),
      }];

    await this.saveData({ bookmarks });
    return !exists;
  }

  async getBookmarks(): Promise<StorageData['bookmarks']> {
    const data = await this.getData();
    return data.bookmarks;
  }

  async resetAll(): Promise<void> {
    this.inMemoryCache = cloneData(DEFAULT_STORAGE_DATA);
    try {
      if (isBrowserStorageAvailable()) {
        await browser.storage.local.remove(STORAGE_KEY);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('StorageService: error clearing storage', error);
    }
  }
}

export const storageService = new StorageService();
