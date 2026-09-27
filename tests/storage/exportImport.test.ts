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
    expect(json).toContain('"version": "1.0.0"');

    const parsed = JSON.parse(json);
    expect(parsed.data.settings.targetBand).toBe(DEFAULT_STORAGE_DATA.settings.targetBand);
  });

  it('validates imported JSON data format', () => {
    const validJson = JSON.stringify({
      data: {
        settings: { targetBand: 8.5 },
        srsCards: [{ wordId: 'w1', interval: 1, repetition: 1, easeFactor: 2.5, nextReviewDate: '2026-09-28', history: [] }],
      }
    });

    const validated = validateImportData(validJson);
    expect(validated.settings.targetBand).toBe(8.5);
    expect(validated.srsCards.length).toBe(1);
  });

  it('throws an error on invalid import payload', () => {
    expect(() => validateImportData('null')).toThrow();
    expect(() => validateImportData('invalid json text')).toThrow();
  });

  it('normalizes legacy and malformed import arrays to safe defaults', () => {
    const validated = validateImportData(JSON.stringify({
      settings: { targetBand: 7.0 },
      srsCards: 'bad',
      customVocabulary: 'bad',
      testHistory: [],
      bookmarks: [],
      notes: 'bad',
    }));

    expect(validated.settings.targetBand).toBe(7.0);
    expect(validated.srsCards).toEqual([]);
    expect(validated.customVocabulary).toEqual([]);
    expect(validated.testHistory).toEqual([]);
    expect(validated.bookmarks).toEqual([]);
    expect(validated.notes).toEqual([]);
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
