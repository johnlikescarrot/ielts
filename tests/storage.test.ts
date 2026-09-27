import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../src/domain/seed';
import { loadState, resetState, saveState, STORAGE_KEY } from '../src/platform/storage';

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('storage adapter', () => {
  it('creates defaults when no extension or browser value is available', async () => {
    vi.stubGlobal('browser', undefined);
    await expect(loadState()).resolves.toMatchObject({ version: 1, cards: expect.any(Array) });
  });

  it('saves and loads local fallback state', async () => {
    vi.stubGlobal('browser', undefined);
    const state = createInitialState();
    state.settings.locale = 'vi';
    await saveState(state);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      settings: { locale: 'vi' }
    });
    await expect(loadState()).resolves.toMatchObject({ settings: { locale: 'vi' } });
  });

  it('recovers from invalid JSON and an invalid local object', async () => {
    vi.stubGlobal('browser', undefined);
    localStorage.setItem(STORAGE_KEY, '{bad json');
    await expect(loadState()).resolves.toMatchObject({ version: 1 });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }));
    await expect(loadState()).resolves.toMatchObject({ version: 1 });
  });

  it('uses Firefox storage when available and can reset it', async () => {
    const store: Record<string, unknown> = {};
    const get = vi.fn(async (key: string) => ({ [key]: store[key] }));
    const set = vi.fn(async (value: Record<string, unknown>) => Object.assign(store, value));
    vi.stubGlobal('browser', { storage: { local: { get, set } } });

    const state = createInitialState();
    state.settings.dailyGoal = 8;
    await saveState(state);
    expect(set).toHaveBeenCalledWith({ [STORAGE_KEY]: state });
    await expect(loadState()).resolves.toMatchObject({ settings: { dailyGoal: 8 } });
    store[STORAGE_KEY] = undefined;
    await expect(loadState()).resolves.toMatchObject({ settings: { dailyGoal: 12 } });
    store[STORAGE_KEY] = state;
    await expect(resetState()).resolves.toMatchObject({ settings: { dailyGoal: 12 } });
    expect(get).toHaveBeenCalledWith(STORAGE_KEY);
  });
});
