import { createInitialState } from '../domain/seed';
import { parseState } from '../domain/validate';
import type { AppState } from '../domain/types';

const STORAGE_KEY = 'focus-ielts-state-v1';

type BrowserStorage = {
  get: (key: string) => Promise<Record<string, unknown>>;
  set: (value: Record<string, unknown>) => Promise<void>;
};

function extensionStorage(): BrowserStorage | null {
  const api = globalThis.browser?.storage?.local;
  return api ? (api as BrowserStorage) : null;
}

export async function loadState(): Promise<AppState> {
  const storage = extensionStorage();
  if (storage) {
    const result = await storage.get(STORAGE_KEY);
    return parseState(result[STORAGE_KEY]) ?? createInitialState();
  }

  const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialState();
  }

  try {
    return parseState(JSON.parse(raw)) ?? createInitialState();
  } catch {
    return createInitialState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  const storage = extensionStorage();
  if (storage) {
    await storage.set({ [STORAGE_KEY]: state });
    return;
  }
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function resetState(): Promise<AppState> {
  const next = createInitialState();
  await saveState(next);
  return next;
}

export { STORAGE_KEY };
