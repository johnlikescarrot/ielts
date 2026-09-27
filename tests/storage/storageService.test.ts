import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, DEFAULT_SETTINGS } from '../../src/storage/storageService';
import { createVideoPracticeSession } from '../../src/video/transcriptPractice';

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

  it('saves, replaces, and removes private video practice sessions', async () => {
    const session = createVideoPracticeSession({
      title: 'Saved clip',
      transcript: 'Research improves educational outcomes for learners.',
      createdAt: '2026-09-27T12:00:00.000Z',
    });

    await service.saveVideoSession(session);
    await service.saveVideoSession({ ...session, title: 'Updated saved clip' });

    expect(await service.getVideoSessions()).toEqual([
      expect.objectContaining({ id: session.id, title: 'Updated saved clip' }),
    ]);

    await service.removeVideoSession(session.id);
    expect(await service.getVideoSessions()).toEqual([]);
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
});
