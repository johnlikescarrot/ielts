import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, DEFAULT_SETTINGS, DEFAULT_STORAGE_DATA } from '../../src/storage/storageService';

describe('StorageService Suite', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new StorageService();
  });

  it('retrieves default data when storage is empty', async () => {
    const data = await service.getData();
    expect(data.settings).toEqual(DEFAULT_SETTINGS);
    expect(data.srsCards).toEqual([]);
    expect(data.customVocabulary).toEqual([]);
    expect(data.testHistory).toEqual([]);
  });

  it('saves and retrieves updated settings', async () => {
    const updated = await service.updateSettings({ targetBand: 8.5, language: 'vi' });
    expect(updated.targetBand).toBe(8.5);
    expect(updated.language).toBe('vi');

    const retrieved = await service.getSettings();
    expect(retrieved.targetBand).toBe(8.5);
    expect(retrieved.language).toBe('vi');
  });

  it('adds and retrieves test attempts in history', async () => {
    const attempt = await service.addTestAttempt({
      skill: 'reading',
      testId: 'read_1',
      testTitle: 'Urban Vertical Farming',
      rawScore: 35,
      totalQuestions: 40,
      estimatedBand: 8.0,
      timeSpentSeconds: 1200,
    });

    expect(attempt.id).toBeDefined();
    expect(attempt.estimatedBand).toBe(8.0);

    const history = await service.getTestHistory();
    expect(history.length).toBe(1);
    expect(history[0].testTitle).toBe('Urban Vertical Farming');
  });

  it('manages custom vocabulary additions and removals', async () => {
    const customItem = {
      id: 'cust_1',
      word: 'ephemeral',
      phonetic: '/ɪˈfemərəl/',
      partOfSpeech: 'adjective',
      definitionEn: 'Lasting for a very short time.',
      definitionVi: 'Phù du, chóng tàn.',
      example: 'Ephemeral trends in fashion.',
      collocations: ['ephemeral nature'],
      synonyms: ['fleeting'],
      topic: 'Time',
      bandScore: 8.5,
      cefrLevel: 'C2' as const,
      isAWL: true,
    };

    await service.addCustomVocabulary(customItem);
    let custom = await service.getCustomVocabulary();
    expect(custom.length).toBe(1);
    expect(custom[0].word).toBe('ephemeral');

    await service.addCustomVocabulary({ ...customItem, id: 'cust_2' });
    custom = await service.getCustomVocabulary();
    expect(custom.length).toBe(1);
    expect(custom[0].id).toBe('cust_2');

    await service.removeCustomVocabulary('cust_2');
    custom = await service.getCustomVocabulary();
    expect(custom.length).toBe(0);
  });

  it('manages SRS cards updates', async () => {
    await service.saveSRSCards([
      { wordId: 'w1', interval: 1, repetition: 1, easeFactor: 2.5, nextReviewDate: '2026-09-28', history: [] },
    ]);

    let cards = await service.getSRSCards();
    expect(cards.length).toBe(1);

    await service.updateSingleSRSCard({
      wordId: 'w1',
      interval: 6,
      repetition: 2,
      easeFactor: 2.6,
      nextReviewDate: '2026-10-04',
      history: [],
    });

    cards = await service.getSRSCards();
    expect(cards[0].interval).toBe(6);

    // Add new single card
    await service.updateSingleSRSCard({
      wordId: 'w2',
      interval: 1,
      repetition: 0,
      easeFactor: 2.5,
      nextReviewDate: '2026-09-28',
      history: [],
    });
    cards = await service.getSRSCards();
    expect(cards.length).toBe(2);
  });

  it('toggles bookmarks', async () => {
    const item = { type: 'reading' as const, itemId: 'read_1', title: 'Reading Test 1' };
    const isAdded = await service.toggleBookmark(item);
    expect(isAdded).toBe(true);

    let bookmarks = await service.getBookmarks();
    expect(bookmarks.length).toBe(1);

    const isRemoved = await service.toggleBookmark(item);
    expect(isRemoved).toBe(false);

    bookmarks = await service.getBookmarks();
    expect(bookmarks.length).toBe(0);
  });

  it('resets all data back to defaults', async () => {
    await service.updateSettings({ targetBand: 9.0 });
    await service.resetAll();

    const settings = await service.getSettings();
    expect(settings.targetBand).toBe(DEFAULT_SETTINGS.targetBand);
  });

  it('normalizes malformed persisted collections and returns isolated data', async () => {
    localStorage.setItem('ielts_slayer_v1_data', JSON.stringify({
      settings: {
        language: 'vi',
        examType: 'unsupported',
        targetBand: 99,
        dailyGoalMinutes: 'invalid',
        theme: 'unsupported',
        srsDailyTarget: 0,
        autoSpeak: 'yes',
      },
      srsCards: [{ wordId: 'malformed', history: null }],
      customVocabulary: [{ id: 'malformed', word: 'word' }],
      testHistory: [{ id: 'attempt', answers: null }],
      bookmarks: [{ id: 'bookmark', type: 'reading', itemId: 'r1', title: 'Reading', createdAt: '2026-01-01' }],
      notes: [{ id: 'note', itemId: 'r1', content: 'Note', updatedAt: '2026-01-01' }],
    }));

    const data = await service.getData();
    expect(data.settings.language).toBe('vi');
    expect(data.settings.examType).toBe('academic');
    expect(data.settings.targetBand).toBe(9);
    expect(data.settings.dailyGoalMinutes).toBe(DEFAULT_SETTINGS.dailyGoalMinutes);
    expect(data.settings.theme).toBe('light');
    expect(data.settings.srsDailyTarget).toBe(1);
    expect(data.settings.autoSpeak).toBe(true);
    expect(data.srsCards).toHaveLength(1);
    expect(data.srsCards[0].history).toEqual([]);
    expect(data.customVocabulary[0].collocations).toEqual([]);
    expect(data.customVocabulary[0].synonyms).toEqual([]);
    expect(data.testHistory[0].answers).toBeUndefined();

    data.settings.language = 'en';
    data.bookmarks.push({
      id: 'temporary',
      type: 'reading',
      itemId: 'r1',
      title: 'Temporary',
      createdAt: new Date().toISOString(),
    });
    expect((await service.getData()).settings.language).toBe('vi');
    expect((await service.getBookmarks())).toHaveLength(1);
  });

  it('falls back to defaults when local storage contains invalid JSON', async () => {
    localStorage.setItem('ielts_slayer_v1_data', '{invalid');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const data = await service.getData();

    expect(data).toEqual(DEFAULT_STORAGE_DATA);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('falls back when the browser storage global is unavailable', async () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'browser');
    Object.defineProperty(globalThis, 'browser', {
      configurable: true,
      get: () => { throw new Error('browser global unavailable'); },
    });

    const data = await new StorageService().getData();

    expect(data).toEqual(DEFAULT_STORAGE_DATA);
    if (previous) {
      Object.defineProperty(globalThis, 'browser', previous);
    } else {
      delete (globalThis as any).browser;
    }
  });

  it('keeps the in-memory copy when browser storage writes fail', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    (globalThis as any).browser = {
      storage: {
        local: {
          get: vi.fn(async () => ({})),
          set: vi.fn(async () => { throw new Error('write failed'); }),
          remove: vi.fn(async () => { throw new Error('remove failed'); }),
        },
      },
    };

    const browserService = new StorageService();
    await browserService.updateSettings({ targetBand: 8.5 });
    expect((await browserService.getSettings()).targetBand).toBe(8.5);
    await browserService.resetAll();

    expect(error).toHaveBeenCalledTimes(2);
    error.mockRestore();
    delete (globalThis as any).browser;
  });

  it('reads a persisted browser storage payload before using the cache', async () => {
    const mockStorage: Record<string, any> = {
      ielts_slayer_v1_data: {
        settings: { targetBand: 8.5 },
        srsCards: [],
      },
    };
    (globalThis as any).browser = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
          set: vi.fn(async (obj: any) => Object.assign(mockStorage, obj)),
          remove: vi.fn(async (key: string) => delete mockStorage[key]),
        }
      }
    };

    const browserService = new StorageService();
    await browserService.updateSettings({ targetBand: 8.0 });
    const s = await browserService.getSettings();
    expect(s.targetBand).toBe(8.0);

    await browserService.resetAll();
    delete (globalThis as any).browser;
  });
});
