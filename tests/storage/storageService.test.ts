import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  StorageService,
  DEFAULT_SETTINGS,
} from "../../src/storage/storageService";

describe("StorageService Suite", () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new StorageService();
  });

  it("retrieves default data when storage is empty", async () => {
    const data = await service.getData();
    expect(data.settings).toEqual(DEFAULT_SETTINGS);
    expect(data.srsCards).toEqual([]);
    expect(data.customVocabulary).toEqual([]);
    expect(data.testHistory).toEqual([]);
  });

  it("migrates saved local data while keeping every persisted collection usable", async () => {
    localStorage.setItem(
      "ielts_slayer_v1_data",
      JSON.stringify({
        settings: { language: "vi", targetBand: 8 },
        srsCards: "invalid",
        customVocabulary: [],
        testHistory: [],
        bookmarks: [],
        videoClips: [
          {
            id: "clip_saved",
            provider: "bilibili",
            sourceUrl: "https://bilibili.com/video/1",
            sourceTitle: "Saved",
            startSeconds: 3,
            endSeconds: 8,
            createdAt: "2026-09-27T00:00:00.000Z",
          },
        ],
        notes: [],
      }),
    );

    const data = await service.getData();
    expect(data.settings.language).toBe("vi");
    expect(data.srsCards).toEqual([]);
    expect(data.videoClips).toHaveLength(1);
  });

  it("saves and retrieves updated settings", async () => {
    const updated = await service.updateSettings({
      targetBand: 8.5,
      language: "vi",
    });
    expect(updated.targetBand).toBe(8.5);
    expect(updated.language).toBe("vi");

    const retrieved = await service.getSettings();
    expect(retrieved.targetBand).toBe(8.5);
    expect(retrieved.language).toBe("vi");
  });

  it("adds and retrieves test attempts in history", async () => {
    const attempt = await service.addTestAttempt({
      skill: "reading",
      testId: "read_1",
      testTitle: "Urban Vertical Farming",
      rawScore: 35,
      totalQuestions: 40,
      estimatedBand: 8.0,
      timeSpentSeconds: 1200,
    });

    expect(attempt.id).toBeDefined();
    expect(attempt.estimatedBand).toBe(8.0);

    const history = await service.getTestHistory();
    expect(history.length).toBe(1);
    expect(history[0].testTitle).toBe("Urban Vertical Farming");
  });

  it("manages custom vocabulary additions and removals", async () => {
    const customItem = {
      id: "cust_1",
      word: "ephemeral",
      phonetic: "/ɪˈfemərəl/",
      partOfSpeech: "adjective",
      definitionEn: "Lasting for a very short time.",
      definitionVi: "Phù du, chóng tàn.",
      example: "Ephemeral trends in fashion.",
      collocations: ["ephemeral nature"],
      synonyms: ["fleeting"],
      topic: "Time",
      bandScore: 8.5,
      cefrLevel: "C2" as const,
      isAWL: true,
    };

    await service.addCustomVocabulary(customItem);
    let custom = await service.getCustomVocabulary();
    expect(custom.length).toBe(1);
    expect(custom[0].word).toBe("ephemeral");

    await service.removeCustomVocabulary("cust_1");
    custom = await service.getCustomVocabulary();
    expect(custom.length).toBe(0);
  });

  it("manages SRS cards updates", async () => {
    await service.saveSRSCards([
      {
        wordId: "w1",
        interval: 1,
        repetition: 1,
        easeFactor: 2.5,
        nextReviewDate: "2026-09-28",
        history: [],
      },
    ]);

    let cards = await service.getSRSCards();
    expect(cards.length).toBe(1);

    await service.updateSingleSRSCard({
      wordId: "w1",
      interval: 6,
      repetition: 2,
      easeFactor: 2.6,
      nextReviewDate: "2026-10-04",
      history: [],
    });

    cards = await service.getSRSCards();
    expect(cards[0].interval).toBe(6);

    // Add new single card
    await service.updateSingleSRSCard({
      wordId: "w2",
      interval: 1,
      repetition: 0,
      easeFactor: 2.5,
      nextReviewDate: "2026-09-28",
      history: [],
    });
    cards = await service.getSRSCards();
    expect(cards.length).toBe(2);
  });

  it("deduplicates and removes locally saved video clips", async () => {
    const first = await service.addVideoClip({
      provider: "youtube",
      sourceUrl: "https://www.youtube.com/watch?v=abc",
      sourceTitle: "Listening loop",
      startSeconds: 10,
      endSeconds: 20,
    });
    await service.addVideoClip({
      provider: "youtube",
      sourceUrl: "https://www.youtube.com/watch?v=abc",
      sourceTitle: "Listening loop updated",
      startSeconds: 10,
      endSeconds: 20,
    });

    const clips = await service.getVideoClips();
    expect(clips).toHaveLength(1);
    expect(clips[0].sourceTitle).toBe("Listening loop updated");

    await service.removeVideoClip(clips[0].id);
    expect(await service.getVideoClips()).toEqual([]);
    expect(first.id).toBeDefined();
  });

  it("toggles bookmarks", async () => {
    const item = {
      type: "reading" as const,
      itemId: "read_1",
      title: "Reading Test 1",
    };
    const isAdded = await service.toggleBookmark(item);
    expect(isAdded).toBe(true);

    let bookmarks = await service.getBookmarks();
    expect(bookmarks.length).toBe(1);

    const isRemoved = await service.toggleBookmark(item);
    expect(isRemoved).toBe(false);

    bookmarks = await service.getBookmarks();
    expect(bookmarks.length).toBe(0);
  });

  it("resets all data back to defaults", async () => {
    await service.updateSettings({ targetBand: 9.0 });
    await service.resetAll();

    const settings = await service.getSettings();
    expect(settings.targetBand).toBe(DEFAULT_SETTINGS.targetBand);
  });

  it("falls back safely when browser and local storage operations fail", async () => {
    Object.defineProperty(globalThis, "browser", {
      configurable: true,
      get: () => {
        throw new Error("browser storage unavailable");
      },
    });
    const failedBrowserService = new StorageService();
    await expect(failedBrowserService.getData()).resolves.toEqual(
      expect.objectContaining({ settings: DEFAULT_SETTINGS }),
    );
    delete (globalThis as any).browser;

    localStorage.setItem("ielts_slayer_v1_data", "not-json");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(new StorageService().getData()).resolves.toEqual(
      expect.objectContaining({ settings: DEFAULT_SETTINGS }),
    );
    warning.mockRestore();

    const writeError = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("write failed");
      });
    await new StorageService().saveData({
      settings: { ...DEFAULT_SETTINGS, targetBand: 8 },
    });
    writeError.mockRestore();

    const removeError = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("remove failed");
      });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await new StorageService().resetAll();
    error.mockRestore();
    removeError.mockRestore();
  });

  it("hydrates and sanitizes persisted local data", async () => {
    localStorage.setItem(
      "ielts_slayer_v1_data",
      JSON.stringify({
        settings: { targetBand: 8.5 },
        srsCards: "invalid",
        customVocabulary: null,
        testHistory: [{ id: "saved" }],
      }),
    );

    const data = await new StorageService().getData();
    expect(data.settings.targetBand).toBe(8.5);
    expect(data.srsCards).toEqual([]);
    expect(data.customVocabulary).toEqual([]);
    expect(data.testHistory).toEqual([{ id: "saved" }]);
    expect(data.bookmarks).toEqual([]);
    expect(data.notes).toEqual([]);
  });

  it("hydrates persisted browser storage before using the in-memory cache", async () => {
    (globalThis as any).browser = {
      storage: {
        local: {
          get: vi.fn(async () => ({
            ielts_slayer_v1_data: {
              settings: { language: "vi" },
              srsCards: [{ wordId: "browser-card" }],
              customVocabulary: [],
              testHistory: [],
              bookmarks: [],
              notes: [],
            },
          })),
        },
      },
    };

    const data = await new StorageService().getData();
    expect(data.settings.language).toBe("vi");
    expect(data.srsCards).toHaveLength(1);
    delete (globalThis as any).browser;
  });

  it("works with browser.storage.local mock", async () => {
    const mockStorage: Record<string, any> = {};
    (globalThis as any).browser = {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
          set: vi.fn(async (obj: any) => Object.assign(mockStorage, obj)),
          remove: vi.fn(async (key: string) => delete mockStorage[key]),
        },
      },
    };

    mockStorage.ielts_slayer_v1_data = {
      settings: { language: "vi" },
      srsCards: [],
      customVocabulary: [],
      testHistory: [],
      bookmarks: [],
      videoClips: [],
      notes: [],
    };
    const loadedBrowserService = new StorageService();
    expect((await loadedBrowserService.getSettings()).language).toBe("vi");

    const browserService = new StorageService();
    await browserService.updateSettings({ targetBand: 8.0 });
    const s = await browserService.getSettings();
    expect(s.targetBand).toBe(8.0);

    await browserService.resetAll();
    delete (globalThis as any).browser;
  });
});
