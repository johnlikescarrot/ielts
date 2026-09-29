import { describe, it, expect } from 'vitest';
import {
  exportDataAsJSON,
  validateImportData,
  importDataFromJSON,
  triggerDownload
} from '../../src/storage/exportImport';
import { DEFAULT_STORAGE_DATA } from '../../src/storage/storageService';
import { buildShadowingChunks, createShadowingSession } from '../../src/shadowing/shadowingEngine';

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
        customVocabulary: [{ word: 'test' }],
        testHistory: [{ testId: 't1' }],
        bookmarks: [{ id: 'b1' }],
        notes: [{ id: 'n1' }]
      }
    });

    const validated = validateImportData(validJson);
    expect(validated.settings.targetBand).toBe(8.5);
    expect(validated.srsCards.length).toBe(1);
    expect(validated.customVocabulary.length).toBe(1);
    expect(validated.testHistory.length).toBe(1);
    expect(validated.bookmarks.length).toBe(1);
    expect(validated.notes.length).toBe(1);
  });

  it('returns default values when fields are missing', () => {
    const emptyJson = JSON.stringify({});
    const validated = validateImportData(emptyJson);
    expect(validated.settings.targetBand).toBe(DEFAULT_STORAGE_DATA.settings.targetBand);
    expect(validated.srsCards).toEqual([]);
    expect(validated.customVocabulary).toEqual([]);
    expect(validated.testHistory).toEqual([]);
    expect(validated.shadowingSessions).toEqual([]);
    expect(validated.bookmarks).toEqual([]);
    expect(validated.notes).toEqual([]);
  });

  it('round-trips shadowing studio sessions through export and import', () => {
    const cues = [{ id: 'cue-1', startSeconds: 0, text: 'One chunk to shadow.' }];
    const record = {
      id: 'shadow-backup',
      session: createShadowingSession(buildShadowingChunks(cues, 8), new Date('2026-09-29T10:00:00Z')),
      sourceUrl: '',
      createdAt: '2026-09-29T10:00:00Z',
      updatedAt: '2026-09-29T10:00:00Z',
      completedAt: null,
    };
    const exported = exportDataAsJSON({ ...DEFAULT_STORAGE_DATA, shadowingSessions: [record] });
    const validated = validateImportData(exported);
    expect(validated.shadowingSessions).toHaveLength(1);
    expect(validated.shadowingSessions[0].id).toBe('shadow-backup');
    expect(validated.shadowingSessions[0].session.chunks[0].text).toBe('One chunk to shadow.');
  });

  it('throws an error on invalid import payload', () => {
    expect(() => validateImportData('null')).toThrow();
    expect(() => validateImportData('invalid json text')).toThrow();
    expect(() => validateImportData(JSON.stringify({ data: 123 }))).toThrow('Invalid backup file format: not a valid object');
  });

  it('throws an error for invalid data objects', () => {
    expect(() => validateImportData(JSON.stringify(123))).toThrow('Invalid backup file format: not a valid object');
    expect(() => validateImportData(JSON.stringify("some string"))).toThrow('Invalid backup file format: not a valid object');
    expect(() => validateImportData(JSON.stringify(true))).toThrow('Invalid backup file format: not a valid object');
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
