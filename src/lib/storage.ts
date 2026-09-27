import type {StudyState} from '../types';
import {createInitialState, importState} from './model';

export const STORAGE_KEY = 'bandcraft.studyState.v1';

export interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
}

function localStorageArea(): StorageArea {
  return {
    get(key) {
      const raw = window.localStorage.getItem(key);
      return Promise.resolve(raw ? {[key]: JSON.parse(raw) as unknown} : {});
    },
    set(values) {
      const value = values[STORAGE_KEY];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return Promise.resolve();
    },
  };
}

export function defaultStorageArea(): StorageArea {
  return typeof browser === 'undefined'
    ? localStorageArea()
    : (browser.storage.local as StorageArea);
}

export async function loadState(
  area: StorageArea = defaultStorageArea(),
): Promise<StudyState> {
  const stored = await area.get(STORAGE_KEY);
  const value = stored[STORAGE_KEY];
  if (value === undefined) return createInitialState();
  try {
    return importState(value);
  } catch {
    return createInitialState();
  }
}

export async function saveState(
  state: StudyState,
  area: StorageArea = defaultStorageArea(),
): Promise<void> {
  await area.set({[STORAGE_KEY]: state});
}

export function stringifyBackup(state: StudyState): string {
  return JSON.stringify(state, null, 2);
}

export function parseBackup(raw: string): StudyState {
  return importState(JSON.parse(raw) as unknown);
}
