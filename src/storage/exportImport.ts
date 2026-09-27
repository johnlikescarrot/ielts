import { StorageData } from './types';
import { storageService, DEFAULT_STORAGE_DATA } from './storageService';

export function exportDataAsJSON(data: StorageData): string {
  const exportPayload = {
    app: 'ielts-slayer',
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function validateImportData(rawJson: string): StorageData {
  const parsed: unknown = JSON.parse(rawJson);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid backup file format: not a valid object');
  }

  const candidate = parsed as Record<string, unknown>;
  const dataValue = candidate.data ?? parsed;
  if (typeof dataValue !== 'object' || dataValue === null || Array.isArray(dataValue)) {
    throw new Error('Invalid backup file format: data must be an object');
  }
  const data = dataValue as Record<string, unknown>;

  // Validate settings
  const settings = {
    ...DEFAULT_STORAGE_DATA.settings,
    ...(typeof data.settings === 'object' && data.settings !== null && !Array.isArray(data.settings) ? data.settings : {}),
  };

  // Validate arrays
  const srsCards = Array.isArray(data.srsCards) ? data.srsCards : [];
  const customVocabulary = Array.isArray(data.customVocabulary) ? data.customVocabulary : [];
  const testHistory = Array.isArray(data.testHistory) ? data.testHistory : [];
  const bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
  const notes = Array.isArray(data.notes) ? data.notes : [];

  return {
    settings,
    srsCards,
    customVocabulary,
    testHistory,
    bookmarks,
    notes,
  };
}

export async function importDataFromJSON(rawJson: string): Promise<StorageData> {
  const validated = validateImportData(rawJson);
  return await storageService.saveData(validated);
}

export function triggerDownload(content: string, filename: string = `ielts-slayer-backup-${new Date().toISOString().split('T')[0]}.json`): void {
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
