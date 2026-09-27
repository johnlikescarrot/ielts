import { StorageData } from './types';
import { storageService, DEFAULT_STORAGE_DATA } from './storageService';

export function exportDataAsJSON(data: StorageData): string {
  const exportPayload = {
    app: 'ielts-slayer',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function validateImportData(rawJson: string): StorageData {
  const parsed = JSON.parse(rawJson);
  const data = parsed.data || parsed;

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid backup file format: not a valid object');
  }

  // Validate settings
  const settings = {
    ...DEFAULT_STORAGE_DATA.settings,
    ...(data.settings || {}),
  };

  // Validate arrays
  const srsCards = Array.isArray(data.srsCards) ? data.srsCards : [];
  const customVocabulary = Array.isArray(data.customVocabulary) ? data.customVocabulary : [];
  const testHistory = Array.isArray(data.testHistory) ? data.testHistory : [];
  const bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
  const notes = Array.isArray(data.notes) ? data.notes : [];
  const videoSessions = Array.isArray(data.videoSessions) ? data.videoSessions : [];

  return {
    settings,
    srsCards,
    customVocabulary,
    testHistory,
    bookmarks,
    notes,
    videoSessions,
  };
}

export async function importDataFromJSON(rawJson: string): Promise<StorageData> {
  const validated = validateImportData(rawJson);
  return await storageService.saveData(validated);
}

export function triggerDownload(
  content: string,
  filename: string = `ielts-slayer-backup-${new Date().toISOString().split('T')[0]}.json`,
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
