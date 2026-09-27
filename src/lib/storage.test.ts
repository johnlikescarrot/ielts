import {describe, expect, it, vi} from 'vitest';
import {createInitialState} from './model';
import {
  defaultStorageArea,
  loadState,
  parseBackup,
  saveState,
  STORAGE_KEY,
  stringifyBackup,
  type StorageArea,
} from './storage';

function area(value?: unknown): StorageArea & {set: ReturnType<typeof vi.fn>} {
  return {
    get: vi.fn(async () => (value === undefined ? {} : {[STORAGE_KEY]: value})),
    set: vi.fn(async () => undefined),
  };
}

describe('storage', () => {
  it('loads defaults for missing and invalid stored data', async () => {
    expect(await loadState(area())).toEqual(createInitialState());
    expect(await loadState(area({bad: true}))).toEqual(createInitialState());
  });

  it('loads, saves, exports, and parses a state', async () => {
    const state = createInitialState();
    expect(await loadState(area(state))).toEqual(state);
    const fake = area();
    await saveState(state, fake);
    expect(fake.set).toHaveBeenCalledWith({[STORAGE_KEY]: state});
    expect(parseBackup(stringifyBackup(state))).toEqual(state);
    expect(() => parseBackup('{bad')).toThrow();
  });

  it('uses localStorage outside the extension', async () => {
    const state = createInitialState();
    const local = defaultStorageArea();
    await local.set({[STORAGE_KEY]: state});
    expect(await local.get(STORAGE_KEY)).toEqual({[STORAGE_KEY]: state});
    window.localStorage.removeItem(STORAGE_KEY);
    expect(await local.get(STORAGE_KEY)).toEqual({});
  });

  it('uses Firefox storage when available', () => {
    const fake = area();
    vi.stubGlobal('browser', {storage: {local: fake}});
    expect(defaultStorageArea()).toBe(fake);
  });
});
