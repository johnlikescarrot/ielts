import {describe, expect, it, vi} from 'vitest';
import {CAPTURE_MENU_ID, registerBackground} from './background';
import {STORAGE_KEY} from '../lib/storage';
import {createInitialState} from '../lib/model';

type Listener = (...arguments_: any[]) => void;

function fakeBrowser() {
  const installed: Listener[] = [];
  const clicked: Listener[] = [];
  let stored: unknown = createInitialState();
  const create = vi.fn();
  const removeAll = vi.fn(async () => undefined);
  const api = {
    runtime: {
      onInstalled: {
        addListener: (listener: Listener) => installed.push(listener),
      },
    },
    contextMenus: {
      removeAll,
      create,
      onClicked: {addListener: (listener: Listener) => clicked.push(listener)},
    },
    i18n: {getMessage: vi.fn(() => 'Save selection')},
    storage: {
      local: {
        get: vi.fn(async () => ({[STORAGE_KEY]: stored})),
        set: vi.fn(async (values: Record<string, unknown>) => {
          stored = values[STORAGE_KEY];
        }),
      },
    },
  };
  return {api, installed, clicked, create, removeAll, getStored: () => stored};
}

describe('background', () => {
  it('installs a localized selection context menu', async () => {
    const fake = fakeBrowser();
    registerBackground(fake.api as never);
    fake.installed[0]();
    await vi.waitFor(() =>
      expect(fake.create).toHaveBeenCalledWith({
        id: CAPTURE_MENU_ID,
        title: 'Save selection',
        contexts: ['selection'],
      }),
    );
    expect(fake.removeAll).toHaveBeenCalled();
  });

  it('ignores unrelated clicks and persists valid selections', async () => {
    const fake = fakeBrowser();
    registerBackground(fake.api as never);
    fake.clicked[0]({menuItemId: 'other', selectionText: 'word'}, {});
    fake.clicked[0]({menuItemId: CAPTURE_MENU_ID}, {});
    expect(
      (fake.getStored() as ReturnType<typeof createInitialState>).captures,
    ).toHaveLength(0);
    fake.clicked[0](
      {
        menuItemId: CAPTURE_MENU_ID,
        selectionText: 'retrieval',
        pageUrl: 'https://page',
      },
      {title: 'Page'},
    );
    await vi.waitFor(() =>
      expect(
        (fake.getStored() as ReturnType<typeof createInitialState>).captures,
      ).toHaveLength(1),
    );
    fake.clicked[0](
      {menuItemId: CAPTURE_MENU_ID, selectionText: 'second'},
      {url: 'https://tab'},
    );
    await vi.waitFor(() =>
      expect(
        (fake.getStored() as ReturnType<typeof createInitialState>).captures,
      ).toHaveLength(2),
    );
  });

  it('auto-registers when imported in a Firefox background context', async () => {
    vi.resetModules();
    const fake = fakeBrowser();
    vi.stubGlobal('browser', fake.api);
    await import('./background');
    expect(fake.installed).toHaveLength(1);
  });
});
