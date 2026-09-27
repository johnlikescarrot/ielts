import { describe, it, expect } from 'vitest';
import {
  exportDataAsJSON,
  validateImportData,
  importDataFromJSON,
  triggerDownload
} from '../../src/storage/exportImport';
import { DEFAULT_STORAGE_DATA } from '../../src/storage/storageService';

describe('exportImport', () => {
  it('exports data into structured JSON with version and timestamp', () => {
    const json = exportDataAsJSON(DEFAULT_STORAGE_DATA);
    expect(json).toContain('"app": "ielts-slayer"');
    expect(json).toContain('"version": "1.1.0"');

    const parsed = JSON.parse(json);
    expect(parsed.data.settings.targetBand).toBe(DEFAULT_STORAGE_DATA.settings.targetBand);
    expect(parsed.data.videoSessions).toEqual([]);
  });

  it('validates imported JSON data format', () => {
    const validJson = JSON.stringify({
      data: {
        settings: { targetBand: 8.5 },
        srsCards: [{ wordId: 'w1', interval: 1, repetition: 1, easeFactor: 2.5, nextReviewDate: '2026-09-28', history: [] }],
        videoSessions: [{ id: 'video-1', title: 'Local captions', sourceUrl: 'https://www.youtube.com/watch?v=abc123' }],
      }
    });

    const validated = validateImportData(validJson);
    expect(validated.settings.targetBand).toBe(8.5);
    expect(validated.srsCards.length).toBe(1);
    expect(validated.videoSessions).toHaveLength(1);
    expect(validated.videoSessions[0].id).toBe('video-1');
  });

  it('throws an error on invalid import payload', () => {
    expect(() => validateImportData('null')).toThrow();
    expect(() => validateImportData('invalid json text')).toThrow();
  });

  it('imports valid JSON and saves to storage service', async () => {
    const payload = JSON.stringify({
      data: {
        settings: { targetBand: 8.0, language: 'vi' },
        srsCards: [],
      }
    });

    const saved = await importDataFromJSON(payload);
    expect(saved.settings.targetBand).toBe(8.0);
    expect(saved.settings.language).toBe('vi');
  });

  it('triggers download without crashing in DOM environment', () => {
    expect(() => triggerDownload('{}', 'test.json')).not.toThrow();
  });
});
