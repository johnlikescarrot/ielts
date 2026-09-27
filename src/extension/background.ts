import type {CaptureInput} from '../types';
import {addCapture} from '../lib/model';
import {loadState, saveState, type StorageArea} from '../lib/storage';

export const CAPTURE_MENU_ID = 'bandcraft-save-selection';

type BrowserApi = Pick<
  typeof browser,
  'contextMenus' | 'i18n' | 'runtime' | 'storage'
>;

export function registerBackground(api: BrowserApi): void {
  api.runtime.onInstalled.addListener(() => {
    void api.contextMenus.removeAll().then(() => {
      api.contextMenus.create({
        id: CAPTURE_MENU_ID,
        title: api.i18n.getMessage('saveSelection'),
        contexts: ['selection'],
      });
    });
  });

  api.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== CAPTURE_MENU_ID || !info.selectionText) return;
    const input: CaptureInput = {
      text: info.selectionText,
      sourceTitle: tab?.title,
      sourceUrl: info.pageUrl ?? tab?.url,
    };
    void (async () => {
      const area = api.storage.local as StorageArea;
      const state = await loadState(area);
      await saveState(addCapture(state, input, new Date()), area);
    })();
  });
}

if (typeof browser !== 'undefined') registerBackground(browser);
