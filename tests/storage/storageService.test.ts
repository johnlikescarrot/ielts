import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, DEFAULT_SETTINGS } from '../../src/storage/storageService';

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

    await service.removeCustomVocabulary('cust_1');
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

  it('works with browser.storage.local mock', async () => {
    const mockStorage: Record<string, any> = {};
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

  it('hydrates from persisted localStorage and normalizes malformed array fields', async () => {
    localStorage.setItem('ielts_slayer_v1_data', JSON.stringify({
      settings: { language: 'vi', targetBand: 8.5 },
      srsCards: 'bad',
      customVocabulary: [{ id: 'v1', word: 'test' }],
      testHistory: 'bad',
      bookmarks: [{ id: 'b1' }],
      notes: 'bad',
    }));

    const localService = new StorageService();
    const data = await localService.getData();

    expect(data.settings.language).toBe('vi');
    expect(data.srsCards).toEqual([]);
    expect(data.customVocabulary).toHaveLength(1);
    expect(data.testHistory).toEqual([]);
    expect(data.bookmarks).toHaveLength(1);
    expect(data.notes).toEqual([]);
  });

  it('hydrates from browser storage and survives storage API failures', async () => {
    const stored = {
      settings: { targetBand: 9.0 },
      srsCards: [{ wordId: 'w1', interval: 0, repetition: 0, easeFactor: 2.5, nextReviewDate: '2026-09-27', history: [] }],
      customVocabulary: 'bad',
      testHistory: [],
      bookmarks: 'bad',
      notes: [],
    };
    (globalThis as any).browser = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: stored })),
          set: vi.fn(async () => { throw new Error('write failed'); }),
          remove: vi.fn(async () => { throw new Error('remove failed'); }),
        }
      }
    };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const browserService = new StorageService();
    const data = await browserService.getData();
    expect(data.settings.targetBand).toBe(9.0);
    expect(data.srsCards).toHaveLength(1);
    expect(data.customVocabulary).toEqual([]);
    expect(data.bookmarks).toEqual([]);

    await browserService.updateSettings({ targetBand: 7.0 });
    await browserService.resetAll();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
    delete (globalThis as any).browser;
  });

  it('falls back to defaults when persisted storage is corrupt or inaccessible', async () => {
    localStorage.setItem('ielts_slayer_v1_data', '{bad json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const localService = new StorageService();
    const data = await localService.getData();

    expect(data.settings).toEqual(DEFAULT_SETTINGS);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
