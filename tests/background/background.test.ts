import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeBackground, updateReviewBadge } from '../../src/background/background';
import { storageService } from '../../src/storage/storageService';

describe('background Suite', () => {
  let mockBrowser: any;

  beforeEach(() => {
    mockBrowser = {
      runtime: {
        onInstalled: { addListener: vi.fn() },
        onMessage: { addListener: vi.fn() },
        getURL: (url: string) => `moz-extension://test/${url}`,
      },
      contextMenus: {
        create: vi.fn(),
        onClicked: { addListener: vi.fn() },
      },
      tabs: {
        create: vi.fn(),
      },
      action: {
        setBadgeText: vi.fn(),
        setBadgeBackgroundColor: vi.fn(),
      },
    };
    (globalThis as any).browser = mockBrowser;
  });

  it('registers lifecycle and context menu listeners', () => {
    initializeBackground();
    expect(mockBrowser.runtime.onInstalled.addListener).toHaveBeenCalled();
    expect(mockBrowser.contextMenus.onClicked.addListener).toHaveBeenCalled();
    expect(mockBrowser.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  it('executes onInstalled listener and creates context menus', () => {
    initializeBackground();
    const installedCallback = mockBrowser.runtime.onInstalled.addListener.mock.calls[0][0];
    installedCallback();

    expect(mockBrowser.contextMenus.create).toHaveBeenCalledTimes(2);
  });

  it('executes context menu onClicked listener', () => {
    initializeBackground();
    const clickCallback = mockBrowser.contextMenus.onClicked.addListener.mock.calls[0][0];
    
    clickCallback({ menuItemId: 'ielts-open-dashboard' });
    expect(mockBrowser.tabs.create).toHaveBeenCalledWith({ url: 'moz-extension://test/dashboard.html' });

    clickCallback({ menuItemId: 'ielts-lookup-selection' });
    expect(mockBrowser.tabs.create).toHaveBeenCalledWith({ url: 'moz-extension://test/dashboard.html' });

    clickCallback({ menuItemId: 'unknown-id' });
  });

  it('executes onMessage listener for SAVE_VOCABULARY and other messages', async () => {
    initializeBackground();
    const messageCallback = mockBrowser.runtime.onMessage.addListener.mock.calls[0][0];

    const result = await messageCallback({
      type: 'SAVE_VOCABULARY',
      data: {
        id: 'msg_1',
        word: 'paradigm',
        phonetic: '',
        definitionEn: 'Model',
        definitionVi: 'Mô hình',
        partOfSpeech: 'noun',
        example: '',
        collocations: [],
        synonyms: [],
        topic: 'Test',
        bandScore: 8.5,
        cefrLevel: 'C2',
      }
    });

    expect(result).toEqual({ success: true });

    const unknownResult = await messageCallback({ type: 'UNKNOWN' });
    expect(unknownResult).toBe(false);
  });

  it('updates review badge with due cards and with zero cards', async () => {
    await storageService.saveSRSCards([
      { wordId: 'w1', interval: 0, repetition: 0, easeFactor: 2.5, nextReviewDate: '2020-01-01', history: [] },
    ]);
    await updateReviewBadge();
    expect(mockBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '1' });
    expect(mockBrowser.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#4f46e5' });

    await storageService.saveSRSCards([]);
    await updateReviewBadge();
    expect(mockBrowser.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
  });

  it('handles errors when updating review badge', async () => {
    const error = new Error('Storage error');
    vi.spyOn(storageService, 'getSRSCards').mockRejectedValueOnce(error);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await updateReviewBadge();

    expect(consoleSpy).toHaveBeenCalledWith('Could not update review badge', error);

    consoleSpy.mockRestore();
  });
});
